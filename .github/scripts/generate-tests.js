// .github/scripts/generate-tests.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const glob = require('glob');

class CodeAnalyzer {
  constructor() {
    this.tsParser = require('@typescript-eslint/parser');
    this.getParamName = this.getParamName.bind(this);
  }

  getChangedFiles() {
    try {
      const out = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf8' });
      return out.split('\n').filter(f => f && /\.(ts|js|vue)$/.test(f));
    } catch {
      return glob.sync('src/**/*.{ts,js}');
    }
  }

  extractFunctions(filePath) {
    try {
      const src = fs.readFileSync(filePath, 'utf8');
      const parseResult = this.tsParser.parseForESLint(src, {
        filePath,
        loc: true,
        range: true,
        tokens: true,
        comment: true,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      });
      const ast = parseResult.ast;

      const funcs = [];
      const traverse = (node, parent = null, visited = new Set()) => {
        // Prevent infinite recursion on circular references
        if (visited.has(node)) return;
        visited.add(node);

        try {
          if (node.type === 'FunctionDeclaration' && node.id) {
            funcs.push(this.buildFn(node.id.name, 'function', node.params, node.loc, this.isExported(node, parent)));
          }
          else if (node.type === 'MethodDefinition' && node.key && node.value) {
            const name = node.key.name || '<anonymous>';
            funcs.push(this.buildFn(name, 'method', node.value.params, node.loc, true));
          }
          else if (node.type === 'ArrowFunctionExpression' && parent?.type === 'VariableDeclarator') {
            const name = parent.id?.name || '<arrow>';
            funcs.push(this.buildFn(name, 'arrow', node.params, node.loc, this.isExported(parent, null)));
          }
        } catch (inner) {
          console.warn(`⚠️  Skipped bad node in ${filePath}:`, inner.message);
        }

        for (const k in node) {
          const child = node[k];
          if (child?.type) traverse(child, node, visited);
          else if (Array.isArray(child)) child.forEach(c => c?.type && traverse(c, node, visited));
        }
      };

      traverse(ast);
      console.log(`✅ Parsed ${funcs.length} functions from ${filePath}`);
      return funcs;
    } catch (err) {
      console.error(`❌ Error parsing ${filePath}:`, err.message);
      console.error(err.stack || err);
      return [];
    }
  }

  buildFn(name, type, params, loc, exported) {
    return {
      name,
      type,
      params: params.map(this.getParamName),
      line: loc?.start?.line || 0,
      exported,
    };
  }

  getParamName(param) {
    if (!param) return 'param';
    switch (param.type) {
      case 'Identifier': return param.name;
      case 'AssignmentPattern': return this.getParamName(param.left);
      case 'RestElement': return '...' + this.getParamName(param.argument);
      case 'ObjectPattern': return '{...}';
      case 'ArrayPattern': return '[...]';
      default: return param.type || 'param';
    }
  }

  isExported(node, parent) {
    const t = parent?.type;
    return t === 'ExportNamedDeclaration' || t === 'ExportDefaultDeclaration';
  }

  findTestFile(src) {
    const d = path.dirname(src), b = path.basename(src, path.extname(src));
    const tests = [
      `${d}/${b}.test.ts`,
      `${d}/${b}.spec.ts`,
      `${d}/__tests__/${b}.test.ts`,
      `tests/${d}/${b}.test.ts`,
      `__tests__/${d}/${b}.test.ts`,
    ];
    return tests.find(fs.existsSync);
  }

  getTestedFunctions(tf) {
    if (!fs.existsSync(tf)) return [];
    const c = fs.readFileSync(tf, 'utf8');
    return (c.match(/(?:describe|it|test)\(['"`]([^'"`]+)/g) || [])
        .map(m => m.split(/['"`]/)[1]);
  }

  generateTestFilePath(src) {
    const d = path.dirname(src), b = path.basename(src, path.extname(src));
    return `${d}/${b}.test.ts`;
  }

  stageTestFile(outFile, testCode, srcFile) {
    const dir = path.dirname(outFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    let content = fs.existsSync(outFile)
        ? fs.readFileSync(outFile, 'utf8')
        : `import { ${this.extractExportedNames(srcFile).join(', ')} } from '${path.relative(dir, srcFile).replace(/\\/g, '/')}';\n\n`;
    content += `\n${testCode}\n`;
    fs.writeFileSync(outFile, content, 'utf8');
  }

  extractExportedNames(srcFile) {
    try {
      const txt = fs.readFileSync(srcFile, 'utf8');
      return (txt.match(/export\s+(?:function|const|class)\s+(\w+)/g) || [])
          .map(m => m.split(' ').pop());
    } catch {
      return [];
    }
  }
}

// ... the rest of TestGenerator and main() remains unchanged ...
