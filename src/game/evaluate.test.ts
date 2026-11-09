import { describe, expect, it } from 'vitest';

import { evaluateGuess } from './evaluate';
import type { Code, GuessEvaluation } from './types';

const cases: Array<[Code, Code, GuessEvaluation]> = [
  ['', '', { bulls: 0, cows: 0 }],
  ['01', '01', { bulls: 2, cows: 0 }],
  ['1234', '1234', { bulls: 4, cows: 0 }],
  ['012345', '012345', { bulls: 6, cows: 0 }],
  ['abcdef', 'abcdef', { bulls: 6, cows: 0 }],
  ['1234', '5678', { bulls: 0, cows: 0 }],
  ['01', '89', { bulls: 0, cows: 0 }],
  ['0f', '12', { bulls: 0, cows: 0 }],
  ['1234', '1567', { bulls: 1, cows: 0 }],
  ['1234', '9234', { bulls: 3, cows: 0 }],
  ['1234', '2143', { bulls: 0, cows: 4 }],
  ['1234', '4321', { bulls: 0, cows: 4 }],
  ['01', '10', { bulls: 0, cows: 2 }],
  ['abcd', 'badc', { bulls: 0, cows: 4 }],
  ['1234', '1356', { bulls: 1, cows: 1 }],
  ['1234', '1243', { bulls: 2, cows: 2 }],
  ['1234', '2134', { bulls: 2, cows: 2 }],
  ['1234', '9283', { bulls: 1, cows: 1 }],
  ['abcdef', 'abcfed', { bulls: 4, cows: 2 }],
  ['1234', '4567', { bulls: 0, cows: 1 }],
  ['1234', '1435', { bulls: 2, cows: 1 }],
];

describe('evaluateGuess', () => {
  it.each(cases)('secret %s vs guess %s -> %j', (secret, guess, expected) => {
    expect(evaluateGuess(secret, guess)).toEqual(expected);
  });

  it('returns exactly bulls and cows keys with non-negative integers', () => {
    for (const [secret, guess] of cases) {
      const { bulls, cows } = evaluateGuess(secret, guess);
      expect(bulls).toBeGreaterThanOrEqual(0);
      expect(cows).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(bulls)).toBe(true);
      expect(Number.isInteger(cows)).toBe(true);
      expect(bulls + cows).toBeLessThanOrEqual(secret.length);
    }
  });

  it('bulls equal to code length means a win and zero cows', () => {
    for (const [secret] of cases) {
      const { bulls, cows } = evaluateGuess(secret, secret);
      expect(bulls).toBe(secret.length);
      expect(cows).toBe(0);
    }
  });

  it('cows never include bulls: shifting every digit one step left', () => {
    expect(evaluateGuess('123456', '234561')).toEqual({
      bulls: 0,
      cows: 6,
    });
  });

  it('does not mutate its string arguments', () => {
    const secret = '1234';
    const guess = '4321';
    evaluateGuess(secret, guess);
    expect(secret).toBe('1234');
    expect('4321').toBe(guess);
  });
});
