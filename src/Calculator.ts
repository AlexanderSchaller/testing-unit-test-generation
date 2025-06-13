export class Calculator {
    add(a: number, b: number): number {
        return a + b;
    }

    subtract(a: number, b: number): number {
        return a - b;
    }

    multiply(a: number, b: number): number {
        return a * b;
    }

    divide(a: number, b: number): number {
        if (b === 0) {
            throw new Error('Division by zero is not allowed');
        }
        return a / b;
    }

    power(base: number, exponent: number): number {
        return Math.pow(base, exponent);
    }

    squareRoot(n: number): number {
        if (n < 0) {
            throw new Error('Square root of negative numbers is not allowed');
        }
        return Math.sqrt(n);
    }

    factorial(n: number): number {
        if (n < 0) {
            throw new Error('Factorial is not defined for negative numbers');
        }
        if (n === 0 || n === 1) {
            return 1;
        }
        return n * this.factorial(n - 1);
    }

    absolute(n: number): number {
        return Math.abs(n);
    }

    percentage(value: number, total: number): number {
        return (value / total) * 100;
    }

    round(n: number, decimals: number = 0): number {
        const factor = Math.pow(10, decimals);
        return Math.round(n * factor) / factor;
    }
}

export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    }).format(amount);
};