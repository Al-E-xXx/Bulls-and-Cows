import type { Code, NumericBase } from './types';

export const generateSecret = (
  _length: number,
  _base: NumericBase,
  _random: () => number = Math.random,
): Code => {
  throw new Error('not implemented');
};
