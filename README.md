<p align="center">
    <a href="https://github.com/floormap-tools">
        <img src="https://github.com/floormap-tools.png" alt="Floor Map" height="80" />
    </a>
    <br />
    <br />
    <strong>Floormap</strong>
    <br />
    Open-source TypeScript toolkit for interactive 2D editors and floor plans.
</p>

---

A zero-dependency toolkit for building interactive 2D editors — floor plans, seat maps, office layouts, warehouse maps, and more.

Floormap provides the low-level engine for pan/zoom, selection, hit testing, and event management, plus pluggable renderers. No framework lock-in, no production dependencies.

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`@floormap-tools/core`](packages/core) | 0.1.0 | Scene engine, viewport, event bus, picking, selection |
| [`@floormap-tools/svg`](packages/svg) | 0.1.0 | SVG renderer + DOM event handlers |
| [`@floormap-tools/react`](packages/adapters/react) | 0.1.0 | React adapter — hooks and `FloormapCanvas` component |

---

## Installation

**Vanilla JS / framework-agnostic:**

```bash
npm install @floormap-tools/core @floormap-tools/svg
```

**React:**

```bash
npm install @floormap-tools/core @floormap-tools/react
```

All packages ship dual **ESM + CJS** builds with full TypeScript declarations.

---

## Quick start — React

```tsx
import { useCallback, useEffect } from 'react';
import { createEmptyScene, addEntity } from '@floormap-tools/core';
import type { Entity, EntityId, LayerId } from '@floormap-tools/core';
import {
  FloormapCanvas,
  useFloormapCore,
  useSelection,
  useViewport,
} from '@floormap-tools/react';

const LAYER = 'main' as LayerId;

// Build the initial scene once, outside the component
const initialScene = (() => {
  const scene = createEmptyScene({ width: 1200, height: 800 }, [LAYER]);
  addEntity(scene, {
    id: 'table-1' as EntityId,
    layer: LAYER,
    bounds: { x: 100, y: 100, width: 120, height: 80 },
    selectable: true,
    data: { label: 'Table 1' },
  });
  return scene;
})();

export function FloorPlan() {
  // Create the engine once per component lifetime
  const core = useFloormapCore(() => ({
    scene: initialScene,
    viewport: { zoom: 1, pan: { x: 0, y: 0 }, screenSize: { width: 800, height: 600 } },
  }));

  // Reactive state — components re-render only when these change
  const selection = useSelection(core);
  const viewport = useViewport(core);

  // Fit the scene on mount
  useEffect(() => { core.fitToScene(40); }, [core]);

  const drawEntity = useCallback((entity: Entity, { selected }: { selected: boolean }) => {
    const { x, y, width, height } = entity.bounds;
    return (
      <rect
        x={x} y={y} width={width} height={height}
        fill={selected ? '#3b82f6' : '#e5e7eb'} rx={4}
      />
    );
  }, []);

  return (
    <div>
      <p>Zoom: {Math.round(viewport.zoom * 100)}%</p>
      <p>Selected: {[...selection].join(', ') || 'none'}</p>
      <FloormapCanvas
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

## React API

### `<FloormapCanvas>`

The main component. Renders an `<svg>` element and wires all interactions.

```tsx
<FloormapCanvas
  core={core}
  drawEntity={(entity, { selected }) => <rect ... />}

  // Visual
  grid={{ size: 40, stroke: '#f1f5f9', strokeWidth: 1 }}
  selectionOverlay={{ stroke: '#3b82f6', strokeWidth: 2, padding: 4 }}

  // Interaction
  enableWheel        // default: true
  enablePanDrag      // default: true
  enableEntityDrag   // default: true
  dragButton={0}     // 0 = left, 1 = middle, 2 = right
  clickSelect        // default: true
  modifierSelect     // default: true — Shift adds, Ctrl/⌘ toggles
  onClickEntity={(id) => console.log(id)}
  clickThresholdPx={3}
  wheelZoomFactor={0.0015}
  pinchZoomFactor={0.005}

  // SVG element
  className="my-canvas"
  style={{ width: '100%', height: 600 }}
