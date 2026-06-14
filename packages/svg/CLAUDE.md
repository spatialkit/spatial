# @floormap-tools/svg — Claude Code Guide

SVG renderer and DOM event handlers for `@floormap-tools/core`. Subscribes to core events and paints the scene into an `<svg>` element. No production dependencies.

---

## Entry point

```ts
import { mountSvgRenderer } from '@floormap-tools/svg';

const renderer = mountSvgRenderer(core, {
  mount: svgElement,
  drawEntity: (entity, { g, selected }) => {
    // Append SVG children into `g` to represent this entity
  },
});

renderer.rerender();  // force a full repaint
renderer.destroy();   // unsubscribe from core, remove DOM groups
```

---

## SVG group hierarchy

`setupSvgRoot` builds this structure inside the `<svg>` on first mount (idempotent — safe to call again if viewport group already exists):

```
<svg>
  <g data-fm="viewport">        ← CSS matrix transform applied here
    <g data-fm="grid">          ← background grid lines
    <g data-fm="objects">       ← one <g data-fm-layer="..."> per layer
      <g data-fm-layer="floor">
      <g data-fm-layer="furniture">
      ...
    <g data-fm="selection">     ← selection overlay rects
    <g data-fm="overlays">      ← reserved for future use
  <defs data-fm="defs">         ← optional, only if `defs` callback provided
```

**Transform matrix on `<g data-fm="viewport">`:**
```
matrix(zoom  0  0  zoom  -pan.x*zoom  -pan.y*zoom)
```
Grid and selection overlay are inside the viewport group, so they move and scale with the camera.

---

## `mountSvgRenderer` options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mount` | `SVGSVGElement` | required | SVG element to render into |
| `drawEntity` | `(entity, ctx) => void` | required | Called for each entity on every repaint |
| `defs` | `(defs: SVGDefsElement) => void` | — | Populate `<defs>` (gradients, clip paths, etc.) |
| `enableWheel` | `boolean` | `true` | Wheel-to-zoom |
| `enablePanDrag` | `boolean` | `true` | Pointer drag-to-pan (mouse only; touch/pen always track for pinch) |
| `wheelZoomFactor` | `number` | `0.0015` | Multiplier: `delta = -deltaY * factor` passed to `core.zoomAt` |
| `dragButton` | `0\|1\|2` | `0` | Mouse button that activates drag-pan |
| `clickSelect` | `boolean` | `true` | Click-to-select entities via `core.hitTest` |
| `onClickEntity` | `(id: EntityId) => void` | — | Called after `core.setSelection` on a click hit |
| `clickThresholdPx` | `number` | `3` | Max pointer travel (px) to count as a click vs drag |
| `modifierSelect` | `boolean` | `true` | Shift=add, Ctrl/Meta=toggle; false=always replace |
| `pinchZoomFactor` | `number` | `0.005` | Touch pinch sensitivity: `delta = distanceDiff * factor` |
| `selectionOverlay` | `SelectionOverlayStyle \| false` | `{}` | Blue outline rects around selected entities; `false` disables |
| `grid` | `GridOptions \| false` | `false` | Background grid; `false` disables |
| `clearOnDestroy` | `boolean` | `true` | Remove viewport group and defs from DOM on `destroy()` |

### `drawEntity` context

```ts
drawEntity: (entity: Entity, ctx: { g: SVGGElement; selected: boolean }) => void
```

- `g` — the layer group for this entity's layer; append children here
- `selected` — `true` if `entity.id` is in `core.selection`
- `g` is cleared and recreated on every repaint; don't cache references to it

---

## Event-driven repaints

| Core event | What the renderer does |
|-----------|------------------------|
| `"viewport:change"` | Updates viewport transform matrix + repaints grid |
| `"entities:changed"` | Repaints `<g data-fm="objects">` (calls `drawEntity` for all entities) |
| `"selection:change"` | Repaints objects (to pass updated `selected` flag) + repaints selection overlay |

`rerender()` forces all three: objects, selection overlay, and grid.

---

## Module breakdown

### `dom.ts` — SVG DOM structure

| Export | Behaviour |
|--------|-----------|
| `setupSvgRoot(svg, defs?)` | Creates the group hierarchy if absent; handles `<defs>` independently of the viewport guard — safe to call on remount |
| `getGroups(svg)` | Returns `{ viewportG, gridG, objectsG, selectionG, overlaysG }` |
| `clearChildren(node)` | Empties a node's children using `removeChild` loop |

`setupSvgRoot` is idempotent: calling it again when the viewport group already exists only creates missing `<defs>`. This allows reuse across hot-reloads or remounts.

---

### `grid.ts` — Background grid

`paintGrid(core, gridG, options)` — clears and redraws grid lines on every viewport change.

Computes visible world-space range from `pan` and `screenSize / zoom`, snaps to grid `size` boundary, draws vertical then horizontal `<line>` elements. All lines have `vector-effect="non-scaling-stroke"` so line width stays constant regardless of zoom.

