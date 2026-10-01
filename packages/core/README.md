# @spatialkit/core

Scene engine for interactive 2D editors. Manages entities, viewport transforms, event pub/sub, hit testing, and selection. Framework-agnostic — no DOM, no browser APIs.

## Installation

```bash
npm install @spatialkit/core
# or
pnpm add @spatialkit/core
```

## Quick start

```ts
import { createCore, createEmptyScene } from '@spatialkit/core';
import type { EntityId, LayerId } from '@spatialkit/core';

const scene = createEmptyScene(
  { width: 2000, height: 1500 },
  ['background' as LayerId, 'objects' as LayerId],
);

const core = createCore({
  scene,
  viewport: {
    zoom: 1,
    pan: { x: 0, y: 0 },
    screenSize: { width: 800, height: 600 },
  },
});

core.add({
  id: 'item-1' as EntityId,
  layer: 'objects' as LayerId,
  bounds: { x: 100, y: 100, width: 60, height: 60 },
  selectable: true,
  data: { type: 'chair' },
});

core.on('selection:change', ({ selection }) => {
  console.log('selected ids:', selection);
});

core.setSelection(['item-1' as EntityId], 'replace');
```

---

## API reference

### `createEmptyScene(size, layers)`

Creates an empty scene with no entities.

```ts
const scene = createEmptyScene(
  { width: 2000, height: 1500 }, // world dimensions
  ['floor' as LayerId, 'furniture' as LayerId],
);
```

Layers are ordered **bottom → top** — index 0 is the bottommost layer. The order determines both rendering z-order and click hit-test priority (top layer wins).

---

### `createCore(props)`

Creates the core engine instance.

```ts
const core = createCore({
  scene,
  viewport: {
    zoom: 1,
    pan: { x: 0, y: 0 },
    screenSize: { width: 800, height: 600 },
    minZoom: 0.1,  // optional, default 0.1
    maxZoom: 8,    // optional, default 8
  },
});
```

---

### `SpatialCore` interface

The object returned by `createCore`. Pass this to renderers and adapters.

#### State properties

```ts
core.scene      // Scene — current scene (entities, layers, size)
core.viewport   // Viewport — current zoom, pan, screenSize
core.selection  // Set<EntityId> — current selection
```

All three are mutable references. The scene and viewport are updated in-place; the selection Set is cleared and refilled (the reference stays stable).

---

#### Coordinate transforms

```ts
core.worldToScreen(point: Vec2): Vec2
core.screenToWorld(point: Vec2): Vec2
```

```
worldToScreen:  screen = (world − pan) × zoom
screenToWorld:  world  = screen / zoom + pan
```

Use `screenToWorld` to convert a mouse position (screen coords) to a world position before hit testing.

---

#### Viewport methods

All viewport methods emit `"viewport:change"` after applying the change.

```ts
core.zoomAt(screenPoint: Vec2, delta: number): void
```

Multiplies the current zoom by `(1 + delta)`, keeping `screenPoint` fixed in world space. `delta = 0.1` = +10%, `delta = -0.1` = −10%. Clamped to `[minZoom, maxZoom]`.

```ts
core.panBy(deltaScreen: Vec2): void
```

Translates the viewport by a screen-space delta. Positive `x` shifts content left (viewport moves right in world space).

```ts
core.fitToBounds(bounds: Bounds, padding?: number): void
```

Adjusts zoom and pan so `bounds` fills the screen, with optional padding in world units.

```ts
core.fitToScene(padding?: number): void
```

`fitToBounds` using the union of all entity bounds. Falls back to `scene.size` if the scene is empty.

```ts
core.centerOn(id: EntityId, padding?: number): void
```

`fitToBounds` on a single entity's bounds. No-op if the entity does not exist.

---

#### Entity methods

All entity methods emit `"entities:changed"` after the operation.

```ts
core.add(entity: Entity): void
```

Adds an entity to the scene. The entity must have a unique `id`.

```ts
core.update(id: EntityId, patch: Partial<Entity>): void
```

Merges `patch` into the existing entity. The `id` field in `patch` is ignored — the entity id is immutable. No-op if the entity does not exist.

```ts
core.updateMany(patches: { id: EntityId; patch: Partial<Entity> }[]): void
```

Applies multiple patches in a single call and emits one `"entities:changed"` event with all updated ids. Equivalent to calling `update` in a loop but more efficient — use it when moving a group of selected entities together.

```ts
core.remove(id: EntityId): void
```

Removes an entity. If the entity was selected, also emits `"selection:change"` after removing it from the selection.

---

#### Selection

```ts
core.setSelection(ids: EntityId[], mode: SelectionMode): void
```

Updates the current selection and emits `"selection:change"`.

| Mode | Behaviour |
|------|-----------|
| `'replace'` | Clears current selection, adds all `ids` |
| `'add'` | Keeps current selection, adds all `ids` |
| `'toggle'` | Keeps current selection; adds each id if absent, removes if present |

---

#### Hit testing

```ts
core.hitTest(pointWorld: Vec2): EntityId | null
```

