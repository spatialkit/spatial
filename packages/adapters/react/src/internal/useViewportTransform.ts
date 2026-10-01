import { type RefObject, useEffect } from 'react';
import type { SpatialCore } from '@spatial-kit/core';

export function useViewportTransform(
  core: SpatialCore,
  ref: RefObject<SVGGElement | null>,
): void {
  useEffect(() => {
    function apply() {
      const el = ref.current;
      if (!el) return;
      const { zoom, pan } = core.viewport;
      el.setAttribute(
        'transform',
        `matrix(${zoom} 0 0 ${zoom} ${-pan.x * zoom} ${-pan.y * zoom})`,
      );
    }
    apply();
    return core.on('viewport:change', apply);
  }, [core, ref]);
}
