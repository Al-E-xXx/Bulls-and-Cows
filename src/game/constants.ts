import type { BaseLabel, NumericBase } from './types';

export const DIGIT_ALPHABET = '0123456789abcdef' as const;

export const MIN_CODE_LENGTH = 2;
export const MAX_CODE_LENGTH = 6;

export const BASE_LABELS = ['bin', 'oct', 'dec', 'hex'] as const;

export const BASE_LABEL_BY_VALUE: Readonly<Record<NumericBase, BaseLabel>> = {
  2: 'bin',
  8: 'oct',
  10: 'dec',
  16: 'hex',
};

export const BASE_VALUE_BY_LABEL: Readonly<Record<BaseLabel, NumericBase>> = {
  bin: 2,
  oct: 8,
  dec: 10,
  hex: 16,
};

// digits are unique, so a base limits its code length
export const maxCodeLengthForBase = (base: NumericBase): number =>
  Math.min(MAX_CODE_LENGTH, base);

export const MAX_RECORDS = 10;
