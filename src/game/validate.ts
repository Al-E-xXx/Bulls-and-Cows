import { DIGIT_ALPHABET } from './constants';
import type { NumericBase } from './types';

export const createDigitValidator =
  (base: NumericBase): ((symbol: string) => string | undefined) =>
  (symbol: string): string | undefined => {
    const alphabet = DIGIT_ALPHABET.slice(0, base);
    const normalized = symbol.toLowerCase();
    return normalized.length === 1 && alphabet.includes(normalized)
      ? normalized
      : undefined;
  };
