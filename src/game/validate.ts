import { DIGIT_ALPHABET } from './constants.js';
import type { Code, NumericBase } from './types';

export const createDigitValidator =
  (base: NumericBase): ((symbol: string) => boolean) =>
  (symbol: string): boolean => {
    const alphabet = DIGIT_ALPHABET.slice(0, base);
    return symbol.length === 1 && alphabet.includes(symbol.toLowerCase());
  };

export const isValidGuess = (
  guess: Code,
  length: number,
  base: NumericBase,
): boolean => {
  const validator = createDigitValidator(base);
  const digits = Array.from(guess, symbol => symbol.toLowerCase());
  return (
    digits.length === length &&
    digits.every(digit => validator(digit)) &&
    new Set(digits).size === length
  );
};
