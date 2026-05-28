# @floormap/core — Claude Code Guide

Zero-dependency scene engine for 2D interactive editors. Manages entities, viewport transforms, event pub/sub, hit testing, and selection. Framework-agnostic — no DOM, no browser APIs anywhere in this package.

---

## Public API surface

Everything flows through `FloormapCore`, the object returned by `createCore()`. Renderers and adapters receive this object and subscribe to its events.

```ts
import { createCore, createEmptyScene } from '@floormap/core';

const scene = createEmptyScene({ width: 2000, height: 1500 }, ['floor', 'furniture']);
const core = createCore({
  scene,
  viewport: { zoom: 1, pan: { x: 0, y: 0 }, screenSize: { width: 800, height: 600 } },
});
```

### `FloormapCore` interface

```ts
interface FloormapCore {
  scene: Scene;               // mutable — entities live here
  viewport: Viewport;         // mutable — zoom/pan state
  selection: Set<EntityId>;   // mutable — current selection

  // Coordinate transforms
  worldToScreen(point: Vec2): Vec2;
  screenToWorld(point: Vec2): Vec2;

  // Viewport mutations (each emits "viewport:change")
  zoomAt(screenPoint: Vec2, delta: number): void;
  panBy(deltaScreen: Vec2): void;
  fitToBounds(bounds: Bounds, padding?: number): void;
  fitToScene(padding?: number): void;
  centerOn(id: EntityId, padding?: number): void;

  // Entity mutations (each emits "entities:changed")
  add(entity: Entity): void;
  update(id: EntityId, patch: Partial<Entity>): void;
  remove(id: EntityId): void;

  // Selection (emits "selection:change")
  setSelection(ids: EntityId[], mode: SelectionMode): void;

  // Picking
  hitTest(pointWorld: Vec2): EntityId | null;

  // Event bus
  on<T>(event: string, handler: (payload: T) => void): () => void;
  emit<T>(event: string, payload: T): void;
}
```

---

## Types (`src/types.ts`)

```ts
type Vec2   = { x: number; y: number };
type Bounds = { x: number; y: number; width: number; height: number };

type EntityId = string & { __brand: 'EntityId' };   // branded — never use plain string
type LayerId  = string & { __brand: 'LayerId' };    // branded — never use plain string

interface Entity {
  id:          EntityId;
  layer:       LayerId;
  bounds:      Bounds;
  data?:       unknown;     // application payload — cast at callsite
  selectable?: boolean;     // must be true for hitTest to return this entity
}

interface Scene {
  size:     { width: number; height: number };
  layers:   LayerId[];              // ordered bottom-to-top (index 0 = bottom)
  entities: Map<EntityId, Entity>;
}

interface Viewport {
  zoom:       number;
  pan:        Vec2;               // world-space origin of the viewport
  screenSize: { width: number; height: number };
  minZoom?:   number;             // default 0.1
  maxZoom?:   number;             // default 8
}

type SelectionMode = 'replace' | 'add' | 'toggle';
```

---

## Module breakdown

### `store.ts` — Entity CRUD

| Function | Behaviour |
|----------|-----------|
| `createEmptyScene(size, layers)` | Creates a `Scene` with an empty entity map |
| `addEntity(scene, entity)` | Sets the entity in `scene.entities` |
| `updateEntity(scene, id, patch)` | Merges patch but always preserves `id` |
| `removeEntity(scene, id)` | Deletes from `scene.entities` |
| `getEntity(scene, id)` | Returns `Entity \| null` |
| `allEntities(scene)` | Returns `Entity[]` snapshot |
| `sceneBounds(scene)` | Union AABB of all entities; falls back to `scene.size` if empty |

`updateEntity` guards against non-existent ids silently (no-op if missing).

---

### `viewport.ts` — Camera transforms

#### Coordinate math

```
worldToScreen:  screen = (world - pan) * zoom
screenToWorld:  world  = screen / zoom + pan
```

#### `setZoomAt(viewport, screenPoint, delta)`

Multiplicative zoom: `nextZoom = clamp(prevZoom * (1 + delta), minZoom, maxZoom)`.
`delta = 0.1` → +10%, `delta = -0.1` → −10%.

Keeps the world point under `screenPoint` fixed by adjusting `pan` after zoom:
```
worldBefore = screenToWorld(screenPoint)   // before zoom change
// ... apply new zoom ...
worldAfter  = screenToWorld(screenPoint)   // after zoom change
pan += worldBefore - worldAfter            // compensate drift
```

