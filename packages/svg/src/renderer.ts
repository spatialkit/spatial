import type { FloormapCore, Entity } from '@floormap/core';
import type { SvgRenderer, SvgRendererOptions } from './index';
import { setupSvgRoot, getGroups, clearChildren } from './dom';
import { attachHandlers } from './handlers';

export function mountSvgRenderer(core: FloormapCore, opts: SvgRendererOptions): SvgRenderer {
  const {
    mount,
    drawEntity,
    defs,
    enableWheel = true,
    enablePanDrag = true,
    wheelZoomFactor = 0.0015,
    dragButton = 0,
    clickSelect = true,
    clickThresholdPx = 3,
  } = opts;

  setupSvgRoot(mount, defs);
  const groups = getGroups(mount);

  applyViewportTransform(core, groups.viewportG);

  paint(core, groups.objectsG, drawEntity);

  const offViewport = core.on('viewport.changed', () => {
    applyViewportTransform(core, groups.viewportG);
  });

  const offEntities = core.on('entities.changed', () => {
    paint(core, groups.objectsG, drawEntity);
  });

  const offSelection = core.on('selection.changed', () => {
    paint(core, groups.objectsG, drawEntity);
  });

  const detach = attachHandlers(mount, core, {
    enableWheel,
    enablePanDrag,
    wheelZoomFactor,
    dragButton,
    clickSelect,
    clickThresholdPx,
  });

  return {
    rerender() {
      paint(core, groups.objectsG, drawEntity);
    },
    destroy() {
      offViewport();
      offEntities();
      offSelection();
      detach();
    },
  };
}

function applyViewportTransform(core: FloormapCore, viewportG: SVGGElement) {
  const { zoom, pan } = core.viewport;

  const a = zoom,
    d = zoom,
    b = 0,
    c = 0;

  const e = -pan.x * zoom,
    f = -pan.y * zoom;

  viewportG.setAttribute('transform', `matrix(${a} ${b} ${c} ${d} ${e} ${f})`);
}

function paint(
  core: FloormapCore,
  objectsG: SVGGElement,
  drawEntity: (e: Entity, ctx: { g: SVGGElement }) => void,
) {
  clearChildren(objectsG);

  for (const layer of core.scene.layers) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('data-fm-layer', String(layer));
    objectsG.appendChild(g);

    for (const e of core.scene.entities.values()) {
      if (e.layer !== layer) {
        continue;
      }

      drawEntity(e, { g });
    }
  }
}
