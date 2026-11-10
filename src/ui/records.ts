import { MAX_RECORDS } from '../game/constants.js';
import { defaultTableKey } from '../game/records.js';
import { formatDuration } from '../game/time.js';
import type {
  RecordEntry,
  RecordsTable,
  RecordsTableKey,
} from '../game/types.js';
import { clearNode, el } from './dom.js';
import { BASE_CAPTIONS } from './settings.js';

const formatRecordDate = (date: string): string =>
  `${date.slice(8, 10)}.${date.slice(5, 7)}.${date.slice(0, 4)}`;

const createHeaderRow = (): HTMLTableRowElement => {
  const row = el('tr');
  for (const title of ['#', 'Дата', 'Попытки', 'Время']) {
    row.append(el('th', '', title));
  }
  return row;
};

const createRecordRow = (
  rank: number,
  record: RecordEntry,
): HTMLTableRowElement => {
  const row = el('tr');
  row.append(
    el('td', 'records__rank', String(rank)),
    el('td', 'records__date', formatRecordDate(record.date)),
    el('td', 'records__attempts', String(record.attempts)),
    el('td', 'records__time', formatDuration(record.timeMs)),
  );
  return row;
};

const createRecordTable = (
  records: readonly RecordEntry[],
): HTMLTableElement => {
  const head = el('thead');
  head.append(createHeaderRow());

  const body = el('tbody');
  records.slice(0, MAX_RECORDS).forEach((record, index) => {
    body.append(createRecordRow(index + 1, record));
  });

  const table = el('table', 'records__table');
  table.append(head, body);
  return table;
};

const createRecordGroup = ({ key, records }: RecordsTable): HTMLElement => {
  const group = el('div', 'records__group');
  const caption = el('div', 'records__caption');
  caption.append(
    el('span', 'records__badge', `Длина ${key.length}`),
    el('span', 'records__badge', BASE_CAPTIONS[key.base]),
  );
  group.append(caption, createRecordTable(records));
  return group;
};

const pairCaption = (key: RecordsTableKey): string =>
  `${key.length} · ${BASE_CAPTIONS[key.base]}`;

const indexOfKey = (
  tables: readonly RecordsTable[],
  key: RecordsTableKey,
): number =>
  tables.findIndex(
    table => table.key.length === key.length && table.key.base === key.base,
  );

const createPairSelect = (
  tables: readonly RecordsTable[],
  selected: number,
  onSelect: (index: number) => void,
): HTMLSelectElement => {
  const select = el('select', 'records__select');
  select.setAttribute('aria-label', 'Длина кода и система счисления');
  tables.forEach((table, index) => {
    const option = el('option', '', pairCaption(table.key));
    option.value = String(index);
    select.append(option);
  });
  select.value = String(selected);
  select.addEventListener('change', () => {
    onSelect(Number(select.value));
  });
  return select;
};

export const createRecordsPanel = (
  tables: readonly RecordsTable[],
  preferred: RecordsTableKey | null = null,
): HTMLElement => {
  const panel = el('div', 'records__panel');
  if (tables.length === 0) {
    panel.append(el('p', 'records__empty', 'Пока нет рекордов'));
    return panel;
  }

  let selected = Math.max(
    0,
    indexOfKey(tables, defaultTableKey(tables, preferred) ?? tables[0]!.key),
  );

  const list = el('div', 'records__list');
  const renderSelected = (): void => {
    clearNode(list);
    const table = tables[selected];
    if (table !== undefined) {
      list.append(createRecordGroup(table));
    }
  };

  if (tables.length > 1) {
    panel.append(
      createPairSelect(tables, selected, index => {
        selected = index;
        renderSelected();
      }),
    );
  }

  panel.append(list);
  renderSelected();
  return panel;
};
