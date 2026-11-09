import { MAX_RECORDS } from './constants.js';
import type { RecordEntry, RecordsTable, RecordsTableKey } from './types';

const byAttemptsThenTime = (a: RecordEntry, b: RecordEntry): number =>
  a.attempts - b.attempts || a.timeMs - b.timeMs;

export const addRecord = (
  records: readonly RecordEntry[],
  record: RecordEntry,
  maxRecords: number = MAX_RECORDS,
): readonly RecordEntry[] =>
  [...records, record].sort(byAttemptsThenTime).slice(0, maxRecords);

export const safeParseRecords = (raw: string | null): RecordEntry[] => {
  if (raw === null) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RecordEntry[]) : [];
  } catch {
    return [];
  }
};

const isSameKey = (a: RecordsTableKey, b: RecordsTableKey): boolean =>
  a.length === b.length && a.base === b.base;

const newestDateOf = (table: RecordsTable): string =>
  table.records.reduce(
    (newest, { date }) => (date > newest ? date : newest),
    '',
  );

const byNewestDate = (
  best: RecordsTable | undefined,
  table: RecordsTable,
): RecordsTable | undefined =>
  best === undefined || newestDateOf(table) > newestDateOf(best) ? table : best;

const findTable = (
  tables: readonly RecordsTable[],
  key: RecordsTableKey | null,
): RecordsTable | undefined =>
  key === null ? undefined : tables.find(table => isSameKey(table.key, key));

export const defaultTableKey = (
  tables: readonly RecordsTable[],
  preferred: RecordsTableKey | null = null,
): RecordsTableKey | null => {
  const chosen =
    findTable(tables, preferred) ??
    tables.reduce<RecordsTable | undefined>(byNewestDate, undefined);
  return chosen === undefined ? null : chosen.key;
};
