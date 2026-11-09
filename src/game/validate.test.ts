import { describe, expect, it } from 'vitest';

import { createDigitValidator, isValidGuess } from './validate';
import type { Code, NumericBase } from './types';

const validFor = (base: Parameters<typeof createDigitValidator>[0]) =>
  Array.from('0123456789abcdef'.slice(0, base));

describe('createDigitValidator', () => {
  describe('binary base', () => {
    const validator = createDigitValidator(2);

    it('accepts only 0 and 1', () => {
      expect(validator('0')).toBe('0');
      expect(validator('1')).toBe('1');
    });

    it('rejects digits 2-9', () => {
      for (const symbol of validFor(10).slice(2)) {
        expect(validator(symbol)).toBeUndefined();
      }
    });

    it('rejects latin letters regardless of case', () => {
      for (const symbol of ['a', 'b', 'f', 'A', 'B', 'F']) {
        expect(validator(symbol)).toBeUndefined();
      }
    });
  });

  describe('octal base', () => {
    const validator = createDigitValidator(8);

    it.each(['0', '1', '2', '3', '4', '5', '6', '7'])('accepts %s', symbol => {
      expect(validator(symbol)).toBe(symbol);
    });

    it('rejects 8 and 9', () => {
      expect(validator('8')).toBeUndefined();
      expect(validator('9')).toBeUndefined();
    });

    it('rejects letters', () => {
      expect(validator('a')).toBeUndefined();
      expect(validator('f')).toBeUndefined();
    });
  });

  describe('decimal base', () => {
    const validator = createDigitValidator(10);

    it.each(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])(
      'accepts %s',
      symbol => {
        expect(validator(symbol)).toBe(symbol);
      },
    );

    it('rejects letters regardless of case', () => {
      for (const symbol of ['a', 'e', 'f', 'A', 'E', 'F']) {
        expect(validator(symbol)).toBeUndefined();
      }
    });
  });

  describe('hexadecimal base', () => {
    const validator = createDigitValidator(16);

    it.each(Array.from('0123456789abcdef'))('accepts lowercase %s', symbol => {
      expect(validator(symbol)).toBe(symbol);
    });

    it.each(Array.from('ABCDEF'))('accepts uppercase %s', symbol => {
      expect(validator(symbol)).toBe(symbol.toLowerCase());
    });
  });

  describe('shared rules for every base', () => {
    const bases = [2, 8, 10, 16] as const;

    it.each(bases)('base %i rejects empty string', base => {
      expect(createDigitValidator(base)('')).toBeUndefined();
    });

    it.each(bases)('base %i rejects multi-character input', base => {
      const validator = createDigitValidator(base);
      expect(validator('01')).toBeUndefined();
      expect(validator('0a')).toBeUndefined();
    });

    it.each(bases)('base %i rejects non-alphanumeric symbols', base => {
      const validator = createDigitValidator(base);
      for (const symbol of [' ', '#', '.', '-', '\n']) {
        expect(validator(symbol)).toBeUndefined();
      }
    });

    it.each(bases)('base %i rejects unicode digits', base => {
      const validator = createDigitValidator(base);
      for (const symbol of ['٣', '፫', '𝟑']) {
        expect(validator(symbol)).toBeUndefined();
      }
    });

    it.each(bases)('base %i accepts every digit of its own alphabet', base => {
      const validator = createDigitValidator(base);
      for (const symbol of validFor(base)) {
        expect(validator(symbol)).toBe(symbol);
      }
    });

    it.each(bases)(
      'base %i returns undefined for symbols outside its alphabet',
      base => {
        const validator = createDigitValidator(base);
        const outside = validFor(16).slice(base);
        const samples = outside.length > 0 ? outside : ['g', 'z'];
        for (const symbol of samples) {
          expect(validator(symbol)).toBeUndefined();
        }
      },
    );
  });

  describe('validator factory', () => {
    it('creates independent validators per base', () => {
      const binary = createDigitValidator(2);
      const hex = createDigitValidator(16);

      expect(binary('0')).toBe('0');
      expect(hex('0')).toBe('0');
      expect(binary('f')).toBeUndefined();
      expect(hex('f')).toBe('f');
    });

    it('does not memoize or cache results between calls', () => {
      const validator = createDigitValidator(16);
      expect(validator('a')).toBe('a');
      expect(validator('a')).toBe('a');
      expect(validator('g')).toBeUndefined();
      expect(validator('a')).toBe('a');
    });
  });
});

const validGuesses: Array<[Code, number, NumericBase]> = [
  ['01', 2, 2],
  ['10', 2, 2],
  ['07', 2, 8],
  ['76', 2, 8],
  ['765432', 6, 8],
  ['01', 2, 10],
  ['90', 2, 10],
  ['0123', 4, 10],
  ['901234', 6, 10],
  ['0f', 2, 16],
  ['abcdef', 6, 16],
  ['ABCDEF', 6, 16],
  ['AbCdEf', 6, 16],
  ['a1b2', 4, 16],
];

const invalidGuesses: Array<[Code, number, NumericBase]> = [
  ['', 2, 10],
  ['0', 2, 10],
  ['012', 4, 10],
  ['01234', 3, 10],
  ['02', 2, 2],
  ['11', 2, 2],
  ['101', 3, 2],
  ['78', 2, 8],
  ['12345678', 8, 8],
  ['1a', 2, 10],
  ['98765a', 6, 10],
  ['11', 2, 10],
  ['121', 3, 10],
  ['1 1', 3, 10],
  ['1g', 2, 16],
  ['gg', 2, 16],
  ['aa', 2, 16],
  ['aA', 2, 16],
  ['AA', 2, 16],
  ['abcdea', 6, 16],
  ['٣٣', 2, 10],
];

describe('isValidGuess', () => {
  it.each(validGuesses)(
    'guess %s with length %i and base %i is valid',
    (guess, length, base) => {
      expect(isValidGuess(guess, length, base)).toBe(true);
    },
  );

  it.each(invalidGuesses)(
    'guess %s with length %i and base %i is invalid',
    (guess, length, base) => {
      expect(isValidGuess(guess, length, base)).toBe(false);
    },
  );

  it('accepts hex guesses of any letter case', () => {
    expect(isValidGuess('abcdef', 6, 16)).toBe(true);
    expect(isValidGuess('ABCDEF', 6, 16)).toBe(true);
    expect(isValidGuess('fEdCbA', 6, 16)).toBe(true);
  });

  it('counts uppercase and lowercase hex letters as the same digit', () => {
    expect(isValidGuess('aA', 2, 16)).toBe(false);
    expect(isValidGuess('0fF0', 4, 16)).toBe(false);
  });

  it('rejects any guess containing a digit outside the base alphabet', () => {
    for (const base of [2, 8, 10, 16] as const) {
      const outside = Array.from('0123456789abcdef'.slice(base));
      const samples = outside.length > 0 ? outside : ['g', 'z'];
      for (const symbol of samples) {
        expect(isValidGuess(`0${symbol}`, 2, base)).toBe(false);
      }
    }
  });

  it('accepts a full alphabet permutation for every base', () => {
    expect(isValidGuess('10', 2, 2)).toBe(true);
    expect(isValidGuess('76543210', 8, 8)).toBe(true);
    expect(isValidGuess('9876543210', 10, 10)).toBe(true);
    expect(isValidGuess('fedcba9876543210', 16, 16)).toBe(true);
  });
});
