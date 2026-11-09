import type { RecordEntry } from './types';

export const addRecord = (
  _records: readonly RecordEntry[],
  _record: RecordEntry,
  _maxRecords?: number,
): readonly RecordEntry[] => {
  throw new Error('not implemented');
};

export const safeParseRecords = (_raw: string | null): RecordEntry[] => {
  throw new Error('not implemented');
};
