/**
 * Lowercase, strip non-alphanumerics, collapse whitespace.
 * Used both for fuzzy/embedding matching AND for the import-dedup fallback
 * hash — keep this the single implementation so the two never drift apart.
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
