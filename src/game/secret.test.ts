import { describe, expect, it } from 'vitest';

import type { NumericBase } from './types';

import { generateSecret } from './secret';

const ALL_DIGITS = '0123456789abcdef';

const digitsOf = (base: NumericBase) => Array.from(ALL_DIGITS.slice(0, base));

const baseLengths: Array<[NumericBase, number[]]> = [
  [2, [2]],
  [8, [2, 3, 4, 5, 6]],
  [10, [2, 3, 4, 5, 6]],
  [16, [2, 3, 4, 5, 6]],
];

const constantRandom = (value: number) => () => value;

const countingRandom = (calls: number[]) => () => {
  calls.push(1);
  return 0;
};

describe('generateSecret', () => {
  it.each(baseLengths)(
    'base %i: returns a code of length %i',
    (base, lengths) => {
      for (const length of lengths) {
        expect(generateSecret(length, base, Math.random)).toHaveLength(length);
      }
    },
  );

  it.each(baseLengths)(
    'base %i: uses only digits of its own alphabet',
    (base, lengths) => {
      const allowed = new Set(digitsOf(base));
      for (const length of lengths) {
        for (const digit of generateSecret(length, base, Math.random)) {
          expect(allowed.has(digit)).toBe(true);
        }
      }
    },
  );

  it.each([
    [2, 2],
    [8, 8],
    [10, 10],
    [16, 16],
  ] as Array<[NumericBase, number]>)(
    'base %i: longest code (length = base) contains every digit exactly once',
    (base, length) => {
      const code = generateSecret(length, base, Math.random);
      expect(Array.from(code).sort().join('')).toBe(
        digitsOf(base).sort().join(''),
      );
    },
  );

  it.each([
    [2, '01'],
    [8, '01234567'],
    [10, '0123456789'],
    [16, '0123456789abcdef'],
  ] as Array<[NumericBase, string]>)(
    'base %i: full-length code may start with zero',
    (base, expected) => {
      expect(generateSecret(base, base, constantRandom(0))).toBe(expected);
    },
  );

  it('leading zero: constant-low random keeps 0 first for dec length 3', () => {
    expect(generateSecret(3, 10, constantRandom(0))).toBe('012');
  });

  it('digits are unique across many random runs', () => {
    for (const [base, lengths] of baseLengths) {
      for (const length of lengths) {
        for (let run = 0; run < 50; run += 1) {
          const code = generateSecret(length, base, Math.random);
          expect(new Set(code).size).toBe(length);
        }
      }
    }
  });

  it('is deterministic for the same random source', () => {
    const first = generateSecret(4, 16, constantRandom(0.5));
    const second = generateSecret(4, 16, constantRandom(0.5));
    expect(first).toBe(second);
  });

  it('returns different codes for different random sources', () => {
    const low = generateSecret(4, 16, constantRandom(0));
    const high = generateSecret(4, 16, constantRandom(0.999999));
    expect(low).not.toBe(high);
  });

  it('uses the injected random function instead of Math.random', () => {
    const calls: number[] = [];
    const code = generateSecret(4, 16, countingRandom(calls));
    expect(calls.length).toBe(4);
    expect(code).toBe('0123');
  });

  it('binary full-length code has both digits and no duplicates', () => {
    for (let run = 0; run < 50; run += 1) {
      const code = generateSecret(2, 2, Math.random);
      expect(code).toHaveLength(2);
      expect(new Set(code).size).toBe(2);
      expect(new Set(code)).toEqual(new Set(['0', '1']));
    }
  });
});
