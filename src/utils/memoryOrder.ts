import type { Memory, Group } from '../types/memory';

/** Sort key: order (undefined = end), then createdAt. */
export function compareOrderThenCreatedAt(a: Memory, b: Memory): number {
  const oa = a.order ?? Infinity;
  const ob = b.order ?? Infinity;
  if (oa !== ob) return oa - ob;
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

/** Return memories in sidebar order: ungrouped first (sorted), then each group (sorted). */
export function memoriesInSidebarOrder(memories: Memory[], groups: Group[]): Memory[] {
  const ungrouped = memories
    .filter((m) => !(m.groupId ?? null))
    .sort(compareOrderThenCreatedAt);
  const result: Memory[] = [...ungrouped];
  for (const g of groups) {
    const inGroup = memories
      .filter((m) => (m.groupId ?? null) === g.id)
      .sort(compareOrderThenCreatedAt);
    result.push(...inGroup);
  }
  return result;
}
