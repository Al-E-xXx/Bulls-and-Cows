import { MAX_RECORDS } from './constants';
import type { RecordEntry } from './types';

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
