import { useCallback, useRef, useSyncExternalStore } from 'react';
import type { EntityId, FloormapCore } from '@floormap/core';

export function useSelection(core: FloormapCore): ReadonlySet<EntityId> {
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
