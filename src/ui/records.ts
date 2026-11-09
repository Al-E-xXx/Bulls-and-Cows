import { MAX_RECORDS } from '../game/constants.js';
import { formatDuration } from '../game/time.js';
import type { RecordEntry, RecordsTableKey } from '../game/types.js';
import { el } from './dom.js';
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

export const createRecordsSection = (
  table: RecordsTableKey,
  records: readonly RecordEntry[],
): HTMLElement => {
  const section = el('section', 'records');
  section.append(
    el(
      'h2',
      'records__title',
      `Рекорды — длина ${table.length}, ${BASE_CAPTIONS[table.base]} система`,
    ),
  );

  if (records.length === 0) {
    section.append(el('p', 'records__empty', 'Пока нет рекордов'));
    return section;
  }

  const head = el('thead');
  head.append(createHeaderRow());

  const body = el('tbody');
  records.slice(0, MAX_RECORDS).forEach((record, index) => {
    body.append(createRecordRow(index + 1, record));
  });

  const tableNode = el('table', 'records__table');
  tableNode.append(head, body);
  section.append(tableNode);
  return section;
};