/>
```

**`drawEntity(entity, ctx)`** is called for every entity in the scene and must return React SVG elements. Coordinates are in world space — no transform needed.

**`grid`** renders a background grid aligned to world space. Pass `false` to disable.

**`selectionOverlay`** draws an outline rect around each selected entity. Pass `false` to disable.

---

### Hooks

#### `useFloormapCore(init)`

Creates a `FloormapCore` instance that persists for the lifetime of the component.

```ts
const core = useFloormapCore(() => ({
  scene: myScene,
  viewport: { zoom: 1, pan: { x: 0, y: 0 }, screenSize: { width: 800, height: 600 } },
}));
```

Accepts an initializer function (lazy) or a plain `FloormapCoreOptions` object. The core is created exactly once and never re-created on re-renders.

---

#### `useSelection(core)`

Returns the current selection as a `ReadonlySet<EntityId>`. The component re-renders whenever the selection changes.

```ts
const selection = useSelection(core);
const isSelected = selection.has('table-1' as EntityId);
```

---

#### `useViewport(core)`

Returns the current `Viewport` snapshot. The component re-renders on every viewport change (pan, zoom, resize).

```ts
const viewport = useViewport(core);
console.log(viewport.zoom, viewport.pan.x, viewport.pan.y);
```

---

#### `useCoreEvent(core, event, handler)`

Subscribes to any event emitted by the core. The subscription is stable — `handler` can be an inline function without causing re-subscriptions.

```ts
useCoreEvent(core, 'entities:changed', ({ type, ids }) => {
  console.log(type, ids); // 'add' | 'update' | 'remove'
});
```

---

## Quick start — Vanilla JS

```ts
import { createCore, createEmptyScene } from '@floormap-tools/core';
import { mountSvgRenderer } from '@floormap-tools/svg';
import type { EntityId, LayerId } from '@floormap-tools/core';

// 1. Define layers (bottom → top z-order)
const LAYERS = {
  floor: 'floor' as LayerId,
  furniture: 'furniture' as LayerId,
};

// 2. Create scene and engine
const scene = createEmptyScene({ width: 2000, height: 1500 }, Object.values(LAYERS));
const core = createCore({
  scene,
  viewport: {
    zoom: 1,
    pan: { x: 0, y: 0 },
    screenSize: { width: 800, height: 600 },
  },
});

// 3. Populate the scene
core.add({
  id: 'table-1' as EntityId,
  layer: LAYERS.furniture,
  bounds: { x: 100, y: 100, width: 80, height: 80 },
  selectable: true,
  data: { label: 'Table 1', seats: 4 },
});

// 4. Mount the SVG renderer
const svg = document.querySelector<SVGSVGElement>('svg')!;

const renderer = mountSvgRenderer(core, {
  mount: svg,

  drawEntity(entity, { g, selected }) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', String(entity.bounds.x));
    rect.setAttribute('y', String(entity.bounds.y));
    rect.setAttribute('width', String(entity.bounds.width));
    rect.setAttribute('height', String(entity.bounds.height));
    rect.setAttribute('fill', selected ? '#3b82f6' : '#e5e7eb');
    rect.setAttribute('rx', '4');
    g.appendChild(rect);
  },

  grid: {},             // background grid with default options
  selectionOverlay: {}, // blue outline on selected entities
  onClickEntity: (id) => console.log('selected:', id),
});

// 5. Programmatic camera control
core.fitToScene(40); // fit all entities with 40px padding

// 6. React to events
core.on('selection:change', ({ selection }) => {
  console.log('selection changed:', selection);
});

// 7. Update and re-render
core.update('table-1' as EntityId, { data: { label: 'Table 1', seats: 6 } });
renderer.rerender();