Returns the id of the topmost selectable entity whose bounds contain `pointWorld`, or `null` if none.

**Z-order:** iterates layers in reverse (top layer first), and entities within each layer in reverse insertion order (last-added is on top). Only entities with `selectable: true` are considered.

Always call `core.screenToWorld` on a mouse position before passing it to `hitTest`.

---

#### Event bus

```ts
core.on(event: string, handler: (payload) => void): () => void
```

Subscribes to an event. Returns an unsubscribe function — call it to remove the listener.

```ts
core.emit(event: string, payload: unknown): void
```

Emits a custom event. Built-in events are emitted automatically by core methods.

---

### Events

| Event | Payload | Emitted by |
|-------|---------|------------|
| `"viewport:change"` | `{ viewport: Viewport }` | `zoomAt`, `panBy`, `fitToBounds`, `fitToScene`, `centerOn` |
| `"entities:changed"` | `{ type: "add" \| "update" \| "remove", ids: EntityId[] }` | `add`, `update`, `remove` |
| `"selection:change"` | `{ selection: EntityId[] }` | `setSelection`, `remove` (when selected entity is removed) |

You can also emit and subscribe to custom events using the same `core.on` / `core.emit` API.

---

### Types

```ts
type Vec2   = { x: number; y: number };
type Bounds = { x: number; y: number; width: number; height: number };

// Branded strings — never substitute with plain string
type EntityId = string & { __brand: 'EntityId' };
type LayerId  = string & { __brand: 'LayerId' };

interface Entity {
  id:          EntityId;
  layer:       LayerId;
  bounds:      Bounds;       // world-space bounding box
  selectable?: boolean;      // must be true to be returned by hitTest
  data?:       unknown;      // application payload — cast at callsite
}

interface Scene {
  size:     { width: number; height: number };
  layers:   LayerId[];              // ordered bottom-to-top
  entities: Map<EntityId, Entity>;
}

interface Viewport {
  zoom:       number;
  pan:        Vec2;
  screenSize: { width: number; height: number };
  minZoom?:   number;  // default 0.1
  maxZoom?:   number;  // default 8
}

type SelectionMode = 'replace' | 'add' | 'toggle';
```

**Branded types:** Cast string literals with `'my-id' as EntityId` and `'my-layer' as LayerId`. This prevents accidental mixing of ids across entity types.

---

### Utility functions

These are exported for use in renderers and application code:

```ts
import {
  clamp,
  containsPointAABB,
  expandBounds,
  unionBounds,
  snapToGrid,
  hitTestResizeHandles,
  applyResizeDelta,
} from '@spatialkit/core';

clamp(value, min, max)                  // numeric clamp
containsPointAABB(bounds, point)        // true if point is inside bounds (inclusive)
expandBounds(bounds, padding)           // grows bounds by padding in all directions
unionBounds(a, b)                       // smallest AABB containing both bounds
snapToGrid(value, gridSize)             // rounds value to the nearest multiple of gridSize
```

#### Resizing

Renderers use these to implement resize handles. They are exported so custom renderers can reuse the same behavior.

```ts
import type { ResizeDirection } from '@spatialkit/core';
// 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'

hitTestResizeHandles(selectedEntities, worldToScreen, screenPoint, handleSizePx = 8)
// → { entityId, direction } | null
// Checks the 8 handles (corners and edge midpoints) of each entity, in screen space.

applyResizeDelta(originalBounds, direction, worldDelta, snapSize?)
// → Bounds
// Moves the edges named by `direction` by `worldDelta`. When `snapSize` is set, the moved edges
// snap to the grid. Width and height never go below 1.
```

Example: resize the bottom-right corner of an entity by a pointer delta.

```ts
const handle = hitTestResizeHandles(
  [...core.selection].map((id) => core.scene.entities.get(id)!),
  (p) => core.worldToScreen(p),
  pointerScreen,
);

if (handle) {
  const start = core.scene.entities.get(handle.entityId)!.bounds;
  const bounds = applyResizeDelta(start, handle.direction, { x: 30, y: 10 }, 10);
  core.update(handle.entityId, { bounds });
}
```

---

## Patterns

### Creating branded ids

```ts
import type { EntityId, LayerId } from '@spatialkit/core';

// Option 1: cast at point of use
core.add({ id: 'table-1' as EntityId, layer: 'furniture' as LayerId, ... });

// Option 2: helper factory
const entityId = (s: string) => s as EntityId;
const layerId  = (s: string) => s as LayerId;
```

### Subscribing to events and cleaning up

```ts
const off = core.on('entities:changed', ({ type, ids }) => {
  if (type === 'remove') syncWithServer(ids);
});

// Later — unsubscribe
off();
```

### Fitting the view on load

```ts
// After adding all initial entities
core.fitToScene(32); // 32px world-unit padding

// Or focus on a specific entity
core.centerOn('room-101' as EntityId, 16);
```

### Accessing entity data

```ts
interface TableData {
  label: string;
  seats: number;
}

const entity = core.scene.entities.get('table-1' as EntityId);
const data = entity?.data as TableData | undefined;
```

---

## License

[MIT](./LICENSE)
