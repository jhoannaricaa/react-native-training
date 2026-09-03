/** The list this drill is about: 5,000 `{ id, name }` objects. */
export type RowItem = { id: string; name: string };

export const ROW_COUNT = 5000;

const FIRST = [
  'Ada', 'Bruno', 'Camila', 'Dmitri', 'Elena', 'Farid', 'Grace', 'Hyun',
  'Imani', 'Jonas', 'Keiko', 'Lucas', 'Mira', 'Noor', 'Otto', 'Priya',
  'Quinn', 'Rafael', 'Sofia', 'Tomas', 'Uma', 'Viktor', 'Wren', 'Xiulan',
  'Yusuf', 'Zara',
];

const LAST = [
  'Alvarez', 'Bakker', 'Chen', 'Duarte', 'Eriksen', 'Fontaine', 'Gupta',
  'Haddad', 'Ivanov', 'Jensen', 'Kowalski', 'Lindqvist', 'Moreau', 'Nakamura',
  'Okonkwo', 'Petrov', 'Reyes', 'Silva', 'Tanaka', 'Ueda',
];

/**
 * Deterministic, so two screens rendering `ROWS` are rendering the same strings and the
 * numbers below are comparable. The `n` suffix keeps every name unique — a list where
 * 5,000 rows collapse into 520 distinct labels hides key mistakes instead of exposing them.
 */
export function buildRows(count: number, offset = 0): RowItem[] {
  const rows: RowItem[] = new Array(count);
  for (let i = 0; i < count; i += 1) {
    const n = offset + i;
    const first = FIRST[n % FIRST.length];
    const last = LAST[Math.floor(n / FIRST.length) % LAST.length];
    rows[i] = { id: `row-${n}`, name: `${first} ${last} ${n + 1}` };
  }
  return rows;
}

/**
 * Built once at module scope, on purpose. Both benchmark screens import this module, so
 * the cost of generating 5,000 objects is paid at import time and sits *outside* the mount
 * clock, which starts in the screen's render body. What the table measures is rendering,
 * not `Array.prototype.map`.
 */
export const ROWS: RowItem[] = buildRows(ROW_COUNT);
