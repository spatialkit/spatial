import type { EntityId, SelectionMode } from "./types";

export function applySelection(current: Set<EntityId>, ids: EntityId[], mode: SelectionMode): Set<EntityId> {
  const next = new Set(current);

  if (mode === 'replace') {
    next.clear();
    ids.forEach(id => next.add(id));

    return next;
  }

  if (mode === 'add') {
    ids.forEach(id => next.add(id));

    return next;
  }

  ids.forEach(id => (next.has(id) ? next.delete(id) : next.add(id)));
  
  return next;
}