# Spatial — Claude Code Guide

## Project overview

Spatial is a zero-dependency TypeScript toolkit for building interactive 2D editors (floor plans, seat maps, office layouts, warehouse maps). It exposes low-level primitives for pan/zoom/selection/picking and ships pluggable renderers.

**Repo:** `github.com/spatialkit/spatial`  
**Status:** v0.0.0 — core stable, SVG renderer complete, React adapter in progress

> Detailed per-package guides: [`packages/core/CLAUDE.md`](packages/core/CLAUDE.md) · [`packages/svg/CLAUDE.md`](packages/svg/CLAUDE.md)

---

## Monorepo layout

```
packages/
  core/             @spatialkit/core   — scene engine, viewport, selection, events, picking
  svg/              @spatialkit/svg    — SVG renderer + DOM event handlers
  adapters/
    react/          @spatialkit/react  — React adapter (hooks + SpatialCanvas component)
  examples/
    js-vanilla/     vanilla JS example
    react/          React example
```

Core and SVG packages ship dual ESM + CJS builds via tsup. No production dependencies.  
Adapters live under `packages/adapters/` — add new framework adapters (e.g. `vue/`) there.

---

## Commands

```bash
pnpm test          # run all tests once (vitest)
pnpm test:watch    # vitest in watch mode
pnpm typecheck     # tsc -b --verbose (all packages)
pnpm build         # tsup build for all packages
pnpm lint          # eslint on all .ts/.tsx
pnpm dev           # dev server (packages/examples)
pnpm release       # changeset version + publish
```

Run from repo root. Per-package commands work inside each `packages/*` directory too.

---

## Architecture

### @spatialkit/core

| Module | Responsibility |
|--------|---------------|
| `core.ts` | `createCore()` factory — public API, wires all modules together |
| `store.ts` | `createEmptyScene()` + entity CRUD: `add`, `update`, `remove`, `getEntity`, `allEntities`, `sceneBounds` |
| `viewport.ts` | Camera transforms: `worldToScreen`, `screenToWorld`, `setZoomAt`, `panBy`, `fitToBounds` |
| `events.ts` | `EventBus` (pub/sub): `on` returns unsubscribe fn, `off`, `emit` |
| `picking.ts` | `hitTestPoint` — AABB hit test, z-order aware (top layer / last-added first) |
| `selection.ts` | `applySelection(current, ids, mode)` — pure, returns new `Set`, never mutates |
| `utils.ts` | `clamp`, `containsPointAABB`, `expandBounds`, `unionBounds` |
| `types.ts` | `Vec2`, `Bounds`, `Entity`, `Scene`, `Viewport`, `SelectionMode`, `EntityId`, `LayerId` |

**Key events emitted by core (with payload shapes):**
- `"viewport:change"` — `{ viewport: Viewport }`
- `"entities:changed"` — `{ type: "add"|"update"|"remove", ids: EntityId[] }`
- `"selection:change"` — `{ selection: EntityId[] }`

**Coordinate system:**
- `worldToScreen`: `screen = (world - pan) * zoom`
- `screenToWorld`: `world = screen / zoom + pan`
- `zoomAt` delta is multiplicative: `0.1` = +10%, `−0.1` = −10%
- `panBy` takes screen-space delta; positive `x` shifts content left (pan moves right in world)

### @spatialkit/svg

| Module | Responsibility |
|--------|---------------|
| `renderer.ts` | `mountSvgRenderer(core, opts)` — wires DOM, subscribes to core events, returns `{ rerender(), destroy() }` |
| `dom.ts` | `setupSvgRoot(svg, defs?)` — idempotent group hierarchy builder; `getGroups`, `clearChildren` |
| `handlers.ts` | `attachHandlers(svg, core, opts)` — wheel zoom, pointer drag-pan, pinch zoom, click-to-select |
| `grid.ts` | `paintGrid(core, gridG, opts)` — draws background grid lines in world space |
| `selection-overlay.ts` | `paintSelectionOverlay(core, selectionG, style)` — draws outline rects around selected entities |

**SVG group hierarchy:**
```
<svg>
  <g data-spatial="viewport">           ← transform matrix applied here
    <g data-spatial="grid">
    <g data-spatial="objects">
      <g data-spatial-layer="...">      ← one per layer, in scene.layers order
    <g data-spatial="selection">
    <g data-spatial="overlays">
  <defs data-spatial="defs">            ← only if defs callback is provided
```

**Transform matrix:** `matrix(zoom 0 0 zoom -pan.x*zoom -pan.y*zoom)`

**SVG tests require jsdom stubs** — always mock `getBoundingClientRect` (returns zero rect by default in jsdom); mock `setPointerCapture`/`releasePointerCapture` when testing pointer interactions.

---

## Type system conventions

- `EntityId` and `LayerId` are **branded strings** — never use plain `string` where these are expected.
- `Entity.data` is `unknown` — cast at the application layer.
- `Entity.selectable` must be `true` for `hitTestPoint` to return it.

---

## Testing conventions

- Tests live in `src/__tests__/*.test.ts`
- Core tests run in **Node** environment (no DOM).
- SVG tests run in **jsdom** environment.
- Pattern: Arrange-Act-Assert with `vi.fn()` for spies.
- Mock `getBoundingClientRect()` for SVG/DOM geometry in svg tests.

---

## Code style

- **TypeScript strict** — no `any`, no unused vars (except `_` prefix).
- **No comments** unless the WHY is non-obvious.
- **No production deps** — keep both packages dependency-free.
- Factory functions (`createCore`, `createEmptyScene`) over classes.
- Immutable selection (`applySelection` returns a new `Set`, never mutates).
- Prettier: single quotes, semicolons, 100-char line width.
- ESLint: `@typescript-eslint` + `react-hooks` rules.

---

## Adding a new feature — checklist

1. Add/update types in `types.ts` if new shapes are needed.
2. Implement logic in the appropriate module (`store`, `viewport`, `selection`, etc.).
3. Expose via `core.ts` if it belongs to the public API.
4. Update `index.ts` exports.
5. Write unit tests in `src/__tests__/`.
6. Run `pnpm typecheck && pnpm test && pnpm lint` before committing.

---

## What NOT to do

- Do not add production dependencies to `@spatialkit/core` or `@spatialkit/svg`.
- Do not bypass branded types with plain strings.
- Do not mutate `Set` objects returned by `applySelection`.
- Do not add framework-specific code to `@spatialkit/core` (keep it agnostic).
- Do not skip typecheck — the build uses project references.
