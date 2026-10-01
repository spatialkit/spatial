# @spatial-kit/svg

SVG renderer and DOM event handlers for [`@spatial-kit/core`](https://github.com/spatialkit/spatial/tree/main/packages/core). Mounts into any `<svg>` element, subscribes to core events, and paints the scene automatically. Includes wheel zoom, drag-to-pan, pinch-to-zoom, click-to-select, a background grid, a selection highlight overlay, drag-to-move, resize handles, and optional snap-to-grid.

## Installation

```bash
npm install @spatial-kit/core @spatial-kit/svg
# or
pnpm add @spatial-kit/core @spatial-kit/svg
```

## Quick start

```ts
import { createCore, createEmptyScene } from '@spatial-kit/core';
import { mountSvgRenderer } from '@spatial-kit/svg';
import type { EntityId, LayerId } from '@spatial-kit/core';

const core = createCore({
  scene: createEmptyScene({ width: 2000, height: 1500 }, ['layer' as LayerId]),
  viewport: { zoom: 1, pan: { x: 0, y: 0 }, screenSize: { width: 800, height: 600 } },
});

const svg = document.querySelector<SVGSVGElement>('svg')!;

const renderer = mountSvgRenderer(core, {
  mount: svg,
  drawEntity(entity, { g, selected }) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', String(entity.bounds.x));
    rect.setAttribute('y', String(entity.bounds.y));
    rect.setAttribute('width', String(entity.bounds.width));
    rect.setAttribute('height', String(entity.bounds.height));
    rect.setAttribute('fill', selected ? '#3b82f6' : '#94a3b8');
    g.appendChild(rect);
  },
});

// Force a full repaint
renderer.rerender();

// Remove all listeners and clean up DOM
renderer.destroy();
```

---

## API reference

### `mountSvgRenderer(core, options)`

Mounts the renderer onto an SVG element and returns a `SvgRenderer` handle.

```ts
interface SvgRenderer {
  rerender(): void; // force a full repaint (objects + selection overlay + grid)
  destroy(): void;  // unsubscribe from core events, remove DOM groups if clearOnDestroy
}
```

---

### Options

#### Required

| Option | Type | Description |
|--------|------|-------------|
| `mount` | `SVGSVGElement` | The SVG element to render into |
| `drawEntity` | `(entity, ctx) => void` | Called for every entity on every repaint — append SVG elements to `ctx.g` |

#### Interaction

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableWheel` | `boolean` | `true` | Wheel-to-zoom |
| `wheelZoomFactor` | `number` | `0.0015` | Wheel sensitivity. Delta passed to core = `-deltaY × factor` |
| `enablePanDrag` | `boolean` | `true` | Pointer drag-to-pan (applies to mouse; touch always tracks for pinch) |
| `enableEntityDrag` | `boolean` | `true` | Click-drag on an entity to move it in world space. Dragging a selected entity moves all selected entities together |
| `dragButton` | `0 \| 1 \| 2` | `0` | Mouse button that triggers drag pan (0 = left, 1 = middle, 2 = right) |
| `pinchZoomFactor` | `number` | `0.005` | Pinch sensitivity. Delta = `distanceDiff × factor` |
| `clickSelect` | `boolean` | `true` | Click on an entity to select it via `core.hitTest` |
| `clickThresholdPx` | `number` | `3` | Max pointer travel in pixels before a pointerdown/up is classified as a drag instead of a click |
| `modifierSelect` | `boolean` | `true` | Shift = add to selection, Ctrl/Meta = toggle. When `false`, clicks always replace selection |
| `onClickEntity` | `(id: EntityId) => void` | — | Called after `core.setSelection` when clicking a selectable entity |
| `snapToGrid` | `number` | — | Grid size in world units. When set, entity positions (drag) and edges (resize) snap to multiples of it |

#### Rendering

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `selectionOverlay` | `SelectionOverlayStyle \| false` | `{}` | Outline rects drawn around selected entities. Pass `false` to disable |
| `grid` | `GridOptions \| false` | `false` | Background grid. Pass `{}` to enable with defaults, or configure below |
| `defs` | `(defs: SVGDefsElement) => void` | — | Populate `<defs>` with gradients, clip paths, patterns, etc. |
| `clearOnDestroy` | `boolean` | `true` | Remove the viewport group and `<defs>` from the DOM on `destroy()` |

Resize handles are always drawn in the `overlays` group around each selected entity: 8 handles (corners and edge midpoints) with a fixed pixel size at any zoom. Dragging a handle resizes the entity, and takes priority over moving it.

To draw handles yourself, for example in a custom renderer, use `paintResizeHandles`:

```ts
import { paintResizeHandles } from '@spatial-kit/svg';
import type { ResizeHandleStyle } from '@spatial-kit/svg';

const style: ResizeHandleStyle = { size: 8, fill: '#fff', stroke: '#2563eb', strokeWidth: 1.5 };
paintResizeHandles(core, overlaysGroup, style); // values shown are the defaults
```

---

### `drawEntity` callback

```ts
drawEntity(entity: Entity, ctx: { g: SVGGElement; selected: boolean }): void
```

Called for every entity during every repaint. Append SVG children to `ctx.g` to represent the entity visually.

- `g` is the layer group for this entity — it is cleared and recreated on every repaint, so do not cache references to it
- `selected` is `true` when the entity's id is in `core.selection`
- Entity coordinates in `entity.bounds` are in **world space** — the renderer applies the viewport transform to the parent group, so you can use world coordinates directly

```ts
drawEntity(entity, { g, selected }) {
  const { x, y, width, height } = entity.bounds;
  const data = entity.data as { label: string };

  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', String(x));
  rect.setAttribute('y', String(y));
  rect.setAttribute('width', String(width));
  rect.setAttribute('height', String(height));
  rect.setAttribute('fill', selected ? '#3b82f6' : '#e2e8f0');
  g.appendChild(rect);

  if (data?.label) {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', String(x + width / 2));
    text.setAttribute('y', String(y + height / 2));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('font-size', '12');
    text.textContent = data.label;
    g.appendChild(text);
  }
},
```

---

### Grid options

```ts
interface GridOptions {
  size?:        number; // grid cell size in world units — default 50
  stroke?:      string; // line color — default '#e5e7eb'
  strokeWidth?: number; // line width in screen pixels — default 1
}
```

Grid lines use `vector-effect="non-scaling-stroke"`, so they always render at exactly `strokeWidth` pixels regardless of zoom level. Lines are redrawn on every viewport change.

```ts
// Enable with defaults
mountSvgRenderer(core, { ..., grid: {} });

// Custom grid
mountSvgRenderer(core, { ..., grid: { size: 100, stroke: '#d1d5db', strokeWidth: 0.5 } });

// Disable
mountSvgRenderer(core, { ..., grid: false });
```

---

### Selection overlay options

```ts
interface SelectionOverlayStyle {
  stroke?:      string; // outline color — default '#2563eb'
  strokeWidth?: number; // outline width in world units — default 2
  padding?:     number; // outset from entity bounds — default 4
  fill?:        string; // fill inside outline — default 'none'
}
```

The overlay draws a `<rect>` around each selected entity's bounds, expanded by `padding`. The rect has `pointer-events="none"` so it never intercepts clicks.

```ts
// Enable with defaults (blue outline, 4px padding)
mountSvgRenderer(core, { ..., selectionOverlay: {} });

// Custom style
mountSvgRenderer(core, { ..., selectionOverlay: { stroke: '#f97316', strokeWidth: 3, padding: 6 } });

// Disable
mountSvgRenderer(core, { ..., selectionOverlay: false });
```

---

### Using `<defs>` (gradients, patterns, clip paths)

```ts
mountSvgRenderer(core, {
  mount: svg,
  defs(defs) {
    const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    grad.setAttribute('id', 'tableGradient');
    // ... configure gradient ...
    defs.appendChild(grad);
  },
  drawEntity(entity, { g }) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('fill', 'url(#tableGradient)');
    // ...
    g.appendChild(rect);
  },
});
```

The `<defs>` element is created once and not cleared between repaints.

---

### Multi-select

When `modifierSelect: true` (the default), clicks interpret keyboard modifiers:

| Key held | `setSelection` mode | Effect |
|----------|---------------------|--------|
| None | `'replace'` | Select clicked entity, deselect others |
| Shift | `'add'` | Add clicked entity to current selection |
| Ctrl or Meta | `'toggle'` | Toggle clicked entity on/off |
| Any (empty space) | `'replace'` | Clear selection |
| Shift (empty space) | `'add'` | No-op — preserves current selection |

Set `modifierSelect: false` to disable modifier keys — all clicks use `'replace'` mode.

---

## SVG structure

The renderer builds and manages this group hierarchy inside your `<svg>`:

```
<svg>
  <g data-spatial="viewport">         ← viewport transform matrix applied here
    <g data-spatial="grid">           ← background grid lines
    <g data-spatial="objects">        ← entity groups, one per layer
      <g data-spatial-layer="floor">
      <g data-spatial-layer="furniture">
      ...
    <g data-spatial="selection">      ← selection overlay rects
    <g data-spatial="overlays">       ← reserved
  <defs data-spatial="defs">          ← present only if defs option is provided
