import { useCallback, useMemo, useState } from 'react';

/** The title budget the drill validates against. Also the counter's denominator. */
export const TITLE_MAX_LENGTH = 60;

/** Every field is a string, because every field is backed by a controlled TextInput.
 *  `tags` is the raw text the user typed; the parsed list is derived, never stored. */
export type NoteDraft = {
  title: string;
  body: string;
  tags: string;
};

export type SavedNote = {
  title: string;
  body: string;
  tags: string[];
};

/** Discriminated instead of a boolean so the field can explain *which* rule it broke. */
export type TitleError = 'empty' | 'too-long' | null;

const EMPTY_DRAFT: NoteDraft = { title: '', body: '', tags: '' };

/** "rn, ios , #layout, rn" -> ["rn", "ios", "layout"]. Case-preserving, order-preserving. */
export function parseTags(raw: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];

  for (const piece of raw.split(',')) {
    const tag = piece.trim().replace(/^#+/, '');
    const key = tag.toLowerCase();
    if (tag.length > 0 && !seen.has(key)) {
      seen.add(key);
      tags.push(tag);
    }
  }
  return tags;
}

function titleErrorFor(title: string): TitleError {
  // Whitespace-only is empty: a title of three spaces must not unlock Save.
  if (title.trim().length === 0) return 'empty';
  // Counted on the raw value, so what the counter shows is what the rule measures.
  if (title.length > TITLE_MAX_LENGTH) return 'too-long';
  return null;
}

export function useNoteDraft() {
  const [draft, setDraft] = useState<NoteDraft>(EMPTY_DRAFT);

  /** Generic over the key so `setField('title', 5)` fails to compile. */
  const setField = useCallback(<K extends keyof NoteDraft>(field: K, value: NoteDraft[K]) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Derived on every render rather than mirrored into state: one source of truth means the
  // border, the counter and the button's disabled flag can never disagree mid-keystroke.
  const titleError = titleErrorFor(draft.title);
  const tags = useMemo(() => parseTags(draft.tags), [draft.tags]);

  /** Returns the note on success, `null` when the draft is still invalid, so a caller that
   *  ignores `canSave` (a hardware Return, say) still cannot save a broken note. */
  const commit = useCallback((): SavedNote | null => {
    if (titleErrorFor(draft.title) !== null) return null;
    const note: SavedNote = {
      title: draft.title.trim(),
      body: draft.body.trim(),
      tags: parseTags(draft.tags),
    };
    setDraft(EMPTY_DRAFT);
    return note;
  }, [draft]);

  return {
    draft,
    setField,
    titleError,
    canSave: titleError === null,
    /** Negative once the title runs past the budget — the counter reads it either way. */
    remaining: TITLE_MAX_LENGTH - draft.title.length,
    tags,
    commit,
  };
}
