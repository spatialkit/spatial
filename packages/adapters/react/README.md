# @spatialkit/react

React adapter for [`@spatialkit/core`](https://github.com/spatialkit/spatial/tree/main/packages/core). Provides a drop-in `<SpatialCanvas>` component and hooks for building interactive 2D editors — floor plans, seat maps, office layouts — with zero boilerplate.

## Installation

```bash
npm install @spatialkit/core @spatialkit/react
# or
pnpm add @spatialkit/core @spatialkit/react
```

React 18 or 19 is required as a peer dependency.

## Quick start

```tsx
import { useCallback, useEffect } from 'react';
import { createEmptyScene } from '@spatialkit/core';
import type { Entity, EntityId, LayerId } from '@spatialkit/core';
import { SpatialCanvas, useSpatialCore, useSelection, useViewport } from '@spatialkit/react';

const LAYER = 'main' as LayerId;

const initialScene = (() => {
  const scene = createEmptyScene({ width: 1200, height: 800 }, [LAYER]);
  // addEntity is a store helper — import from @spatialkit/core if needed,
  // or use core.add() after the core is created.
  return scene;
})();

export function FloorPlan() {
  const core = useSpatialCore(() => ({
    scene: initialScene,
    viewport: { zoom: 1, pan: { x: 0, y: 0 }, screenSize: { width: 800, height: 600 } },
  }));

  const selection = useSelection(core);
  const viewport = useViewport(core);

  useEffect(() => {
    core.add({
      id: 'table-1' as EntityId,
      layer: LAYER,
      bounds: { x: 100, y: 100, width: 120, height: 80 },
      selectable: true,
      data: { label: 'Table 1' },
    });
    core.fitToScene(40);
  }, [core]);

  const drawEntity = useCallback((entity: Entity, { selected }: { selected: boolean }) => (
    <rect
      x={entity.bounds.x} y={entity.bounds.y}
      width={entity.bounds.width} height={entity.bounds.height}
      fill={selected ? '#3b82f6' : '#e5e7eb'} rx={4}
    />
  ), []);

  return (
    <div>
      <p>Zoom: {Math.round(viewport.zoom * 100)}%</p>
      <p>Selected: {[...selection].join(', ') || 'none'}</p>
      <SpatialCanvas
        core={core}
        drawEntity={drawEntity}
        grid={{ size: 40 }}
        selectionOverlay={{}}
        style={{ width: '100%', height: 500 }}
      />
    </div>
  );
}
```

---

## API reference

### `<SpatialCanvas>`

The main component. Renders an `<svg>` element, manages the viewport transform, wires all pointer/wheel interactions, and calls `drawEntity` for every entity in the scene.

```tsx
<SpatialCanvas
  core={core}
  drawEntity={(entity, { selected }) => <rect ... />}
  grid={{ size: 40 }}
  selectionOverlay={{}}
  style={{ width: '100%', height: 600 }}
/>
```

#### Required props

| Prop | Type | Description |
|------|------|-------------|
| `core` | `SpatialCore` | The engine instance created with `useSpatialCore` |
| `drawEntity` | `(entity, ctx) => ReactNode` | Called for every entity — return React SVG elements |

#### Rendering

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `grid` | `GridOptions \| false` | `false` | Background grid. Pass `{}` to enable with defaults |
| `selectionOverlay` | `SelectionOverlayStyle \| false` | `{}` | Outline rects around selected entities. Pass `false` to disable |
| `className` | `string` | — | CSS class on the `<svg>` element |
| `style` | `CSSProperties` | — | Inline styles on the `<svg>` element |

#### Interaction

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enableWheel` | `boolean` | `true` | Wheel-to-zoom |
| `wheelZoomFactor` | `number` | `0.0015` | Wheel sensitivity |
| `enablePanDrag` | `boolean` | `true` | Pointer drag-to-pan |
| `enableEntityDrag` | `boolean` | `true` | Click-drag on an entity to move it. Dragging a selected entity moves all selected entities together |
| `dragButton` | `0 \| 1 \| 2` | `0` | Mouse button for drag pan (0 = left, 1 = middle, 2 = right) |
| `pinchZoomFactor` | `number` | `0.005` | Pinch-to-zoom sensitivity |
| `clickSelect` | `boolean` | `true` | Click on an entity to select it |
| `modifierSelect` | `boolean` | `true` | Shift = add to selection, Ctrl/Meta = toggle |
| `onClickEntity` | `(id: EntityId) => void` | — | Called after `core.setSelection` when clicking a selectable entity |
| `clickThresholdPx` | `number` | `3` | Max pointer travel in pixels before a pointerdown/up is treated as a drag instead of a click |
| `snapToGrid` | `number` | — | Grid size in world units. When set, entity positions (drag) and edges (resize) snap to multiples of it |

Resize handles are drawn around each selected entity: 8 handles (corners and edge midpoints) with a fixed pixel size at any zoom. Dragging a handle resizes the entity.

#### `drawEntity` callback

```ts
drawEntity(entity: Entity, ctx: { selected: boolean }): ReactNode
```

Called for every entity during every repaint. Return React SVG elements — coordinates in `entity.bounds` are in world space, no transform needed.

```tsx
const drawEntity = useCallback((entity: Entity, { selected }: { selected: boolean }) => {
  const { x, y, width, height } = entity.bounds;
  const data = entity.data as { label: string };
  return (
    <g>
      <rect x={x} y={y} width={width} height={height}
        fill={selected ? '#3b82f6' : '#e2e8f0'} rx={4} />
      <text x={x + width / 2} y={y + height / 2}
        textAnchor="middle" dominantBaseline="middle" fontSize={12}>
        {data?.label}
      </text>
    </g>
  );
}, []);
```

Wrap in `useCallback` to avoid unnecessary re-renders.

#### Grid options

```ts
interface GridOptions {
  size?:        number; // cell size in world units — default 50
  stroke?:      string; // line color — default '#e5e7eb'
  strokeWidth?: number; // line width in screen pixels — default 1
}
```

#### Selection overlay options

```ts
interface SelectionOverlayStyle {
  stroke?:      string; // outline color — default '#2563eb'
  strokeWidth?: number; // outline width in world units — default 2
  padding?:     number; // outset from entity bounds in world units — default 4
  fill?:        string; // fill inside outline — default 'none'
}
```

---

### `useSpatialCore(init)`

Creates a `SpatialCore` instance that persists for the lifetime of the component. The initializer is called exactly once.

```ts
const core = useSpatialCore(() => ({
  scene: myScene,
  viewport: { zoom: 1, pan: { x: 0, y: 0 }, screenSize: { width: 800, height: 600 } },
}));
```

Accepts either a factory function (lazy, called once) or a plain options object. The core is never recreated on re-renders regardless of which form you use.

---

### `useSelection(core)`

Returns the current selection as a `ReadonlySet<EntityId>`. The component re-renders only when the selection changes.

```ts
const selection = useSelection(core);
const isSelected = selection.has('table-1' as EntityId);
```

---

### `useViewport(core)`

Returns the current `Viewport` snapshot. Re-renders on every pan, zoom, or resize.

```ts
const viewport = useViewport(core);
console.log(`${Math.round(viewport.zoom * 100)}%`);
```

---

### `useCoreEvent(core, event, handler)`

Subscribes to any event emitted by the core. The subscription is stable — `handler` can be an inline function without triggering re-subscriptions on every render.

```ts
useCoreEvent(core, 'entities:changed', ({ type, ids }) => {
  if (type === 'remove') syncWithServer(ids);
});

useCoreEvent(core, 'selection:change', ({ selection }) => {
  console.log('selected:', selection);
});
```

---

## Patterns

### Updating `screenSize` on resize

`SpatialCanvas` automatically keeps `core.viewport.screenSize` in sync with the `<svg>` element via a `ResizeObserver` — no manual wiring needed.

### Fitting the scene on mount

```tsx
useEffect(() => {
  core.fitToScene(40); // 40px world-unit padding
}, [core]);
```

### Reading entity data

```ts
interface RoomData { label: string; capacity: number; }

const drawEntity = useCallback((entity: Entity, { selected }: { selected: boolean }) => {
  const data = entity.data as RoomData;
  return <rect ... />;
}, []);
```

### Programmatic selection

```ts
// Select a single entity
core.setSelection(['room-101' as EntityId], 'replace');

// Add to existing selection
core.setSelection(['room-102' as EntityId], 'add');

// Clear selection
core.setSelection([], 'replace');
```

### Subscribing to selection changes outside a component

```ts
const off = core.on('selection:change', ({ selection }) => {
  console.log('selected ids:', selection);
});

// Later — unsubscribe
off();
```

---

## License

[MIT](./LICENSE)
