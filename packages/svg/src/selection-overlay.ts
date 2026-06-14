import type { FloormapCore } from '@floormap-tools/core';
import { clearChildren } from './dom';

export type SelectionOverlayStyle = {
  stroke?: string;
  strokeWidth?: number;
  padding?: number;
  fill?: string;
};

const NS = 'http://www.w3.org/2000/svg';

export function paintSelectionOverlay(
  core: FloormapCore,
  selectionG: SVGGElement,
  style: SelectionOverlayStyle = {},
): void {
  const { stroke = '#2563eb', strokeWidth = 2, padding = 4, fill = 'none' } = style;

  clearChildren(selectionG);

  for (const id of core.selection) {
    const entity = core.scene.entities.get(id);
    if (!entity) continue;

    const rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('x', String(entity.bounds.x - padding));
    rect.setAttribute('y', String(entity.bounds.y - padding));
    rect.setAttribute('width', String(entity.bounds.width + padding * 2));
    rect.setAttribute('height', String(entity.bounds.height + padding * 2));
    rect.setAttribute('stroke', stroke);
    rect.setAttribute('stroke-width', String(strokeWidth));
    rect.setAttribute('fill', fill);
    rect.setAttribute('pointer-events', 'none');
    selectionG.appendChild(rect);
  }
}
