import { describe, expect, it } from 'vitest';

import { createDigitValidator } from './validate';

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
