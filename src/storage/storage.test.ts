import { describe, expect, it, vi } from 'vitest';

import type { RecordEntry, RecordsTableKey } from '../game/types';
import { loadRecords, makeRecordsKey, saveRecords } from './storage';
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
