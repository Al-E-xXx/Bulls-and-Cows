import { safeParseRecords } from '../game/records';
import type { RecordEntry, RecordsTableKey } from '../game/types';

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const makeRecordsKey = (key: RecordsTableKey): string =>
  `bc:records:${key.length}:${key.base}`;

const readItem = (store: KeyValueStore, key: string): string | null => {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
};

export const loadRecords = (
  store: KeyValueStore,
  key: RecordsTableKey,
): readonly RecordEntry[] =>
  safeParseRecords(readItem(store, makeRecordsKey(key)));

export const saveRecords = (
  store: KeyValueStore,
  key: RecordsTableKey,
  records: readonly RecordEntry[],
): void => {
  try {
    store.setItem(makeRecordsKey(key), JSON.stringify(records));
  } catch {
    // storage unavailable: play on without persisting
  }
};
