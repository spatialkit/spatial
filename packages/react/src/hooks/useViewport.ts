import { useCallback, useRef, useSyncExternalStore } from 'react';
import type { FloormapCore, Viewport } from '@floormap/core';

export function useViewport(core: FloormapCore): Viewport {
  const snapshotRef = useRef<Viewport>({ ...core.viewport });

  return useSyncExternalStore(
    useCallback(
      (notify) =>
        core.on('viewport:change', () => {
          snapshotRef.current = { ...core.viewport };
          notify();
        }),
      [core],
    ),
    useCallback(() => snapshotRef.current, []),
  );
}
