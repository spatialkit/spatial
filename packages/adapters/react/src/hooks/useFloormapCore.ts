import { useRef } from 'react';
import { createCore } from '@floormap-tools/core';
import type { FloormapCore, Scene, Viewport } from '@floormap-tools/core';

export interface FloormapCoreOptions {
  scene: Scene;
  viewport: Viewport;
}

export function useFloormapCore(
  init: FloormapCoreOptions | (() => FloormapCoreOptions),
): FloormapCore {
  const coreRef = useRef<FloormapCore | null>(null);
  if (coreRef.current === null) {
    const options = typeof init === 'function' ? init() : init;
    coreRef.current = createCore(options);
  }
  return coreRef.current;
}
