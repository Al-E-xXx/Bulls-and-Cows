import { describe, expect, it, vi } from 'vitest';

import type { RecordEntry, RecordsTableKey } from '../game/types';
import {
  collectAllRecords,
  loadRecords,
  makeRecordsKey,
  saveRecords,
} from './storage';
import type { KeyValueStore } from './storage';

const key4x10: RecordsTableKey = { length: 4, base: 10 };
const key4x10Text = 'bc:records:4:10';

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

const fakeStore = (
  initial: Readonly<Record<string, string>> = {},
): KeyValueStore & { readonly data: ReadonlyMap<string, string> } => {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    getKeys: () => Array.from(data.keys()),
  };
};

describe('makeRecordsKey', () => {
  it('builds a namespaced key from length and base', () => {
    expect(makeRecordsKey({ length: 4, base: 10 })).toBe(key4x10Text);
  });

  it('is stable for equal settings', () => {
    expect(makeRecordsKey({ length: 4, base: 10 })).toBe(
      makeRecordsKey({ length: 4, base: 10 }),
    );
  });

  it('uses different keys for different lengths', () => {
    expect(makeRecordsKey({ length: 3, base: 10 })).not.toBe(
      makeRecordsKey({ length: 4, base: 10 }),
    );
  });

  it('uses different keys for different bases', () => {
    expect(makeRecordsKey({ length: 4, base: 8 })).not.toBe(
      makeRecordsKey({ length: 4, base: 16 }),
    );
  });
});

describe('loadRecords', () => {
  it('returns an empty table for an empty store', () => {
    expect(loadRecords(fakeStore(), key4x10)).toStrictEqual([]);
  });

  it('returns an empty table when the key is absent', () => {
    const store = fakeStore({ 'bc:records:6:16': '[]' });
    expect(loadRecords(store, key4x10)).toStrictEqual([]);
  });

  it('reads exactly the key of the requested settings', () => {
    const store = fakeStore();
    const getItem = vi.fn(store.getItem);
    loadRecords({ getItem, setItem: store.setItem }, { length: 2, base: 2 });
    expect(getItem).toHaveBeenCalledTimes(1);
    expect(getItem).toHaveBeenCalledWith('bc:records:2:2');
  });

  it('returns the stored table', () => {
    const table = [rec(3, 3000), rec(2, 2000)];
    const store = fakeStore({ [key4x10Text]: JSON.stringify(table) });
    expect(loadRecords(store, key4x10)).toStrictEqual(table);
  });

  it('returns an empty table for a stored empty array', () => {
    const store = fakeStore({ [key4x10Text]: '[]' });
    expect(loadRecords(store, key4x10)).toStrictEqual([]);
  });

  const broken = [
    '',
    'oops',
    '{',
    '[1,2',
    '{"a":1}',
    '"str"',
    '42',
    'true',
    'null',
  ];

  it.each(broken)('returns an empty table for broken value %s', value => {
    const store = fakeStore({ [key4x10Text]: value });
    expect(loadRecords(store, key4x10)).toStrictEqual([]);
  });

  it('returns an empty table when getItem throws', () => {
    const store: KeyValueStore = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => undefined,
      getKeys: () => [],
    };
    expect(loadRecords(store, key4x10)).toStrictEqual([]);
  });
});

describe('saveRecords', () => {
  it('writes the serialized table under the settings key', () => {
    const table = [rec(2, 2000), rec(3, 3000)];
    const store = fakeStore();
    saveRecords(store, key4x10, table);
    expect(store.data.get(key4x10Text)).toBe(JSON.stringify(table));
  });

  it('round-trips a table through loadRecords', () => {
    const table = [rec(5, 5000), rec(2, 2000)];
    const store = fakeStore();
    saveRecords(store, key4x10, table);
    expect(loadRecords(store, key4x10)).toStrictEqual(table);
  });

  it('stores an empty table as an empty json array', () => {
    const store = fakeStore();
    saveRecords(store, key4x10, []);
    expect(store.data.get(key4x10Text)).toBe('[]');
    expect(loadRecords(store, key4x10)).toStrictEqual([]);
  });

  it('does not throw when setItem fails', () => {
    const store: KeyValueStore = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      getKeys: () => [],
    };
    expect(() => saveRecords(store, key4x10, [rec(2, 100)])).not.toThrow();
  });

  it('keeps tables of other settings untouched', () => {
    const first = [rec(2, 200)];
    const store = fakeStore();
    saveRecords(store, key4x10, first);
    saveRecords(store, { length: 6, base: 16 }, [
      rec(3, 300, { length: 6, base: 16 }),
    ]);
    expect(loadRecords(store, key4x10)).toStrictEqual(first);
  });
});

