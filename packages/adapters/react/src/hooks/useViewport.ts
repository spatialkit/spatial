import { useCallback, useRef, useSyncExternalStore } from 'react';
import type { SpatialCore, Viewport } from '@spatial-kit/core';

export function useViewport(core: SpatialCore): Viewport {
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
