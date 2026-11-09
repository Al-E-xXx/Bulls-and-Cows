import type { RecordEntry, RecordsTableKey } from '../game/types';

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const makeRecordsKey = (_key: RecordsTableKey): string => {
  throw new Error('not implemented');
};

export const loadRecords = (
  _store: KeyValueStore,
  _key: RecordsTableKey,
): readonly RecordEntry[] => {
  throw new Error('not implemented');
};

export const saveRecords = (
  _store: KeyValueStore,
  _key: RecordsTableKey,
  _records: readonly RecordEntry[],
): void => {
  throw new Error('not implemented');
};
