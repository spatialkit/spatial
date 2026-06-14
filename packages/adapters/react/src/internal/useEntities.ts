import { useCallback, useRef, useSyncExternalStore } from 'react';
import type { Entity, FloormapCore } from '@floormap-tools/core';

export function useEntities(core: FloormapCore): Entity[] {
  const snapshotRef = useRef<Entity[]>([...core.scene.entities.values()]);

  return useSyncExternalStore(
    useCallback(
      (notify) =>
        core.on('entities:changed', () => {
          snapshotRef.current = [...core.scene.entities.values()];
          notify();
        }),
      [core],
    ),
    useCallback(() => snapshotRef.current, []),
    () => [],
  );
}
