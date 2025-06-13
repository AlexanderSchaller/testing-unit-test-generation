import { Calculator, validateEmail, formatCurrency } from 'Calculator.ts';


import { test } from 'vitest'
import { Calculator } from '../src/Calculator'

test.describe('Calculator', () => {
  const calculator = new Calculator()

  test('add - should return the sum of two numbers', () => {
    const result = calculator.add(5, 3)
    test.expect(result).toBe(8)
  })

  test('add - should work with negative numbers', () => {
    const result = calculator.add(-5, -3)
    test.expect(result).toBe(-8)
  })

  test('add - should work with zero', () => {
    const result = calculator.add(0, 3)
    test.expect(result).toBe(3)
  })

  test('add - should work with large numbers', () => {
    const result = calculator.add(1000000, 3000000)
    test.expect(result).toBe(4000000)
  })

  test('add - should work with decimal numbers', () => {
    const result = calculator.add(0.1, 0.2)
    test.expect(result).toBeCloseTo(0.3)
  })
})

test('subtract - happy path', () => {
  const calculator = new Calculator()
  const result = calculator.subtract(5, 3)
  expect(result).toBe(2)
})

test('subtract - zero subtraction', () => {
  const calculator = new Calculator()
  const result = calculator.subtract(5, 0)
  expect(result).toBe(5)
})

test('subtract - negative result', () => {
  const calculator = new Calculator()
  const result = calculator.subtract(3, 5)
  expect(result).toBe(-2)
})

test('subtract - subtracting negative number', () => {
  const calculator = new Calculator()
  const result = calculator.subtract(5, -3)
  expect(result).toBe(8)
})

test('subtract - subtracting from negative number', () => {
  const calculator = new Calculator()
  const result = calculator.subtract(-5, 3)
  expect(result).toBe(-8)
})

test('subtract - subtracting negative from negative', () => {
  const calculator = new Calculator()
  const result = calculator.subtract(-5, -3)
  expect(result).toBe(-2)
})

test('subtract - subtracting decimal numbers', () => {
  const calculator = new Calculator()
  const result = calculator.subtract(5.5, 3.3)
  expect(result).toBeCloseTo(2.2)
})

import { test } from 'vitest'
import { Calculator } from '../src/Calculator'

test('Calculator: multiply', async ({ assert }) => {
  const calculator = new Calculator()

  // Happy path
  assert.is(calculator.multiply(2, 3), 6, '2 * 3 should be 6')
  assert.is(calculator.multiply(-2, 3), -6, '-2 * 3 should be -6')
  assert.is(calculator.multiply(2, -3), -6, '2 * -3 should be -6')
  assert.is(calculator.multiply(-2, -3), 6, '-2 * -3 should be 6')

  // Edge cases
  assert.is(calculator.multiply(0, 3), 0, '0 * 3 should be 0')
  assert.is(calculator.multiply(2, 0), 0, '2 * 0 should be 0')
  assert.is(calculator.multiply(0, 0), 0, '0 * 0 should be 0')

  // Large numbers
  assert.is(calculator.multiply(1e6, 3), 3e6, '1e6 * 3 should be 3e6')
  assert.is(calculator.multiply(2, 1e6), 2e6, '2 * 1e6 should be 2e6')
  assert.is(calculator.multiply(1e6, 1e6), 1e12, '1e6 * 1e6 should be 1e12')

  // Small numbers
  assert.is(calculator.multiply(1e-6, 3), 3e-6, '1e-6 * 3 should be 3e-6')
  assert.is(calculator.multiply(2, 1e-6), 2e-6, '2 * 1e-6 should be 2e-6')
  assert.is(calculator.multiply(1e-6, 1e-6), 1e-12, '1e-6 * 1e-6 should be 1e-12')
})

import { test } from 'vitest'
import { Calculator } from '../src/Calculator'

const calculator = new Calculator()

test('Calculator: divide - happy path', () => {
  const result = calculator.divide(10, 2)
  expect(result).toBe(5)
})

test('Calculator: divide - edge case with zero', () => {
  const result = calculator.divide(0, 5)
  expect(result).toBe(0)
})

test('Calculator: divide - edge case with negative numbers', () => {
  const result = calculator.divide(-10, 2)
  expect(result).toBe(-5)
})

test('Calculator: divide - edge case with decimals', () => {
  const result = calculator.divide(10, 3)
  expect(result).toBeCloseTo(3.33, 2)
})

test('Calculator: divide - error scenario with division by zero', () => {
  expect(() => calculator.divide(10, 0)).toThrow('Division by zero is not allowed')
})

