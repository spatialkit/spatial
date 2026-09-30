import { useRef } from 'react';
import { createCore } from '@spatialkit/core';
import type { SpatialCore, Scene, Viewport } from '@spatialkit/core';

export interface SpatialCoreOptions {
  scene: Scene;
  viewport: Viewport;
}

export function useSpatialCore(
  init: SpatialCoreOptions | (() => SpatialCoreOptions),
): SpatialCore {
  const coreRef = useRef<SpatialCore | null>(null);
  if (coreRef.current === null) {
    const options = typeof init === 'function' ? init() : init;
    coreRef.current = createCore(options);
  }
  return coreRef.current;
}
