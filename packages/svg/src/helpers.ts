import { FloormapCore } from '@floormap/core';

type AttachHandlersOptions = {
  enableWheel: boolean;
  enablePanDrag: boolean;
  wheelZoomFactor: number;
  dragButton: 0 | 1 | 2;
  clickSelect: boolean;
  clickThresholdPx: number;
};

export function attachHandlers(
  svg: SVGSVGElement,
  core: FloormapCore,
  options: AttachHandlersOptions,
) {
  const state = {
    dragging: false,
    downPos: { x: 0, y: 0 },
    lastPos: { x: 0, y: 0 },
    btn: -1 as number,
  };

  function getCursor(event: PointerEvent | MouseEvent) {
    const rect = svg.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function onWheel(event: WheelEvent) {
    if (!options.enableWheel) {
      return;
    }

    event.preventDefault();
    const cursor = getCursor(event);
    const delta = -event.deltaY * options.wheelZoomFactor;
    core.zoomAt(cursor, delta);
  }

  function onPointerDown(event: PointerEvent) {
    if (!options.enablePanDrag) {
      return;
    }

    if (event.button !== options.dragButton) {
      return;
    }

    svg.setPointerCapture(event.pointerId);
    state.dragging = true;
    state.btn = event.button;
    state.downPos = state.lastPos = getCursor(event);
    svg.style.cursor = 'grabbing';
  }

  function onPointerMove(event: PointerEvent) {
    if (!state.dragging || state.btn !== options.dragButton) {
      return;
    }

    const curr = getCursor(event);
    const deltaX = curr.x - state.lastPos.x;
    const deltaY = curr.y - state.lastPos.y;
    state.lastPos = curr;
    core.panBy({ x: -deltaX, y: -deltaY });
  }

  function onPointerUp(e: PointerEvent) {
    if (!state.dragging) {
      return;
    }

    svg.releasePointerCapture(e.pointerId);
    const up = getCursor(e);
    const deltaX = up.x - state.downPos.x;
    const deltaY = up.y - state.downPos.y;
    const dist2 = deltaX * deltaX + deltaY * deltaY;
    const threshold2 = options.clickThresholdPx * options.clickThresholdPx;
    svg.style.cursor = '';

    const wasClick = dist2 <= threshold2;

    state.dragging = false;
    state.btn = -1;

    if (wasClick && options.clickSelect) {
      const world = core.screenToWorld(up);
      const id = core.hitTest(world);
      if (id) {
        core.setSelection([id], 'replace');
      } else {
        core.setSelection([], 'replace');
      }
    }
  }

  svg.addEventListener('wheel', onWheel, { passive: false });
  svg.addEventListener('pointerdown', onPointerDown);
  svg.addEventListener('pointermove', onPointerMove);
  svg.addEventListener('pointerup', onPointerUp);

  return function detach() {
    svg.removeEventListener('wheel', onWheel as any);
    svg.removeEventListener('pointerdown', onPointerDown as any);
    svg.removeEventListener('pointermove', onPointerMove as any);
    svg.removeEventListener('pointerup', onPointerUp as any);
  };
}