// 8. Clean up
renderer.destroy();
```

---

## Features

**Scene management**
- Entity CRUD with typed `EntityId` and `LayerId` branded strings
- Layer-based z-ordering
- Scene and entity bounds computation

**Viewport**
- Smooth pan and zoom with configurable limits (`minZoom`, `maxZoom`)
- `fitToBounds`, `fitToScene`, `centerOn` for programmatic camera control
- Precise coordinate transforms: `worldToScreen` / `screenToWorld`

**Interaction** (via `@floormap-tools/svg` or `@floormap-tools/react`)
- Mouse wheel zoom (configurable sensitivity)
- Pointer drag-to-pan
- Pinch-to-zoom on touch and pen devices
- Click-to-select with AABB hit testing
- Multi-select: Shift (add), Ctrl/Meta (toggle)
- Drag-to-move selected entities

**Rendering** (via `@floormap-tools/svg` or `@floormap-tools/react`)
- Bring-your-own-drawEntity callback — full SVG freedom
- World-aligned background grid that stays crisp at any zoom
- Built-in selection highlight overlay with customisable style
- Automatic repaints on viewport, entity, and selection changes

**React adapter** (`@floormap-tools/react`)
- `FloormapCanvas` component — drop in an SVG canvas with zero boilerplate
- `useFloormapCore` — lazy engine initialisation, stable across re-renders
- `useSelection` / `useViewport` — fine-grained reactive subscriptions via `useSyncExternalStore`
- `useCoreEvent` — subscribe to any core event with a stable handler ref

**Developer experience**
- Zero production dependencies in all packages
- Full TypeScript with strict mode and branded types
- Dual ESM + CJS build
- Comprehensive test suite across all packages

---

## Architecture

```
  ┌─────────────────────────────────────────┐
  │               Your application          │
  │  (add/update entities, read selection)  │
  └────────────────┬────────────────────────┘
                   │  FloormapCore API
       ┌───────────▼────────────┐
       │     @floormap-tools/core     │
       │  scene · viewport      │
       │  events · picking      │
       │  selection · store     │
       └─────────┬──────────────┘
                 │  subscribes to events
       ┌─────────┴──────────────┬──────────────────────┐
       │     @floormap-tools/svg      │   @floormap-tools/react     │
       │  DOM setup · renderer  │  FloormapCanvas       │
       │  handlers · grid       │  useFloormapCore      │
       │  selection overlay     │  useSelection         │
       └────────────────────────┘  useViewport          │
                                   useCoreEvent         │
                                   └────────────────────┘
```

`@floormap-tools/core` is fully framework-agnostic — no DOM, no browser APIs. `@floormap-tools/svg` and `@floormap-tools/react` are independent renderer/adapter layers that connect core to the browser. Use whichever fits your stack.

---

## Coordinate system

World coordinates are the logical space where entities live. Screen coordinates are pixels on the SVG element.

```
worldToScreen:  screen = (world − pan) × zoom
screenToWorld:  world  = screen / zoom + pan
```

All entity `bounds` are in world coordinates. Mouse positions from DOM events are in screen coordinates — use `core.screenToWorld()` before hit testing.

---

## Packages in depth

- **[`packages/core/README.md`](packages/core/README.md)** — full API reference: `createCore`, `createEmptyScene`, viewport methods, events, picking, selection
- **[`packages/svg/README.md`](packages/svg/README.md)** — `mountSvgRenderer` options, `drawEntity` callback, grid, selection overlay, pointer handler configuration

---

## Development

**Prerequisites:** Node 22, pnpm 10

```bash
git clone https://github.com/floormap-tools/floormap
cd floormap
pnpm install
```

| Command | Description |
|---------|-------------|
| `pnpm test` | Run all tests once (vitest) |
| `pnpm test:watch` | Vitest in watch mode |
| `pnpm typecheck` | `tsc -b` across all packages |
| `pnpm build` | tsup build (ESM + CJS + .d.ts) |
| `pnpm lint` | ESLint on all `.ts` files |
| `pnpm dev` | Start examples dev server (Vite, `localhost:5173`) |

All commands run from the repo root. Per-package commands also work inside each `packages/*` directory.

---

## Contributing

If you find a bug or want to suggest an improvement, please open an **issue**.

For pull requests:
- Keep the PR focused on a single change or feature
- Run `pnpm typecheck && pnpm test && pnpm lint` before submitting
- Do not add production dependencies to `@floormap-tools/core`, `@floormap-tools/svg`, or `@floormap-tools/react`

---

## License

[MIT](./LICENSE)
