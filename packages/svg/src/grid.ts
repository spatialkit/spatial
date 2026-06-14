import type { FloormapCore } from '@floormap-tools/core';
import { clearChildren } from './dom';

export type GridOptions = {
  size?: number;
  stroke?: string;
  strokeWidth?: number;
};

const NS = 'http://www.w3.org/2000/svg';

export function paintGrid(core: FloormapCore, gridG: SVGGElement, options: GridOptions = {}): void {
  const { size = 50, stroke = '#e5e7eb', strokeWidth = 1 } = options;
  const { zoom, pan, screenSize } = core.viewport;

  const left = pan.x;
  const top = pan.y;
  const right = pan.x + screenSize.width / zoom;
  const bottom = pan.y + screenSize.height / zoom;

  const startX = Math.floor(left / size) * size;
  const startY = Math.floor(top / size) * size;

  clearChildren(gridG);

  for (let x = startX; x <= right; x += size) {
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', String(x));
    line.setAttribute('y1', String(top));
    line.setAttribute('x2', String(x));
    line.setAttribute('y2', String(bottom));
    line.setAttribute('stroke', stroke);
    line.setAttribute('stroke-width', String(strokeWidth));
    line.setAttribute('vector-effect', 'non-scaling-stroke');
    gridG.appendChild(line);
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
    gridG.appendChild(line);
  }
}
