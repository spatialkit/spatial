import { SpatialCore, EntityId, snapToGrid, hitTestResizeHandles, applyResizeDelta } from '@spatialkit/core';
import type { Bounds, ResizeDirection } from '@spatialkit/core';

type AttachHandlersOptions = {
  enableWheel: boolean;
  enablePanDrag: boolean;
  enableEntityDrag: boolean;
  wheelZoomFactor: number;
  dragButton: 0 | 1 | 2;
  clickSelect: boolean;
  clickThresholdPx: number;
  onClickEntity?: (id: EntityId) => void;
  modifierSelect: boolean;
  pinchZoomFactor: number;
  snapToGrid?: number;
};

export function attachHandlers(
  svg: SVGSVGElement,
  core: SpatialCore,
  options: AttachHandlersOptions,
) {
  const state = {
    dragMode: 'idle' as 'idle' | 'pending' | 'pan' | 'entity' | 'resize',
    downPos: { x: 0, y: 0 },
    lastPos: { x: 0, y: 0 },
    btn: -1 as number,
    capturedPointerId: -1,
    // entity drag state
    hitEntityId: null as EntityId | null,
    entitySnapshots: new Map<EntityId, Bounds>(),
    entityDragWorldStart: { x: 0, y: 0 },
    // resize state
    resizeHandle: null as { entityId: EntityId; direction: ResizeDirection } | null,
    resizeSnapshot: null as Bounds | null,
    resizeDragWorldStart: { x: 0, y: 0 },
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
    const isTouch = event.pointerType !== 'mouse';

    if (!isTouch && !options.enablePanDrag && !options.enableEntityDrag) return;
    if (!isTouch && event.button !== options.dragButton) return;

    const cursor = getCursor(event);
    pointers.set(event.pointerId, cursor);

    if (pointers.size > 1) return; // second finger starts pinch, don't start drag

    svg.setPointerCapture(event.pointerId);
    state.capturedPointerId = event.pointerId;
    state.dragMode = 'pending';
    state.btn = event.button;
    state.downPos = state.lastPos = cursor;

    const selectedEntities = [...core.selection]
      .map((id) => core.scene.entities.get(id))
      .filter((e): e is NonNullable<typeof e> => e != null);
    const handleHit = hitTestResizeHandles(selectedEntities, (p) => core.worldToScreen(p), cursor);

    if (handleHit) {
      state.resizeHandle = handleHit;
      state.hitEntityId = null;
    } else {
      state.resizeHandle = null;
      state.hitEntityId = options.enableEntityDrag
        ? core.hitTest(core.screenToWorld(cursor))
        : null;
    }
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

    if (state.dragMode === 'idle' || state.btn !== options.dragButton) return;

    if (state.dragMode === 'pending') {
      const dx = curr.x - state.downPos.x;
      const dy = curr.y - state.downPos.y;
      const threshold2 = options.clickThresholdPx * options.clickThresholdPx;

      if (state.resizeHandle !== null) {
        if (dx * dx + dy * dy <= threshold2) { state.lastPos = curr; return; }
        state.dragMode = 'resize';
        const entity = core.scene.entities.get(state.resizeHandle.entityId);
        state.resizeSnapshot = entity ? { ...entity.bounds } : null;
        state.resizeDragWorldStart = core.screenToWorld(state.downPos);
        svg.style.cursor = 'crosshair';
      } else if (state.hitEntityId !== null) {
        // Stay pending until movement exceeds click threshold
        if (dx * dx + dy * dy <= threshold2) {
          state.lastPos = curr;
          return;
        }
        // Commit to entity drag
        state.dragMode = 'entity';
        if (!core.selection.has(state.hitEntityId)) {
          core.setSelection([state.hitEntityId], 'replace');
        }
        state.entitySnapshots.clear();
        for (const id of core.selection) {
          const e = core.scene.entities.get(id);
          if (e) state.entitySnapshots.set(id, { ...e.bounds });
        }
        state.entityDragWorldStart = core.screenToWorld(state.downPos);
        svg.style.cursor = 'move';
      } else {
        // No entity hit — immediately commit to pan
        state.dragMode = 'pan';
      }
    }

    if (state.dragMode === 'resize') {
      if (state.resizeHandle && state.resizeSnapshot) {
        const worldCurr = core.screenToWorld(curr);
        const worldDelta = {
          x: worldCurr.x - state.resizeDragWorldStart.x,
          y: worldCurr.y - state.resizeDragWorldStart.y,
        };
        const newBounds = applyResizeDelta(
          state.resizeSnapshot,
          state.resizeHandle.direction,
          worldDelta,
          options.snapToGrid,
        );
        core.update(state.resizeHandle.entityId, { bounds: newBounds });
      }
      state.lastPos = curr;
      return;
    }

    if (state.dragMode === 'entity') {
      const worldCurr = core.screenToWorld(curr);
      const worldDelta = {
        x: worldCurr.x - state.entityDragWorldStart.x,
        y: worldCurr.y - state.entityDragWorldStart.y,
      };
      const patches = [];
      for (const [id, snap] of state.entitySnapshots) {
        const rawX = snap.x + worldDelta.x;
        const rawY = snap.y + worldDelta.y;
        patches.push({
          id,
          patch: {
            bounds: {
              x: options.snapToGrid ? snapToGrid(rawX, options.snapToGrid) : rawX,
              y: options.snapToGrid ? snapToGrid(rawY, options.snapToGrid) : rawY,
              width: snap.width,
              height: snap.height,
            },
          },
        });
      }
      core.updateMany(patches);
      state.lastPos = curr;
      return;
    }

    if (state.dragMode === 'pan') {
      if (!options.enablePanDrag) {
        state.lastPos = curr;
        return;
      }
      const deltaX = curr.x - state.lastPos.x;
      const deltaY = curr.y - state.lastPos.y;
      state.lastPos = curr;
      core.panBy({ x: -deltaX, y: -deltaY });
    }
  }

  function onPointerUp(e: PointerEvent) {
    const wasPinching = pointers.size >= 2;
    pointers.delete(e.pointerId);

    if (state.dragMode === 'idle') return;

    if (state.capturedPointerId === e.pointerId) {
      svg.releasePointerCapture(e.pointerId);
      state.capturedPointerId = -1;
    }
    const up = getCursor(e);
    const deltaX = up.x - state.downPos.x;
    const deltaY = up.y - state.downPos.y;
    const dist2 = deltaX * deltaX + deltaY * deltaY;
    const threshold2 = options.clickThresholdPx * options.clickThresholdPx;
    svg.style.cursor = '';

    const wasClick = dist2 <= threshold2;
    const prevMode = state.dragMode;

    state.dragMode = 'idle';
    state.btn = -1;
    state.hitEntityId = null;
    state.entitySnapshots.clear();
    state.resizeHandle = null;
    state.resizeSnapshot = null;

    if (wasClick && options.clickSelect && !wasPinching && prevMode !== 'entity' && prevMode !== 'resize') {
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
    if (state.dragMode !== 'idle') {
      if (state.capturedPointerId === e.pointerId) {
        svg.releasePointerCapture(e.pointerId);
        state.capturedPointerId = -1;
      }
      state.dragMode = 'idle';
      state.btn = -1;
      state.hitEntityId = null;
      state.entitySnapshots.clear();
      state.resizeHandle = null;
      state.resizeSnapshot = null;
      svg.style.cursor = '';
    }
  }

  function onSelectStart(e: Event) {
    e.preventDefault();
  }

  svg.addEventListener('wheel', onWheel, { passive: false });
  svg.addEventListener('pointerdown', onPointerDown);
  svg.addEventListener('pointermove', onPointerMove);
  svg.addEventListener('pointerup', onPointerUp);
  svg.addEventListener('pointercancel', onPointerCancel);
  svg.addEventListener('selectstart', onSelectStart);

  return function detach() {
    svg.removeEventListener('wheel', onWheel as EventListener);
    svg.removeEventListener('pointerdown', onPointerDown as EventListener);
    svg.removeEventListener('pointermove', onPointerMove as EventListener);
    svg.removeEventListener('pointerup', onPointerUp as EventListener);
    svg.removeEventListener('pointercancel', onPointerCancel as EventListener);
    svg.removeEventListener('selectstart', onSelectStart);
  };
}
