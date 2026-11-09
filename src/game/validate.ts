import type { NumericBase } from './types';

export const createDigitValidator = (
  _base: NumericBase,
): ((symbol: string) => string | undefined) => {
  return (_symbol: string) => {
    throw new Error('not implemented');
  };
};