describe('collectAllRecords', () => {
  it('returns no tables for an empty store', () => {
    expect(collectAllRecords(fakeStore())).toStrictEqual([]);
  });

  it.each([
    'theme',
    'records',
    'bc:record:4:10',
    'bcrecords:4:10',
    'xbc:records:4:10',
  ])('ignores the unrelated key %s', foreignKey => {
    const store = fakeStore({ [foreignKey]: JSON.stringify([rec(1, 100)]) });
    expect(collectAllRecords(store)).toStrictEqual([]);
  });

  it('returns the table of a single settings key', () => {
    const table = [rec(2, 2000), rec(3, 3000)];
    const store = fakeStore({ [key4x10Text]: JSON.stringify(table) });
    expect(collectAllRecords(store)).toStrictEqual([
      { key: { length: 4, base: 10 }, records: table },
    ]);
  });

  it('returns every record table ordered by length then base numerically', () => {
    const one = JSON.stringify([rec(1, 100)]);
    const store = fakeStore({
      'bc:records:6:8': one,
      'bc:records:4:16': one,
      'bc:records:2:2': one,
      'bc:records:4:10': one,
      'bc:records:3:8': one,
      'bc:records:4:8': one,
    });
    expect(
      collectAllRecords(store).map(table => [table.key.length, table.key.base]),
    ).toStrictEqual([
      [2, 2],
      [3, 8],
      [4, 8],
      [4, 10],
      [4, 16],
      [6, 8],
    ]);
  });

  it.each([
    'bc:records:',
    'bc:records:4',
    'bc:records::10',
    'bc:records:x:10',
    'bc:records:4:x',
    'bc:records:4:7',
    'bc:records:0:10',
    'bc:records:3:2',
    'bc:records:7:10',
    'bc:records:4:10:16',
    'bc:records:-4:10',
  ])('skips the malformed key %s', malformedKey => {
    const store = fakeStore({ [malformedKey]: JSON.stringify([rec(1, 100)]) });
    expect(collectAllRecords(store)).toStrictEqual([]);
  });

  const brokenValues = ['', 'oops', '{', '[1,2', '{"a":1}', '42'];

  it.each(brokenValues)('skips a table holding the broken value %s', value => {
    const store = fakeStore({ [key4x10Text]: value });
    expect(collectAllRecords(store)).toStrictEqual([]);
  });

  it('skips empty tables', () => {
    const table = [rec(2, 200)];
    const store = fakeStore({
      [key4x10Text]: JSON.stringify(table),
      'bc:records:6:16': '[]',
    });
    expect(collectAllRecords(store)).toStrictEqual([
      { key: { length: 4, base: 10 }, records: table },
    ]);
  });

  it('keeps the stored record order in each table', () => {
    const table = [rec(5, 5000), rec(2, 2000)];
    const store = fakeStore({ [key4x10Text]: JSON.stringify(table) });
    const [firstTable] = collectAllRecords(store);
    expect(firstTable?.records.map(record => record.attempts)).toStrictEqual([
      5, 2,
    ]);
  });

  it('keeps record objects identical to the parsed ones', () => {
    const table = [rec(2, 200)];
    const store = fakeStore({ [key4x10Text]: JSON.stringify(table) });
    const [firstTable] = collectAllRecords(store);
    expect(firstTable?.records[0]).toStrictEqual(table[0]);
  });

  it('returns only the valid non-empty tables from a mixed store', () => {
    const table4x10 = [rec(2, 200)];
    const table6x16 = [rec(3, 300, { length: 6, base: 16 })];
    const store = fakeStore({
      theme: 'dark',
      'bc:records:4:16': '[1,2',
      'bc:records:3:2': JSON.stringify([rec(1, 100)]),
      'bc:records:8:10': JSON.stringify([rec(1, 100)]),
      'bc:records:6:16': JSON.stringify(table6x16),
      'bc:records:4:10': JSON.stringify(table4x10),
      'bc:records:5:8': '[]',
    });
    expect(collectAllRecords(store)).toStrictEqual([
      { key: { length: 4, base: 10 }, records: table4x10 },
      { key: { length: 6, base: 16 }, records: table6x16 },
    ]);
  });

  it('returns no tables when getKeys throws', () => {
    const store = fakeStore({ [key4x10Text]: '[]' });
    const throwing: KeyValueStore = {
      getItem: store.getItem,
      setItem: store.setItem,
      getKeys: () => {
        throw new Error('SecurityError');
      },
    };
    expect(collectAllRecords(throwing)).toStrictEqual([]);
  });

  it('does not write to the store', () => {
    const store = fakeStore({ [key4x10Text]: JSON.stringify([rec(2, 200)]) });
    const setItem = vi.fn(store.setItem);
    collectAllRecords({ ...store, setItem });
    expect(setItem).not.toHaveBeenCalled();
  });
});
