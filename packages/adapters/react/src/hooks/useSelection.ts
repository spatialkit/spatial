import { useCallback, useRef, useSyncExternalStore } from 'react';
import type { EntityId, SpatialCore } from '@spatial-kit/core';

export function useSelection(core: SpatialCore): ReadonlySet<EntityId> {
  const snapshotRef = useRef<ReadonlySet<EntityId>>(new Set(core.selection));

  return useSyncExternalStore(
    useCallback(
      (notify) =>
        core.on('selection:change', () => {
          snapshotRef.current = new Set(core.selection);
          notify();
        }),
      [core],
    ),
    useCallback(() => snapshotRef.current, []),
    () => new Set<EntityId>() as ReadonlySet<EntityId>,
  );
}
