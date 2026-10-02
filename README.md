<p align="center">
    <a href="https://github.com/spatialkit">
        <img src="https://github.com/spatialkit.png" alt="Spatial" height="80" />
    </a>
    <br />
    <br />
    <strong>Spatial</strong>
    <br />
    Open-source TypeScript toolkit for interactive 2D editors and floor plans.
    <br />
    <br />
    <a href="https://spatial.lucasfelixdev.workers.dev"><strong>Live demo</strong></a>
</p>

<p align="center">
    <a href="https://github.com/spatialkit/spatial/actions/workflows/ci.yml"><img src="https://github.com/spatialkit/spatial/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
    <a href="https://www.npmjs.com/package/@spatial-kit/core"><img src="https://img.shields.io/npm/v/@spatial-kit/core?label=%40spatial-kit%2Fcore" alt="npm @spatial-kit/core" /></a>
    <a href="./LICENSE"><img src="https://img.shields.io/github/license/spatialkit/spatial" alt="MIT license" /></a>
</p>

---

A zero-dependency toolkit for building interactive 2D editors — floor plans, seat maps, office layouts, warehouse maps, and more.

Spatial provides the low-level engine for pan/zoom, selection, hit testing, and event management, plus pluggable renderers. No framework lock-in, no production dependencies.

## Packages

