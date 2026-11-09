import { describe, expect, it } from 'vitest';

import { MAX_RECORDS } from './constants';
import { addRecord, safeParseRecords } from './records';
import type { RecordEntry } from './types';

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
