import { MIN_CODE_LENGTH, maxCodeLengthForBase } from '../game/constants.js';
import { safeParseRecords } from '../game/records.js';
import type {
  NumericBase,
  RecordEntry,
  RecordsTable,
  RecordsTableKey,
} from '../game/types';

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  getKeys(): string[];
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

const RECORDS_KEY_PATTERN = /^bc:records:(\d+):(\d+)$/;

const parseNumericBase = (text: string): NumericBase | null => {
  const base = Number(text);
  return base === 2 || base === 8 || base === 10 || base === 16 ? base : null;
};

const parseRecordsKey = (text: string): RecordsTableKey | null => {
  const match = RECORDS_KEY_PATTERN.exec(text);
  if (match === null) {
    return null;
  }
  const base = parseNumericBase(match[2] ?? '');
  const length = Number(match[1] ?? '');
  if (
    base === null ||
    length < MIN_CODE_LENGTH ||
    length > maxCodeLengthForBase(base)
  ) {
    return null;
  }
  return { length, base };
};

const tryGetKeys = (store: KeyValueStore): string[] => {
  try {
    return store.getKeys();
  } catch {
    return [];
  }
};

const byLengthThenBase = (a: RecordsTable, b: RecordsTable): number =>
  a.key.length - b.key.length || a.key.base - b.key.base;

export const collectAllRecords = (
  store: KeyValueStore,
): readonly RecordsTable[] =>
  tryGetKeys(store)
    .flatMap(text => {
      const key = parseRecordsKey(text);
      if (key === null) {
        return [];
      }
      const records = loadRecords(store, key);
      return records.length === 0 ? [] : [{ key, records }];
    })
    .sort(byLengthThenBase);
