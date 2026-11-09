import type { NumericBase } from './types';

const cache = new Map<string, number>();

const countPermutations = (length: number, base: number): number => {
  if (length === 0) {
    return 1;
  }
  if (length > base) {
    return 0;
  }
  const key = `${length}:${base}`;
  const cached = cache.get(key);
  if (cached !== undefined) {
    return cached;
  }
  const result = base * countPermutations(length - 1, base - 1);
  cache.set(key, result);
  return result;
};

export const countPossibleSecrets = (
  length: number,
  base: NumericBase,
): number => countPermutations(length, base);
