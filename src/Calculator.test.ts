import { Calculator, validateEmail, formatCurrency } from 'Calculator.ts';


import { Calculator } from '../src/Calculator'
import { test } from 'vitest'

test('Calculator - add method', () => {
  const calculator = new Calculator()

  // Happy path
  test('should return the sum of two positive numbers', () => {
    const result = calculator.add(2, 3)
    expect(result).toBe(5)
  })

  test('should return the sum of two negative numbers', () => {
    const result = calculator.add(-2, -3)
    expect(result).toBe(-5)
  })

  // Edge cases
  test('should return the sum of a positive and a negative number', () => {
    const result = calculator.add(2, -3)
    expect(result).toBe(-1)
  })

  test('should return the sum of a number and zero', () => {
    const result = calculator.add(2, 0)
    expect(result).toBe(2)
  })

  test('should return zero when adding zero and zero', () => {
    const result = calculator.add(0, 0)
    expect(result).toBe(0)
  })

  // Error scenarios
  test('should throw an error when a parameter is not a number', () => {
    expect(() => calculator.add('2' as any, 3)).toThrow(TypeError)
    expect(() => calculator.add(2, '3' as any)).toThrow(TypeError)
  })
})

import { test } from 'vitest'
import { Calculator } from '../src/Calculator'

test.describe('Calculator - subtract method', () => {
  const calculator = new Calculator();

  test('should return the correct subtraction of two positive numbers', () => {
    const result = calculator.subtract(5, 3);
    test.expect(result).toBe(2);
  });

  test('should return the correct subtraction of two negative numbers', () => {
    const result = calculator.subtract(-5, -3);
    test.expect(result).toBe(-2);
  });

  test('should return the correct subtraction when subtracting a positive number from a negative number', () => {
    const result = calculator.subtract(-5, 3);
    test.expect(result).toBe(-8);
  });

  test('should return the correct subtraction when subtracting a negative number from a positive number', () => {
    const result = calculator.subtract(5, -3);
    test.expect(result).toBe(8);
  });

  test('should return the correct subtraction when subtracting zero', () => {
    const result = calculator.subtract(5, 0);
    test.expect(result).toBe(5);
  });

  test('should return zero when subtracting a number from itself', () => {
    const result = calculator.subtract(5, 5);
    test.expect(result).toBe(0);
  });

  test('should return the correct subtraction when subtracting from zero', () => {
    const result = calculator.subtract(0, 5);
    test.expect(result).toBe(-5);
  });
});

import { test } from 'vitest'
import { Calculator } from '../src/Calculator'

test('multiply', async ({ is }) => {
  const calculator = new Calculator()

  // Happy path
  is(calculator.multiply(2, 3), 6, '2 * 3 should be 6')
  is(calculator.multiply(-2, 3), -6, '-2 * 3 should be -6')
  is(calculator.multiply(0, 3), 0, '0 * 3 should be 0')

  // Edge cases
  is(calculator.multiply(Number.MAX_SAFE_INTEGER, 1), Number.MAX_SAFE_INTEGER, 'Multiplying max safe integer by 1 should return max safe integer')
  is(calculator.multiply(Number.MAX_SAFE_INTEGER, 0), 0, 'Multiplying max safe integer by 0 should return 0')

  // Error scenarios
  let error: Error | null = null
  try {
    calculator.multiply(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)
  } catch (e) {
    error = e
  }
  is(error instanceof Error, true, 'Multiplying max safe integer by max safe integer should throw an error')
})

import { test } from 'vitest'
import { divide } from '../src/Calculator'

test('divide - happy path', ({ is }) => {
  is(divide(10, 2), 5, '10 divided by 2 should be 5')
  is(divide(9, 3), 3, '9 divided by 3 should be 3')
  is(divide(100, 10), 10, '100 divided by 10 should be 10')
})

test('divide - edge cases', ({ is }) => {
  is(divide(0, 1), 0, '0 divided by 1 should be 0')
  is(divide(1, 1), 1, '1 divided by 1 should be 1')
  is(divide(-10, 2), -5, '-10 divided by 2 should be -5')
  is(divide(10, -2), -5, '10 divided by -2 should be -5')
  is(divide(-10, -2), 5, '-10 divided by -2 should be 5')
})

test('divide - error scenarios', ({ throws }) => {
  throws(() => divide(1, 0), new Error('Division by zero is not allowed'), 'Should throw error when dividing by zero')
  throws(() => divide(0, 0), new Error('Division by zero is not allowed'), 'Should throw error when dividing 0 by 0')
})

import { test } from 'vitest'
import { Calculator } from '../src/Calculator'

test.describe('Calculator - factorial method', () => {
  const calculator = new Calculator()

  test('should return 1 for input 0', () => {
    const result = calculator.factorial(0)
    test.expect(result).toBe(1)
  })

  test('should return 1 for input 1', () => {
    const result = calculator.factorial(1)
    test.expect(result).toBe(1)
  })

  test('should return correct factorial for positive numbers', () => {
    const result = calculator.factorial(5)
    test.expect(result).toBe(120) // 5*4*3*2*1 = 120
  })

  test('should throw error for negative numbers', () => {
    try {
      calculator.factorial(-1)
    } catch (error) {
      test.expect(error).toBeInstanceOf(Error)
      test.expect(error.message).toBe('Factorial is not defined for negative numbers')
    }
  })

  test('should throw error for non-integer numbers', () => {
    try {
      calculator.factorial(1.5)
    } catch (error) {
      test.expect(error).toBeInstanceOf(Error)
      test.expect(error.message).toBe('Factorial is not defined for non-integer numbers')
    }
  })
})

This test suite covers the happy path (inputs 0 and 1), edge cases (positive numbers), and error scenarios (negative numbers and non-integer numbers). It follows TypeScript best practices and uses the vitest testing framework. As the factorial method does not have any dependencies, no mocking is required.

import { validateEmail } from '../src/Calculator'
import { test } from 'vitest'

test('validateEmail - valid email', ({ assert }) => {
  const email = 'test@example.com'
  const result = validateEmail(email)
  assert(result).toBe(true)
})

test('validateEmail - invalid email missing @ symbol', ({ assert }) => {
  const email = 'testexample.com'
  const result = validateEmail(email)
  assert(result).toBe(false)
})

test('validateEmail - invalid email missing domain', ({ assert }) => {
  const email = 'test@'
  const result = validateEmail(email)
  assert(result).toBe(false)
})

test('validateEmail - invalid email missing username', ({ assert }) => {
  const email = '@example.com'
  const result = validateEmail(email)
  assert(result).toBe(false)
})

test('validateEmail - invalid email with spaces', ({ assert }) => {
  const email = 'test @example.com'
  const result = validateEmail(email)
  assert(result).toBe(false)
})

test('validateEmail - empty email', ({ assert }) => {
  const email = ''
  const result = validateEmail(email)
  assert(result).toBe(false)
})

test('validateEmail - null email', ({ assert }) => {
  const email = null
  const result = validateEmail(email)
  assert(result).toBe(false)
})

test('validateEmail - undefined email', ({ assert }) => {
  const email = undefined
  const result = validateEmail(email)
  assert(result).toBe(false)
})
