const TAG_RE = /<[^>]*>/g;

export function sanitizeText(value: string): string {
  return value.replace(TAG_RE, "").trim();
}
