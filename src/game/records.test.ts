import { describe, expect, it } from 'vitest';

import { MAX_RECORDS } from './constants';
import { addRecord, defaultTableKey, safeParseRecords } from './records';
import type { NumericBase, RecordEntry, RecordsTable } from './types';

const rec = (
  attempts: number,
  timeMs: number,
  extra: Partial<RecordEntry> = {},
): RecordEntry => ({
  length: 4,
  base: 10,
  date: '2026-11-09T00:00:00.000Z',
  attempts,
  timeMs,
  ...extra,
});

const fullTable = (): RecordEntry[] =>
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(attempts =>
    rec(attempts, attempts * 1000),
  );

describe('addRecord', () => {
  it('adds a record to an empty table', () => {
    const record = rec(3, 1000);
    expect(addRecord([], record)).toStrictEqual([record]);
  });

  it('returns a new array and does not mutate the input', () => {
    const first = rec(2, 1000);
    const second = rec(4, 2000);
    const table = [first, second];
    const next = addRecord(table, rec(3, 1500));
    expect(next).not.toBe(table);
    expect(table).toHaveLength(2);
    expect(table[0]).toBe(first);
    expect(table[1]).toBe(second);
    expect(first).toStrictEqual({
      length: 4,
      base: 10,
      date: '2026-11-09T00:00:00.000Z',
      attempts: 2,
      timeMs: 1000,
    });
  });

  it('keeps input record objects in the result without cloning them', () => {
    const first = rec(2, 1000);
    const second = rec(4, 2000);
    const next = addRecord([first, second], rec(3, 1500));
    expect(next).toContain(first);
    expect(next).toContain(second);
  });

  it('orders records by attempts ascending', () => {
    const next = addRecord([rec(5, 100), rec(3, 500)], rec(4, 300));
    expect(next.map(record => record.attempts)).toStrictEqual([3, 4, 5]);
  });

  it('orders equal attempts by time ascending', () => {
    const next = addRecord([rec(3, 500)], rec(3, 100));
    expect(next.map(record => record.timeMs)).toStrictEqual([100, 500]);
  });

  it('ignores date and settings keys in ordering', () => {
    const slower = rec(2, 900, { date: '2026-01-01T00:00:00.000Z' });
    const faster = rec(2, 100, {
      length: 6,
      base: 16,
      date: '2020-01-01T00:00:00.000Z',
    });
    const next = addRecord([slower], faster);
    expect(next[0]).toBe(faster);
  });

  it('keeps records equal by both keys side by side', () => {
    const table = [
      rec(3, 100, { date: '2026-01-01T00:00:00.000Z' }),
      rec(3, 100, { date: '2026-02-01T00:00:00.000Z' }),
    ];
    const next = addRecord(
      table,
      rec(3, 100, { date: '2026-03-01T00:00:00.000Z' }),
    );
    expect(next).toHaveLength(3);
  });

  it('trims the table to the given maximum', () => {
    const next = addRecord([rec(1, 100), rec(2, 200)], rec(3, 300), 2);
    expect(next).toHaveLength(2);
    expect(next.map(record => record.attempts)).toStrictEqual([1, 2]);
  });

  it('keeps a better newcomer and drops the worst when full', () => {
    const next = addRecord(fullTable(), rec(1, 1));
    expect(next).toHaveLength(MAX_RECORDS);
    expect(next.map(record => record.attempts)).toStrictEqual([
      1, 1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
  });

  it('drops a worse newcomer when the table is already full', () => {
    const next = addRecord(fullTable(), rec(11, 999999));
    expect(next).toHaveLength(MAX_RECORDS);
    expect(next.some(record => record.attempts === 11)).toBe(false);
  });
});

describe('safeParseRecords', () => {
  it('parses a valid table', () => {
    const table = [rec(2, 100), rec(3, 200)];
    expect(safeParseRecords(JSON.stringify(table))).toStrictEqual(table);
  });

  it('parses an empty array', () => {
    expect(safeParseRecords('[]')).toStrictEqual([]);
  });

  const broken: Array<string | null> = [
    null,
    '',
    '   ',
    'oops',
    '{',
    '[1,2',
    '{"a":1}',
    '"str"',
    '42',
    'true',
    'null',
  ];

  it.each(broken)('returns an empty table for %s', raw => {
    expect(safeParseRecords(raw)).toStrictEqual([]);
  });
});

const entryOn = (
  date: string,
  extra: Partial<RecordEntry> = {},
): RecordEntry => ({
  length: 4,
  base: 10,
  date,
  attempts: 3,
  timeMs: 3000,
  ...extra,
});

const tableOf = (
  length: number,
  base: NumericBase,
  dates: readonly string[],
): RecordsTable => ({
  key: { length, base },
  records: dates.map(date => entryOn(date, { length, base })),
});

describe('defaultTableKey', () => {
  it('returns null when there are no tables', () => {
    expect(defaultTableKey([])).toBeNull();
    expect(defaultTableKey([], { length: 4, base: 10 })).toBeNull();
  });

  it('returns the preferred table when it exists', () => {
    const tables = [
      tableOf(4, 10, ['2026-05-05']),
      tableOf(6, 16, ['2020-01-01']),
    ];
    expect(defaultTableKey(tables, { length: 6, base: 16 })).toBe(
      tables[1]?.key,
    );
  });

  it('ignores a preferred table that is not among the given ones', () => {
    const tables = [
      tableOf(4, 10, ['2026-01-01']),
      tableOf(6, 16, ['2026-05-05']),
    ];
    expect(defaultTableKey(tables, { length: 2, base: 2 })).toStrictEqual({
      length: 6,
      base: 16,
    });
  });

  it('falls back to the table of the most recent record', () => {
    const tables = [
      tableOf(4, 10, ['2026-01-05', '2026-03-01']),
      tableOf(6, 16, ['2026-02-01']),
    ];
    expect(defaultTableKey(tables)).toStrictEqual({ length: 4, base: 10 });
  });

  it('checks every record of a table, not only the first one', () => {
    const tables = [
      tableOf(4, 10, ['2026-01-01', '2026-11-09', '2026-04-04']),
      tableOf(6, 16, ['2026-06-06']),
    ];
    expect(defaultTableKey(tables)).toBe(tables[0]?.key);
  });

  it('breaks equal dates by the earlier table of the given order', () => {
    const tables = [
      tableOf(4, 10, ['2026-05-05']),
      tableOf(6, 16, ['2026-05-05']),
    ];
    expect(defaultTableKey(tables)).toBe(tables[0]?.key);
    expect(defaultTableKey([...tables].reverse())).toBe(tables[1]?.key);
  });

  it('keeps a single table regardless of the preferred one', () => {
    const tables = [tableOf(2, 2, ['2026-01-01'])];
    expect(defaultTableKey(tables)).toBe(tables[0]?.key);
    expect(defaultTableKey(tables, null)).toBe(tables[0]?.key);
  });
});