test('Calculator: divide - error scenario with non-numeric input', () => {
  // @ts-ignore
  expect(() => calculator.divide('10', 2)).toThrow()
  // @ts-ignore
  expect(() => calculator.divide(10, '2')).toThrow()
})

import { test } from 'vitest'
import { Calculator } from '../src/Calculator'

test('Calculator: power', async ({ assert }) => {
  const calculator = new Calculator()

  // Happy path
  assert.is(calculator.power(2, 3), 8, '2^3 should be 8')
  assert.is(calculator.power(5, 2), 25, '5^2 should be 25')

  // Edge cases
  assert.is(calculator.power(0, 5), 0, '0^5 should be 0')
  assert.is(calculator.power(5, 0), 1, '5^0 should be 1')
  assert.is(calculator.power(0, 0), 1, '0^0 should be 1')

  // Negative base and exponent
  assert.is(calculator.power(-2, 3), -8, '-2^3 should be -8')
  assert.is(calculator.power(2, -3), 0.125, '2^-3 should be 0.125')
  assert.is(calculator.power(-2, -3), -0.125, '-2^-3 should be -0.125')

  // Fractional base and exponent
  assert.is(calculator.power(0.5, 2), 0.25, '0.5^2 should be 0.25')
  assert.is(calculator.power(2, 0.5), Math.sqrt(2), '2^0.5 should be sqrt(2)')
  assert.is(calculator.power(0.5, 0.5), Math.sqrt(0.5), '0.5^0.5 should be sqrt(0.5)')

  // Large numbers
  assert.is(calculator.power(10, 10), 10000000000, '10^10 should be 10000000000')
  assert.is(calculator.power(10, -10), 0.0000000001, '10^-10 should be 0.0000000001')
})

import { round } from '../src/Calculator';
import { test } from 'vitest';

test('round function - happy path', () => {
  const result = round(5.6789, 2);
  expect(result).toBe(5.68);
});

test('round function - no decimals', () => {
  const result = round(5.6789);
  expect(result).toBe(6);
});

test('round function - edge case: rounding up', () => {
  const result = round(5.5);
  expect(result).toBe(6);
});

test('round function - edge case: rounding down', () => {
  const result = round(5.4);
  expect(result).toBe(5);
});

test('round function - edge case: negative number', () => {
  const result = round(-5.6789, 2);
  expect(result).toBe(-5.68);
});

test('round function - error scenario: negative decimal places', () => {
  expect(() => round(5.6789, -2)).toThrow('Number of decimal places cannot be negative');
});

import { test } from 'vitest'
import { factorial } from '../src/Calculator'

test.describe('factorial function', () => {
  test('calculates the factorial of a positive number', () => {
    const result = factorial(5)
    test.expect(result).toBe(120)
  })

  test('returns 1 for the factorial of 0', () => {
    const result = factorial(0)
    test.expect(result).toBe(1)
  })

  test('returns 1 for the factorial of 1', () => {
    const result = factorial(1)
    test.expect(result).toBe(1)
  })

  test('throws an error for negative numbers', () => {
    test.expect(() => factorial(-1)).toThrow('Factorial is not defined for negative numbers')
  })

  test('throws an error for non-integer numbers', () => {
    test.expect(() => factorial(1.5)).toThrow('Factorial is not defined for non-integer numbers')
  })

  test('throws an error for very large numbers', () => {
    test.expect(() => factorial(171)).toThrow('Factorial is not defined for numbers larger than 170')
  })
})

import { validateEmail } from '../src/Calculator'
import { test } from 'vitest'

test('validateEmail - valid email', ({ expect }) => {
  const email = 'test@example.com';
  const result = validateEmail(email);
  expect(result).toBe(true);
})

test('validateEmail - email without @', ({ expect }) => {
  const email = 'testexample.com';
  const result = validateEmail(email);
  expect(result).toBe(false);
})

test('validateEmail - email without .', ({ expect }) => {
  const email = 'test@examplecom';
  const result = validateEmail(email);
  expect(result).toBe(false);
})

test('validateEmail - email with spaces', ({ expect }) => {
  const email = 'test @example.com';
  const result = validateEmail(email);
  expect(result).toBe(false);
})

test('validateEmail - empty string', ({ expect }) => {
  const email = '';
  const result = validateEmail(email);
  expect(result).toBe(false);
})

test('validateEmail - null value', ({ expect }) => {
  const email = null;
  const result = validateEmail(email);
  expect(result).toBe(false);
})

test('validateEmail - undefined value', ({ expect }) => {
  const email = undefined;
  const result = validateEmail(email);
  expect(result).toBe(false);
})
