import { memo, useEffect, useRef } from 'react';
import type { SpatialCore, Viewport } from '@spatial-kit/core';
import type { GridOptions } from '../types';

interface GridLayerProps {
  core: SpatialCore;
  options: GridOptions;
}

export const GridLayer = memo(function GridLayer({ core, options }: GridLayerProps) {
  const gRef = useRef<SVGGElement>(null);

  useEffect(() => {
    function paint() {
      const g = gRef.current;
      if (!g) return;
      paintGrid(g, core.viewport, options);
    }
    paint();
    return core.on('viewport:change', paint);
  }, [core, options]);

  return <g data-spatial="grid" ref={gRef} />;
});

const NS = 'http://www.w3.org/2000/svg';

function paintGrid(g: SVGGElement, viewport: Viewport, opts: GridOptions) {
  const { size = 50, stroke = '#e5e7eb', strokeWidth = 1 } = opts;
  const { zoom, pan, screenSize } = viewport;

  while (g.firstChild) g.removeChild(g.firstChild);

  const left = pan.x;
  const right = pan.x + screenSize.width / zoom;
  const top = pan.y;
  const bottom = pan.y + screenSize.height / zoom;
  const startX = Math.floor(left / size) * size;
  const startY = Math.floor(top / size) * size;

  for (let x = startX; x <= right; x += size) {
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', String(x));
    line.setAttribute('y1', String(top));
    line.setAttribute('x2', String(x));
    line.setAttribute('y2', String(bottom));
    line.setAttribute('stroke', stroke);
    line.setAttribute('stroke-width', String(strokeWidth));
    line.setAttribute('vector-effect', 'non-scaling-stroke');
    g.appendChild(line);
  }

  for (let y = startY; y <= bottom; y += size) {
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', String(left));
    line.setAttribute('y1', String(y));
    line.setAttribute('x2', String(right));
    line.setAttribute('y2', String(y));
    line.setAttribute('stroke', stroke);
    line.setAttribute('stroke-width', String(strokeWidth));
    line.setAttribute('vector-effect', 'non-scaling-stroke');
    g.appendChild(line);
  }
}