| Package | Version | Size (gzip) | Description |
|---------|---------|-------------|-------------|
| [`@spatial-kit/core`](packages/core) | [![npm](https://img.shields.io/npm/v/@spatial-kit/core)](https://www.npmjs.com/package/@spatial-kit/core) | [![size](https://deno.bundlejs.com/badge?q=@spatial-kit/core)](https://bundlejs.com/?q=@spatial-kit/core) | Scene engine, viewport, event bus, picking, selection |
| [`@spatial-kit/svg`](packages/svg) | [![npm](https://img.shields.io/npm/v/@spatial-kit/svg)](https://www.npmjs.com/package/@spatial-kit/svg) | [![size](https://deno.bundlejs.com/badge?q=@spatial-kit/svg&config=%7B%22esbuild%22%3A%7B%22external%22%3A%5B%22%40spatial-kit/core%22%5D%7D%7D)](https://bundlejs.com/?q=@spatial-kit/svg&config=%7B%22esbuild%22%3A%7B%22external%22%3A%5B%22%40spatial-kit/core%22%5D%7D%7D) | SVG renderer + DOM event handlers |
| [`@spatial-kit/react`](packages/adapters/react) | [![npm](https://img.shields.io/npm/v/@spatial-kit/react)](https://www.npmjs.com/package/@spatial-kit/react) | [![size](https://deno.bundlejs.com/badge?q=@spatial-kit/react&config=%7B%22esbuild%22%3A%7B%22external%22%3A%5B%22%40spatial-kit/core%22%2C%22react%22%2C%22react-dom%22%2C%22react/jsx-runtime%22%5D%7D%7D)](https://bundlejs.com/?q=@spatial-kit/react&config=%7B%22esbuild%22%3A%7B%22external%22%3A%5B%22%40spatial-kit/core%22%2C%22react%22%2C%22react-dom%22%2C%22react/jsx-runtime%22%5D%7D%7D) | React adapter — hooks and `SpatialCanvas` component |

Sizes are minified and gzipped, excluding peer dependencies (`@spatial-kit/core`, `react`).

---

## Installation

**Vanilla JS / framework-agnostic:**

```bash
npm install @spatial-kit/core @spatial-kit/svg
```

**React:**

```bash
npm install @spatial-kit/core @spatial-kit/react
```

All packages ship dual **ESM + CJS** builds with full TypeScript declarations.

---

## Quick start — React

```tsx
import { useCallback, useEffect } from 'react';
import { createEmptyScene, addEntity } from '@spatial-kit/core';
import type { Entity, EntityId, LayerId } from '@spatial-kit/core';
import {
  SpatialCanvas,
  useSpatialCore,
  useSelection,
  useViewport,
} from '@spatial-kit/react';

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
  const core = useSpatialCore(() => ({
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

## React API

### `<SpatialCanvas>`

The main component. Renders an `<svg>` element and wires all interactions.

```tsx
<SpatialCanvas
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
  snapToGrid={20}    // snap drag and resize to a 20-unit grid (off by default)

  // SVG element
  className="my-canvas"
  style={{ width: '100%', height: 600 }}
/>
```

**`drawEntity(entity, ctx)`** is called for every entity in the scene and must return React SVG elements. Coordinates are in world space — no transform needed.

**`grid`** renders a background grid aligned to world space. Pass `false` to disable.

**`selectionOverlay`** draws an outline rect around each selected entity. Pass `false` to disable.

**Resize handles** are drawn on every selected entity. Drag one of the 8 handles to resize; the size in pixels stays the same at any zoom level.

**`snapToGrid`** rounds entity positions (on drag) and edges (on resize) to the nearest multiple of the given world-space size.

---

### Hooks

#### `useSpatialCore(init)`

Creates a `SpatialCore` instance that persists for the lifetime of the component.

```ts
const core = useSpatialCore(() => ({
  scene: myScene,
  viewport: { zoom: 1, pan: { x: 0, y: 0 }, screenSize: { width: 800, height: 600 } },
}));
```

Accepts an initializer function (lazy) or a plain `SpatialCoreOptions` object. The core is created exactly once and never re-created on re-renders.

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
import { createCore, createEmptyScene } from '@spatial-kit/core';
import { mountSvgRenderer } from '@spatial-kit/svg';
import type { EntityId, LayerId } from '@spatial-kit/core';

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

**Interaction** (via `@spatial-kit/svg` or `@spatial-kit/react`)
- Mouse wheel zoom (configurable sensitivity)
- Pointer drag-to-pan
- Pinch-to-zoom on touch and pen devices
- Click-to-select with AABB hit testing
- Multi-select: Shift (add), Ctrl/Meta (toggle)
- Drag-to-move selected entities
- Drag handles to resize the selected entity
- Optional snap-to-grid for drag and resize

**Rendering** (via `@spatial-kit/svg` or `@spatial-kit/react`)
- Bring-your-own-drawEntity callback — full SVG freedom
- World-aligned background grid that stays crisp at any zoom
- Built-in selection highlight overlay with customisable style
- Automatic repaints on viewport, entity, and selection changes

**React adapter** (`@spatial-kit/react`)
- `SpatialCanvas` component — drop in an SVG canvas with zero boilerplate
- `useSpatialCore` — lazy engine initialisation, stable across re-renders
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
                   │  SpatialCore API
       ┌───────────▼────────────┐
       │    @spatial-kit/core   │
       │  scene · viewport      │
       │  events · picking      │
       │  selection · store     │
       └─────────┬──────────────┘
                 │  subscribes to events
       ┌─────────┴──────────────┬──────────────────────┐
       │    @spatial-kit/svg    │  @spatial-kit/react  │
       │  DOM setup · renderer  │  SpatialCanvas       │
       │  handlers · grid       │  useSpatialCore      │
       │  selection overlay     │  useSelection        │
       └────────────────────────┤  useViewport         │
                                │  useCoreEvent        │
                                └──────────────────────┘
```

`@spatial-kit/core` is fully framework-agnostic — no DOM, no browser APIs. `@spatial-kit/svg` and `@spatial-kit/react` are independent renderer/adapter layers that connect core to the browser. Use whichever fits your stack.

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
- **[`packages/adapters/react/README.md`](packages/adapters/react/README.md)** — `SpatialCanvas` props, hooks (`useSpatialCore`, `useSelection`, `useViewport`, `useCoreEvent`), patterns

---

## Development

**Prerequisites:** Node 22, pnpm 10

```bash
git clone https://github.com/spatialkit/spatial
cd spatial
pnpm install
```

| Command | Description |
|---------|-------------|
| `pnpm test` | Run all tests once (vitest) |
| `pnpm test:watch` | Vitest in watch mode |
| `pnpm typecheck` | `tsc --noEmit` across all packages |
| `pnpm build` | tsup build (ESM + CJS + .d.ts) |
| `pnpm lint` | ESLint on all `.ts` files |
| `pnpm dev` | Start examples dev server (Vite, `localhost:5173`) |

All commands run from the repo root. Per-package commands also work inside each `packages/*` directory.

---

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](./CONTRIBUTING.md) for the development setup and pull request process, and the [Code of Conduct](./CODE_OF_CONDUCT.md) before participating.

To report a security issue, follow [SECURITY.md](./SECURITY.md). Do not open a public issue.

---

## License

[MIT](./LICENSE)
