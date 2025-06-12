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
      const output = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf8' });
      return output.split('\n').filter(file =>
          file && (file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.vue'))
      );
    } catch (error) {
      console.log('Could not get changed files, analyzing all source files');
      return glob.sync('src/**/*.{ts,js}');
    }
  }

  extractFunctions(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const ast = this.tsParser.parse(content, {
        ecmaVersion: 2020,
        sourceType: 'module',
        loc: true,
      });

      const functions = [];

      const traverse = (node, parent = null) => {
        try {
          if (node.type === 'FunctionDeclaration' && node.id) {
            functions.push({
              name: node.id.name,
              type: 'function',
              params: node.params.map(p => p.name || p.type || 'param'),
              line: node.loc?.start?.line ?? 0,
              exported: this.isExported(node, parent)
            });
          } else if (node.type === 'MethodDefinition' && node.key && node.value) {
            functions.push({
              name: node.key.name || 'anonymous',
              type: 'method',
              params: node.value.params?.map(p => p.name || p.type || 'param') ?? [],
              line: node.loc?.start?.line ?? 0,
              exported: true
            });
          } else if (node.type === 'ArrowFunctionExpression' && parent?.type === 'VariableDeclarator') {
            functions.push({
              name: parent.id?.name || 'arrowFunc',
              type: 'arrow',
              params: node.params?.map(p => p.name || p.type || 'param') ?? [],
              line: node.loc?.start?.line ?? 0,
              exported: this.isExported(parent, null)
            });
          }
        } catch (innerErr) {
          console.warn(`⚠️ Failed to process node in ${filePath}:`, innerErr.message);
        }

        for (const key in node) {
          if (node[key] && typeof node[key] === 'object') {
            if (Array.isArray(node[key])) {
              node[key].forEach(child => {
                if (child && typeof child === 'object' && child.type) {
                  traverse(child, node);
                }
              });
            } else if (node[key].type) {
              traverse(node[key], node);
            }
          }
        }
      };

      traverse(ast);
      return functions;
    } catch (error) {
      console.error(`❌ Error parsing ${filePath}:`, error.message);
      console.error(error.stack || error);
      return [];
    }
  }


  getParamName(param) {
    if (!param) return 'unknown';
    if (param.type === 'Identifier') return param.name;
    if (param.type === 'AssignmentPattern') return this.getParamName(param.left);
    if (param.type === 'RestElement') return '...' + this.getParamName(param.argument);
    if (param.type === 'ObjectPattern') return '{...}';
    if (param.type === 'ArrayPattern') return '[...]';
    return param.type || 'unknown';
  }

  isExported(node, parent) {
    return parent?.type === 'ExportNamedDeclaration' ||
        parent?.type === 'ExportDefaultDeclaration' ||
        node?.type === 'ExportNamedDeclaration' ||
        node?.type === 'ExportDefaultDeclaration';
  }

  findTestFile(sourceFile) {
    const dir = path.dirname(sourceFile);
    const name = path.basename(sourceFile, path.extname(sourceFile));

    const possibleTestPaths = [
      path.join(dir, `${name}.test.ts`),
      path.join(dir, `${name}.spec.ts`),
      path.join(dir, '__tests__', `${name}.test.ts`),
      path.join('tests', dir, `${name}.test.ts`),
      path.join('__tests__', dir, `${name}.test.ts`)
    ];

    return possibleTestPaths.find(testPath => fs.existsSync(testPath));
  }

  getTestedFunctions(testFilePath) {
    if (!fs.existsSync(testFilePath)) return [];

    try {
      const content = fs.readFileSync(testFilePath, 'utf8');
      const testMatches = content.match(/(?:describe|it|test)\s*\(\s*['"`]([^'"`]+)['"`]/g) || [];
      return testMatches.map(match => {
        const nameMatch = match.match(/['"`]([^'"`]+)['"`]/);
        return nameMatch ? nameMatch[1] : '';
      });
    } catch (error) {
      return [];
    }
  }

  generateTestFilePath(sourceFile) {
    const dir = path.dirname(sourceFile);
    const name = path.basename(sourceFile, path.extname(sourceFile));
    return path.join(dir, `${name}.test.ts`);
  }

  stageTestFile(testFilePath, testCode, sourceFile) {
    const dir = path.dirname(testFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let content = '';
    if (fs.existsSync(testFilePath)) {
      content = fs.readFileSync(testFilePath, 'utf8');
    } else {
      const relativePath = path.relative(path.dirname(testFilePath), sourceFile);
      content = `import { ${this.extractExportedNames(sourceFile).join(', ')} } from '${relativePath.replace(/\\/g, '/')}';\n\n`;
    }

    content += `\n${testCode}\n`;
    fs.writeFileSync(testFilePath, content, 'utf8');
  }

  appendToTestFile(testFilePath, testCode, sourceFile) {
    this.stageTestFile(testFilePath, testCode, sourceFile);
  }

  extractExportedNames(sourceFile) {
    try {
      const content = fs.readFileSync(sourceFile, 'utf8');
      const exportMatches = content.match(/export\s+(?:function|const|class)\s+(\w+)/g) || [];
      return exportMatches.map(match => {
        const nameMatch = match.match(/(\w+)$/);
        return nameMatch ? nameMatch[1] : '';
      }).filter(Boolean);
    } catch {
      return [];
    }
  }
}

class TestGenerator {
  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;
    this.useAnthropic = !!process.env.ANTHROPIC_API_KEY;
  }

  async generateTest(sourceFile, functionInfo, existingTests) {
    const sourceCode = fs.readFileSync(sourceFile, 'utf8');
    const prompt = this.buildPrompt(sourceFile, functionInfo, sourceCode, existingTests);

    try {
      let generatedTest;

      if (this.useAnthropic) {
        generatedTest = await this.callAnthropic(prompt);
      } else {
        generatedTest = await this.callOpenAI(prompt);
      }

      return this.cleanGeneratedTest(generatedTest);
    } catch (error) {
      console.error(`Error generating test for ${functionInfo.name}:`, error.message);
      return null;
    }
  }

  buildPrompt(sourceFile, functionInfo, sourceCode, existingTests) {
    const basePrompt = `You are a expert TypeScript/Jest test generator. Generate comprehensive unit tests for the following function.

SOURCE FILE: ${sourceFile}

FUNCTION TO TEST:
- Name: ${functionInfo.name}
- Type: ${functionInfo.type}
- Parameters: ${functionInfo.params.join(', ')}

RELEVANT SOURCE CODE:
\`\`\`typescript
${this.extractRelevantCode(sourceCode, functionInfo)}
\`\`\`

EXISTING TEST STRUCTURE:
${existingTests.length > 0 ? existingTests.slice(0, 3).join(', ') : 'None'}

REQUIREMENTS:
1. Use Vitest testing framework
2. Follow TypeScript best practices
3. Include happy path, edge cases, and error scenarios
4. Use proper mocking for dependencies
5. Match existing test style if tests exist
6. Generate only the test function, not the entire file structure

${this.customRequirements ? `ADDITIONAL REQUIREMENTS: ${this.customRequirements}` : ''}

Generate a comprehensive test suite for this function:`;

    return basePrompt;
  }

  extractRelevantCode(sourceCode, functionInfo) {
    const lines = sourceCode.split('\n');
    const startLine = Math.max(0, functionInfo.line - 5);
    const endLine = Math.min(lines.length, functionInfo.line + 20);
    return lines.slice(startLine, endLine).join('\n');
  }

  async callAnthropic(prompt) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    return data.content[0].text;
  }

  async callOpenAI(prompt) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.3
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }

  cleanGeneratedTest(generatedTest) {
    return generatedTest.replace(/```typescript|```javascript|```/g, '').trim();
  }
}

async function main() {
  const analyzer = new CodeAnalyzer();
  const generator = new TestGenerator();

  const isRegenerate = process.argv.includes('--regenerate');
  const customRequirements = process.env.CUSTOM_REQUIREMENTS;

  console.log('🔍 Analyzing changed files for missing tests...');
  const changedFiles = analyzer.getChangedFiles();
  console.log(`Found ${changedFiles.length} changed files:`, changedFiles);

  const generatedFunctions = [];

  for (const sourceFile of changedFiles) {
    if (!sourceFile.includes('test') && !sourceFile.includes('spec')) {
      console.log(`\n📋 Analyzing ${sourceFile}...`);

      const functions = analyzer.extractFunctions(sourceFile);
      if (functions.length === 0) continue;

      const testFile = analyzer.findTestFile(sourceFile);
      const testedFunctions = testFile ? analyzer.getTestedFunctions(testFile) : [];

      const untestedFunctions = functions.filter(func =>
              func.exported && !testedFunctions.some(tested =>
                  tested.toLowerCase().includes(func.name.toLowerCase())
              )
      );

      if (untestedFunctions.length > 0) {
        console.log(`⚠️  Found ${untestedFunctions.length} untested functions:`,
            untestedFunctions.map(f => f.name));

        const testFilePath = testFile || analyzer.generateTestFilePath(sourceFile);

        for (const func of untestedFunctions) {
          console.log(`🤖 Generating test for ${func.name}...`);

          if (isRegenerate && customRequirements) {
            generator.customRequirements = customRequirements;
          }

          const testCode = await generator.generateTest(sourceFile, func, testedFunctions);

          if (testCode) {
            if (isRegenerate) {
              analyzer.appendToTestFile(testFilePath, testCode, sourceFile);
            } else {
              analyzer.stageTestFile(testFilePath, testCode, sourceFile);
            }
            generatedFunctions.push(`${sourceFile}:${func.name}`);
            console.log(`✅ Generated test for ${func.name}`);
          }
        }
      }
    }
  }

  if (generatedFunctions.length > 0) {
    console.log(`GENERATED_FUNCTIONS=${generatedFunctions.join(', ')}`);
    if (process.env.GITHUB_ENV) {
      fs.appendFileSync(process.env.GITHUB_ENV, `GENERATED_FUNCTIONS=${generatedFunctions.join(', ')}\n`);
    }
  }

  console.log('🎉 Test generation complete!');
}

if (require.main === module) {
  main().catch(console.error);
}
