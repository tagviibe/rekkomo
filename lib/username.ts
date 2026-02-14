export function slugifyUsername(value: string) {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "")
    .replace(/-+/g, "");
  return base || "user";
}

export async function generateUniqueUsername(
  base: string,
  lookup: (username: string) => Promise<boolean>
) {
  const slug = slugifyUsername(base);
  let candidate = slug;
  let counter = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await lookup(candidate);
    if (!exists) return candidate;
    counter += 1;
    candidate = `${slug}${counter}`;
  }
}
