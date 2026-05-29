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
| [`@floormap/core`](packages/core) | 0.0.0 | Scene engine, viewport, event bus, picking, selection |
| [`@floormap/svg`](packages/svg) | 0.0.0 | SVG renderer + DOM event handlers |

A React adapter is planned as the next milestone.

---

## Installation

```bash
npm install @floormap/core @floormap/svg
# or
pnpm add @floormap/core @floormap/svg
```

Both packages ship dual **ESM + CJS** builds with full TypeScript declarations.

---

## Quick start

```ts
import { createCore, createEmptyScene } from '@floormap/core';
import { mountSvgRenderer } from '@floormap/svg';
import type { EntityId, LayerId } from '@floormap/core';

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

**Interaction** (via `@floormap/svg`)
- Mouse wheel zoom (configurable sensitivity)
- Pointer drag-to-pan
- Pinch-to-zoom on touch and pen devices
- Click-to-select with AABB hit testing
- Multi-select: Shift (add), Ctrl/Meta (toggle)

**Rendering** (via `@floormap/svg`)
- Bring-your-own-drawEntity callback — full SVG freedom
- World-aligned background grid that stays crisp at any zoom
- Built-in selection highlight overlay with customisable style
- Automatic repaints on viewport, entity, and selection changes

**Developer experience**
- Zero production dependencies in all packages
- Full TypeScript with strict mode and branded types
- Dual ESM + CJS build
- 124 tests across core and SVG packages

---

## Architecture

```
  ┌─────────────────────────────────────────┐
  │               Your application          │
  │  (add/update entities, read selection)  │
  └────────────────┬────────────────────────┘
                   │  FloormapCore API
       ┌───────────▼────────────┐
       │     @floormap/core     │
       │  scene · viewport      │
       │  events · picking      │
       │  selection · store     │
       └───────────┬────────────┘
                   │  subscribes to events
       ┌───────────▼────────────┐
       │     @floormap/svg      │
       │  DOM setup · renderer  │
       │  handlers · grid       │
       │  selection overlay     │
       └────────────────────────┘
```

`@floormap/core` is fully framework-agnostic — no DOM, no browser APIs. `@floormap/svg` is the first renderer that connects core to the browser. A React adapter will provide the same integration via hooks.

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
- Do not add production dependencies to `@floormap/core` or `@floormap/svg`

---

## License

[MIT](./LICENSE)
