export type Visibility = "PUBLIC" | "COMMUNITY_ONLY" | "PRIVATE";

export function canViewProfile(
  visibility: Visibility | null | undefined,
  options: { isSelf?: boolean; hasCommunityOverlap?: boolean }
) {
  if (options.isSelf) return true;
  if (visibility === "PRIVATE") return false;
  if (visibility === "COMMUNITY_ONLY") {
    return Boolean(options.hasCommunityOverlap);
  }
  return true;
}

export function overlapCount(a: string[], b: string[]) {
  const set = new Set(a);
  return b.reduce((count, value) => (set.has(value) ? count + 1 : count), 0);
}
