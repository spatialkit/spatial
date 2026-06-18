import type { FloormapCore } from '@floormap-tools/core';
import { clearChildren } from './dom';

export type ResizeHandleStyle = {
  size?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
};

const NS = 'http://www.w3.org/2000/svg';

const DIRECTIONS = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const;

type Dir = typeof DIRECTIONS[number];

function handleCenter(bounds: { x: number; y: number; width: number; height: number }, dir: Dir) {
  const { x, y, width: w, height: h } = bounds;
  switch (dir) {
    case 'nw': return { x,          y          };
    case 'n':  return { x: x + w/2, y          };
    case 'ne': return { x: x + w,   y          };
    case 'e':  return { x: x + w,   y: y + h/2 };
    case 'se': return { x: x + w,   y: y + h   };
    case 's':  return { x: x + w/2, y: y + h   };
    case 'sw': return { x,          y: y + h   };
    case 'w':  return { x,          y: y + h/2 };
  }
}

export function paintResizeHandles(
  core: FloormapCore,
  overlaysG: SVGGElement,
  style: ResizeHandleStyle = {},
): void {
  const { size = 8, fill = '#fff', stroke = '#2563eb', strokeWidth = 1.5 } = style;

  clearChildren(overlaysG);

  if (core.selection.size === 0) return;

  const { zoom } = core.viewport;
  const halfWorld = size / zoom / 2;

  for (const id of core.selection) {
    const entity = core.scene.entities.get(id);
    if (!entity) continue;

    for (const dir of DIRECTIONS) {
      const center = handleCenter(entity.bounds, dir);
      const rect = document.createElementNS(NS, 'rect');
      rect.setAttribute('x', String(center.x - halfWorld));
      rect.setAttribute('y', String(center.y - halfWorld));
      rect.setAttribute('width', String(halfWorld * 2));
      rect.setAttribute('height', String(halfWorld * 2));
      rect.setAttribute('fill', fill);
      rect.setAttribute('stroke', stroke);
      rect.setAttribute('stroke-width', String(strokeWidth));
      rect.setAttribute('vector-effect', 'non-scaling-stroke');
      rect.setAttribute('pointer-events', 'none');
      overlaysG.appendChild(rect);
    }
  }
}