```

**Viewport transform:**
```
matrix(zoom  0  0  zoom  -pan.x×zoom  -pan.y×zoom)
```

All children of `<g data-spatial="viewport">` — including grid and selection overlay — share the same camera transform. Entity coordinates in `drawEntity` can be used directly as world coordinates.

The hierarchy is created once and is **idempotent** — calling `mountSvgRenderer` again on the same SVG (e.g. after a hot reload) will reuse the existing groups.

---

## Event-driven repaints

The renderer subscribes to core events and repaints automatically:

| Core event | What repaints |
|-----------|---------------|
| `"viewport:change"` | Viewport transform matrix + grid |
| `"entities:changed"` | Objects (`drawEntity` called for all entities) |
| `"selection:change"` | Objects + selection overlay |

Call `renderer.rerender()` to force a full repaint of everything (objects, overlay, and grid).

---

## Patterns

### Dynamic styling based on entity data

```ts
interface RoomData {
  type: 'office' | 'meeting' | 'common';
  occupied: boolean;
}

const COLORS: Record<RoomData['type'], string> = {
  office:  '#dbeafe',
  meeting: '#dcfce7',
  common:  '#fef9c3',
};

drawEntity(entity, { g, selected }) {
  const data = entity.data as RoomData;
  const fill = selected ? '#3b82f6' : (data.occupied ? '#fca5a5' : COLORS[data.type]);

  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('fill', fill);
  // ... set bounds ...
  g.appendChild(rect);
},
```

### Updating `screenSize` on resize

The viewport `screenSize` is not updated automatically. Use a `ResizeObserver`:

```ts
const observer = new ResizeObserver(([entry]) => {
  const { width, height } = entry.contentRect;
  core.viewport.screenSize = { width, height };
  core.fitToScene();
});

observer.observe(svgContainer);
```

### Right-click to pan

```ts
mountSvgRenderer(core, {
  mount: svg,
  drawEntity: ...,
  dragButton: 2,  // right mouse button
});

svg.addEventListener('contextmenu', (e) => e.preventDefault());
```

### Disabling mouse interaction

```ts
mountSvgRenderer(core, {
  mount: svg,
  drawEntity: ...,
  enableWheel: false,
  enablePanDrag: false,
  clickSelect: false,
});
```

> **Note:** `enablePanDrag: false` only disables mouse drag-to-pan. Touch and pen pointers are always tracked for pinch-to-zoom and single-finger pan, regardless of this flag. There is currently no option to disable touch/pen interaction entirely.

---

## License

[MIT](./LICENSE)
