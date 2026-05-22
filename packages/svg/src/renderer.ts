import type { FloormapCore, Entity } from '@floormap/core';
import type { SvgRenderer, SvgRendererOptions } from './index';
import { setupSvgRoot, getGroups, clearChildren } from './dom';
import { attachHandlers } from './handlers';
import { paintSelectionOverlay } from './selection-overlay';
import { paintGrid } from './grid';

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
    onClickEntity,
    clickThresholdPx = 3,
    modifierSelect = true,
    pinchZoomFactor = 0.005,
    selectionOverlay = {},
    grid = false,
    clearOnDestroy = true,
  } = opts;

  setupSvgRoot(mount, defs);
  const groups = getGroups(mount);

  applyViewportTransform(core, groups.viewportG);
  paint(core, groups.objectsG, drawEntity);
  if (selectionOverlay !== false) paintSelectionOverlay(core, groups.selectionG, selectionOverlay);
  if (grid !== false) paintGrid(core, groups.gridG, grid);

  const offViewport = core.on('viewport:change', () => {
    applyViewportTransform(core, groups.viewportG);
    if (grid !== false) paintGrid(core, groups.gridG, grid);
  });

  const offEntities = core.on('entities:changed', () => {
    paint(core, groups.objectsG, drawEntity);
  });

  const offSelection = core.on('selection:change', () => {
    paint(core, groups.objectsG, drawEntity);
    if (selectionOverlay !== false) {
      paintSelectionOverlay(core, groups.selectionG, selectionOverlay);
    } else {
      clearChildren(groups.selectionG);
    }
  });

  const detach = attachHandlers(mount, core, {
    enableWheel,
    enablePanDrag,
    wheelZoomFactor,
    dragButton,
    clickSelect,
    onClickEntity,
    clickThresholdPx,
    modifierSelect,
    pinchZoomFactor,
  });

  return {
    rerender() {
      paint(core, groups.objectsG, drawEntity);
      if (selectionOverlay !== false) paintSelectionOverlay(core, groups.selectionG, selectionOverlay);
      if (grid !== false) paintGrid(core, groups.gridG, grid);
    },
    destroy() {
      offViewport();
      offEntities();
      offSelection();
      detach();
      if (clearOnDestroy) {
        groups.viewportG.remove();
        mount.querySelector("defs[data-fm='defs']")?.remove();
      }
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
  drawEntity: (e: Entity, ctx: { g: SVGGElement; selected: boolean }) => void,
) {
  clearChildren(objectsG);

  for (const layer of core.scene.layers) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('data-fm-layer', String(layer));
    objectsG.appendChild(g);

    for (const e of core.scene.entities.values()) {
      if (e.layer !== layer) continue;
      drawEntity(e, { g, selected: core.selection.has(e.id) });
    }
  }
}
