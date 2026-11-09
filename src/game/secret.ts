import { DIGIT_ALPHABET } from './constants';
import type { Code, NumericBase } from './types';

const pickIndex = (random: () => number, poolSize: number): number =>
  Math.min(poolSize - 1, Math.floor(random() * poolSize));

const pickDigits = (
  pool: readonly string[],
  length: number,
  random: () => number,
): string => {
  if (length === 0) {
    return '';
  }
  const index = pickIndex(random, pool.length);
  const digit = pool[index] as string;
  const rest = [...pool.slice(0, index), ...pool.slice(index + 1)];
  return digit + pickDigits(rest, length - 1, random);
};

export const generateSecret = (
  length: number,
  base: NumericBase,
  random: () => number = Math.random,
): Code => {
  const alphabet = Array.from(DIGIT_ALPHABET.slice(0, base));
  return pickDigits(alphabet, length, random);
};
