import { useCallback, useRef, useSyncExternalStore } from 'react';
import type { FloormapCore, Viewport } from '@floormap-tools/core';

export function useViewport(core: FloormapCore): Viewport {
  const snapshotRef = useRef<Viewport>({ ...core.viewport, pan: { ...core.viewport.pan } });

  return useSyncExternalStore(
    useCallback(
      (notify) =>
        core.on('viewport:change', () => {
          snapshotRef.current = { ...core.viewport, pan: { ...core.viewport.pan } };
          notify();
        }),
      [core],
    ),
    useCallback(() => snapshotRef.current, []),
  );
}
