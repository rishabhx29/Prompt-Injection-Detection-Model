/**
 * Shared text tokenisation.
 *
 * Used by detection (task/segment overlap) and scoring (benign damping), so the
 * notion of "meaningful word" is defined exactly once. The stopword list is
 * **data**, supplied from `src/config/defaults.ts` — never inline here (FR-3.10).
 */

const WORD_PATTERN = /[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)?/gu;

/** Lowercased word tokens in first-appearance order. */
export function tokenizeWords(text: string): string[] {
  return [...text.toLowerCase().matchAll(WORD_PATTERN)].map((match) => match[0]);
}

/**
 * Tokens that carry meaning, given a configured stopword set.
 *
 * Longer-than-two characters excludes noise like "no"/"of" that tokenisation
 * keeps; `stopwords` removes function words such as "the", "and", "with" that
 * would otherwise create spurious task overlap.
 */
export function meaningfulTokens(
  text: string,
  stopwords: ReadonlySet<string>,
): string[] {
  return tokenizeWords(text).filter(
    (word) => word.length > 2 && !stopwords.has(word) && !/^\d+$/u.test(word),
  );
}