#### `panBy(viewport, deltaScreen)`

Converts screen-space delta to world-space and adds to pan:
```
pan.x += deltaScreen.x / zoom
```
Positive `deltaScreen.x` shifts content left on screen (pan moves right in world space). Handlers typically negate mouse drag delta before calling this.

#### `fitToBounds(viewport, bounds, padding)`

Computes zoom to fit bounds within `screenSize` (respects `minZoom`/`maxZoom`), then centers pan on the bounds centroid.

---

### `events.ts` — EventBus

Pub/sub backed by `Map<string, Set<Function>>`. `on()` returns an unsubscribe function.

**Built-in events emitted by `createCore`:**

| Event | Payload | Triggered by |
|-------|---------|-------------|
| `"viewport:change"` | `{ viewport: Viewport }` | `zoomAt`, `panBy`, `fitToBounds`, `fitToScene`, `centerOn` |
| `"entities:changed"` | `{ type: "add"\|"update"\|"remove", ids: EntityId[] }` | `add`, `update`, `remove` |
| `"selection:change"` | `{ selection: EntityId[] }` | `setSelection`, `remove` (if removed entity was selected) |

Custom events can be emitted via `core.emit(event, payload)` and subscribed via `core.on(event, handler)`.

---

### `picking.ts` — Hit testing

`hitTestPoint(scene, pointWorld)` returns the topmost selectable entity under a world-space point, or `null`.

**Z-order algorithm:**
1. Groups entity ids by layer.
2. Iterates layers in **reverse** order (top layer first, i.e., `layers[layers.length - 1]` first).
3. Within each layer, iterates entity ids in **reverse insertion order** (last-added on top).
4. Returns the first entity where `selectable === true` and `containsPointAABB(bounds, point)` is true.

Only entities with `selectable: true` are ever returned.

---

### `selection.ts` — Selection logic

`applySelection(current, ids, mode)` — **pure function, always returns a new `Set`**.

| Mode | Behaviour |
|------|-----------|
| `'replace'` | Clears current, adds all ids |
| `'add'` | Keeps current, adds all ids |
| `'toggle'` | Keeps current; for each id: adds if absent, removes if present |

`createCore` applies the result by clearing and re-filling the live `selection` Set (avoids replacing the reference, keeping external references valid).

---

### `utils.ts` — Geometry helpers

| Function | Description |
|----------|-------------|
| `clamp(value, min, max)` | Numeric clamp |
| `containsPointAABB(bounds, point)` | `true` if point is inside bounds (inclusive edges) |
| `expandBounds(bounds, padding)` | Grows bounds by padding in all directions |
| `unionBounds(a, b)` | Smallest AABB containing both bounds |

---

## Invariants — never violate these

- `EntityId` and `LayerId` are branded strings. Cast with `"myId" as EntityId`, never drop the cast.
- `applySelection` never mutates its input — always returns a new `Set`.
- `hitTestPoint` only returns entities with `selectable: true`.
- `updateEntity` preserves `id` even if the patch includes an `id` field.
- `remove` automatically emits `"selection:change"` if the removed entity was selected.
- `viewport` object is mutated in place by viewport functions — the `createCore` wrapper emits events after mutation.

---

## Testing patterns

Tests run in **Node** environment (no jsdom, no DOM). Import vitest globals directly.

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCore } from '../core';
import type { Entity, EntityId, LayerId, Scene, Viewport } from '../types';

// Standard fixture factories
function makeScene(): Scene {
  return {
    size: { width: 1000, height: 1000 },
    layers: ['layer-1' as LayerId],
    entities: new Map(),
  };
}

function makeViewport(): Viewport {
  return { zoom: 1, pan: { x: 0, y: 0 }, screenSize: { width: 800, height: 600 } };
}

// Branded id helpers
const id = (s: string) => s as EntityId;
const layer = (s: string) => s as LayerId;
```

Use `vi.fn()` to spy on event bus handlers. Always call `core.on(event, handler)` before the action under test.

---

## Adding to this package

1. New types → `types.ts`
2. Pure logic → appropriate module (`store`, `viewport`, `selection`, `picking`, `utils`)
3. Wire into `FloormapCore` interface + `createCore` factory in `core.ts`
4. Export from `index.ts`
5. Tests in `src/__tests__/<module>.test.ts`

No DOM, no `window`, no `document` — ever.