**Default options:**
```ts
{ size: 50, stroke: '#e5e7eb', strokeWidth: 1 }
```

**Line count formula** (at zoom=1, pan=0, screenSize 800×600, size=50):
- Vertical:   `floor(0/50)*50 = 0` to `800` → 17 lines
- Horizontal: `floor(0/50)*50 = 0` to `600` → 13 lines

---

### `selection-overlay.ts` — Selection highlight

`paintSelectionOverlay(core, selectionG, style)` — clears and redraws a `<rect>` for each selected entity. Rects are inset/outset by `padding` from the entity's `bounds`. `pointer-events="none"` prevents the overlay from intercepting clicks.

**Default options:**
```ts
{ stroke: '#2563eb', strokeWidth: 2, padding: 4, fill: 'none' }
```

---

### `handlers.ts` — Pointer and wheel events

`attachHandlers(svg, core, options)` returns a `detach()` function that removes all listeners.

**Internal state:**
```ts
{
  dragging: boolean;
  downPos:  Vec2;          // screen position on pointerdown
  lastPos:  Vec2;          // previous frame position
  btn:      number;        // active drag button
  capturedPointerId: number;  // pointerId that received setPointerCapture (-1 if none)
}
pointers: Map<pointerId, Vec2>  // active touch/pen positions for pinch
```

**Event flow:**

- `wheel` → `core.zoomAt` (delta = `-deltaY * wheelZoomFactor`)
- `pointerdown` (mouse) → gated by `enablePanDrag` + `dragButton`; sets pointer capture, starts drag
- `pointerdown` (touch/pen) → always tracked in `pointers` map for pinch; bypasses `dragButton` check
- `pointermove` with 2 active pointers → pinch zoom at midpoint
- `pointermove` with 1 pointer → `core.panBy` with negated delta (dragging right pans viewport right)
- `pointerup` → releases capture only for the captured pointer; on click (travel ≤ `clickThresholdPx`): `core.hitTest` → `core.setSelection` + `onClickEntity`
- `pointercancel` → resets drag state

**Click modifier logic** (when `modifierSelect: true`):
| Key held | Mode passed to `setSelection` |
|----------|-------------------------------|
| Shift | `'add'` |
| Ctrl or Meta | `'toggle'` |
| None | `'replace'` |

Clicking empty space in `'replace'` mode clears selection. In `'add'`/`'toggle'` mode, clicking empty space is a no-op.

---

### `renderer.ts` — Mount and paint loop

`mountSvgRenderer` orchestrates everything:
1. Calls `setupSvgRoot` and `getGroups`
2. Applies initial viewport transform and paints entities/overlay/grid
3. Subscribes to `"viewport:change"`, `"entities:changed"`, `"selection:change"`
4. Calls `attachHandlers`

**`paint()` helper** — pre-groups entities by `LayerId` in a single O(n) pass, then iterates `scene.layers` to create `<g data-fm-layer>` elements in z-order. Avoids the O(layers × entities) nested loop.

---

## Testing patterns

All SVG tests require jsdom. Use the `// @vitest-environment jsdom` pragma at the top of the file (the vitest config can set it globally for this package too).

```ts
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountSvgRenderer } from '../renderer';
import { createCore } from '@floormap-tools/core';
```

**Required stubs** (jsdom doesn't implement these):

```ts
// Always stub — jsdom returns zero rect by default
svg.getBoundingClientRect = () => ({
  left: 0, top: 0, width: 800, height: 600,
  x: 0, y: 0, right: 800, bottom: 600,
  toJSON() { return {}; },
});

// Stub when testing pointer/click/drag events
svg.setPointerCapture = () => {};
svg.releasePointerCapture = () => {};
```

**Dispatching pointer events:**

```ts
svg.dispatchEvent(new PointerEvent('pointerdown', {
  button: 0, clientX: 150, clientY: 150, bubbles: true,
}));
svg.dispatchEvent(new PointerEvent('pointerup', {
  button: 0, clientX: 150, clientY: 150, bubbles: true,
}));
```

At zoom=1 and pan=0, screen coords equal world coords. Entity at `bounds { x: 100, y: 100, width: 100, height: 100 }` is hit by `clientX: 150, clientY: 150`.

**Querying groups:**
```ts
svg.querySelector("g[data-fm='viewport']")
svg.querySelector("g[data-fm='objects']")
svg.querySelector("g[data-fm='grid']")
svg.querySelector("g[data-fm='selection']")
svg.querySelector("[data-fm-layer='myLayer']")
```

---

## Adding to this package

1. New painter/helper → new file in `src/`
2. Export types from `src/index.ts`
3. Wire into `mountSvgRenderer` if it needs to react to core events
4. Tests in `src/__tests__/`, with `// @vitest-environment jsdom` pragma
5. Stub `getBoundingClientRect` (always) and pointer capture (if testing interactions)

No production dependencies — keep this package dep-free.
