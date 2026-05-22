import { FloormapCore, EntityId } from '@floormap/core';

type AttachHandlersOptions = {
  enableWheel: boolean;
  enablePanDrag: boolean;
  wheelZoomFactor: number;
  dragButton: 0 | 1 | 2;
  clickSelect: boolean;
  clickThresholdPx: number;
  onClickEntity?: (id: EntityId) => void;
  modifierSelect: boolean;
  pinchZoomFactor: number;
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

  // Tracks active pointer positions for pinch-to-zoom
  const pointers = new Map<number, { x: number; y: number }>();

  function getCursor(event: PointerEvent | MouseEvent) {
    const rect = svg.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function pointerDist(a: { x: number; y: number }, b: { x: number; y: number }): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function onWheel(event: WheelEvent) {
    if (!options.enableWheel) return;
    event.preventDefault();
    const cursor = getCursor(event);
    const delta = -event.deltaY * options.wheelZoomFactor;
    core.zoomAt(cursor, delta);
  }

  function onPointerDown(event: PointerEvent) {
    if (!options.enablePanDrag) return;
    if (event.button !== options.dragButton) return;

    const cursor = getCursor(event);
    pointers.set(event.pointerId, cursor);

    if (pointers.size > 1) return; // second finger starts pinch, don't start drag

    svg.setPointerCapture(event.pointerId);
    state.dragging = true;
    state.btn = event.button;
    state.downPos = state.lastPos = cursor;
    svg.style.cursor = 'grabbing';
  }

  function onPointerMove(event: PointerEvent) {
    const curr = getCursor(event);

    if (pointers.size === 2) {
      const ids = [...pointers.keys()];
      const otherId = ids.find((id) => id !== event.pointerId);
      if (otherId !== undefined) {
        const prev = pointers.get(event.pointerId)!;
        const other = pointers.get(otherId)!;
        const prevDist = pointerDist(prev, other);
        pointers.set(event.pointerId, curr);
        const newDist = pointerDist(curr, other);
        const midpoint = { x: (curr.x + other.x) / 2, y: (curr.y + other.y) / 2 };
        core.zoomAt(midpoint, (newDist - prevDist) * options.pinchZoomFactor);
      }
      return;
    }

    if (!state.dragging || state.btn !== options.dragButton) return;

    const deltaX = curr.x - state.lastPos.x;
    const deltaY = curr.y - state.lastPos.y;
    state.lastPos = curr;
    core.panBy({ x: -deltaX, y: -deltaY });
  }

  function onPointerUp(e: PointerEvent) {
    const wasPinching = pointers.size >= 2;
    pointers.delete(e.pointerId);

    if (!state.dragging) return;

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

    if (wasClick && options.clickSelect && !wasPinching) {
      const mode = options.modifierSelect
        ? e.shiftKey
          ? ('add' as const)
          : e.ctrlKey || e.metaKey
            ? ('toggle' as const)
            : ('replace' as const)
        : ('replace' as const);

      const world = core.screenToWorld(up);
      const id = core.hitTest(world);
      if (id) {
        core.setSelection([id], mode);
        options.onClickEntity?.(id);
      } else if (mode === 'replace') {
        core.setSelection([], 'replace');
      }
    }
  }

  function onPointerCancel(e: PointerEvent) {
    pointers.delete(e.pointerId);
    if (state.dragging) {
      state.dragging = false;
      state.btn = -1;
      svg.style.cursor = '';
    }
  }

  svg.addEventListener('wheel', onWheel, { passive: false });
  svg.addEventListener('pointerdown', onPointerDown);
  svg.addEventListener('pointermove', onPointerMove);
  svg.addEventListener('pointerup', onPointerUp);
  svg.addEventListener('pointercancel', onPointerCancel);

  return function detach() {
    svg.removeEventListener('wheel', onWheel as EventListener);
    svg.removeEventListener('pointerdown', onPointerDown as EventListener);
    svg.removeEventListener('pointermove', onPointerMove as EventListener);
    svg.removeEventListener('pointerup', onPointerUp as EventListener);
    svg.removeEventListener('pointercancel', onPointerCancel as EventListener);
  };
}
