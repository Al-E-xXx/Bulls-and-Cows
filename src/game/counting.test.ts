import { describe, expect, it } from 'vitest';

import { countPossibleSecrets } from './counting';
import type { NumericBase } from './types';

const known: Array<[number, NumericBase, number]> = [
  [0, 2, 1],
  [1, 2, 2],
  [2, 2, 2],
  [1, 8, 8],
  [2, 8, 56],
  [3, 8, 336],
  [4, 8, 1680],
  [6, 8, 20160],
  [8, 8, 40320],
  [1, 10, 10],
  [2, 10, 90],
  [3, 10, 720],
  [4, 10, 5040],
  [5, 10, 30240],
  [6, 10, 151200],
  [1, 16, 16],
  [2, 16, 240],
  [3, 16, 3360],
  [6, 16, 5765760],
  [16, 16, 20922789888000],
];

const impossible: Array<[number, NumericBase]> = [
  [3, 2],
  [4, 2],
  [9, 8],
  [11, 10],
  [17, 16],
];

const bases = [2, 8, 10, 16] as const;

describe('countPossibleSecrets', () => {
  it.each(known)('length %i base %i -> %i', (length, base, expected) => {
    expect(countPossibleSecrets(length, base)).toBe(expected);
  });

  it.each(impossible)('length %i base %i -> 0', (length, base) => {
    expect(countPossibleSecrets(length, base)).toBe(0);
  });

  it('counts codes with leading zero as valid', () => {
    expect(countPossibleSecrets(1, 10)).toBe(10);
    expect(countPossibleSecrets(2, 10)).toBe(90);
  });

  it('satisfies P(n, k) = P(n, k - 1) * (n - k + 1)', () => {
    for (const base of bases) {
      for (let length = 1; length <= base; length += 1) {
        expect(countPossibleSecrets(length, base)).toBe(
          countPossibleSecrets(length - 1, base) * (base - length + 1),
        );
      }
    }
  });

  it('grows monotonically in length and strictly in base', () => {
    for (const base of bases) {
      for (let length = 1; length < base; length += 1) {
        expect(countPossibleSecrets(length + 1, base)).toBeGreaterThanOrEqual(
          countPossibleSecrets(length, base),
        );
        if (length + 1 < base) {
          expect(countPossibleSecrets(length + 1, base)).toBeGreaterThan(
            countPossibleSecrets(length, base),
          );
        }
      }
    }
    const pairs: Array<[NumericBase, NumericBase]> = [
      [2, 8],
      [8, 10],
      [10, 16],
    ];
    for (const [smaller, larger] of pairs) {
      for (const length of [2, 3]) {
        expect(countPossibleSecrets(length, larger)).toBeGreaterThan(
          countPossibleSecrets(length, smaller),
        );
      }
    }
  });

  it('equals base factorial when length equals base', () => {
    const factorial = (n: number): number =>
      n <= 1 ? 1 : n * factorial(n - 1);
    for (const base of bases) {
      expect(countPossibleSecrets(base, base)).toBe(factorial(base));
    }
  });

  it('returns stable results for repeated and interleaved calls', () => {
    const first = countPossibleSecrets(4, 10);
    countPossibleSecrets(6, 16);
    countPossibleSecrets(2, 2);
    expect(countPossibleSecrets(4, 10)).toBe(first);
    expect(countPossibleSecrets(4, 10)).toBe(5040);
    expect(countPossibleSecrets(6, 16)).toBe(5765760);
  });

  it('returns safe integers for every base and full-length code', () => {
    for (const base of bases) {
      const result = countPossibleSecrets(base, base);
      expect(Number.isInteger(result)).toBe(true);
      expect(result).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER);
    }
  });
});
