# Floormap — Claude Code Guide

## Project overview

Floormap is a zero-dependency TypeScript toolkit for building interactive 2D editors (floor plans, seat maps, office layouts, warehouse maps). It exposes low-level primitives for pan/zoom/selection/picking and ships pluggable renderers.

**Repo:** `github.com/floormap-tools/floormap`  
**Status:** v0.0.0 (early stage, stabilizing core before React adapter)

---

## Monorepo layout

```
packages/
  core/   @floormap/core    — scene engine, viewport, selection, events, picking
  svg/    @floormap/svg     — SVG renderer + DOM event handlers
```

Both packages ship dual ESM + CJS builds via tsup. No production dependencies.

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

### @floormap/core

| Module | Responsibility |
|--------|---------------|
| `core.ts` | `createCore()` factory — public API surface |
| `store.ts` | Entity CRUD on the scene (`add`, `update`, `remove`, `getEntity`, `allEntities`, `sceneBounds`) |
| `viewport.ts` | Camera transforms: `worldToScreen`, `screenToWorld`, `setZoomAt`, `panBy`, `fitToBounds` |
| `events.ts` | `EventBus` (pub/sub): `on`, `off`, `emit` |
| `picking.ts` | `hitTestPoint` — AABB point-in-bounds, z-order aware |
| `selection.ts` | `applySelection(current, ids, mode)` — replace / add / toggle, never mutates |
| `utils.ts` | `clamp`, `containsPointAABB`, `expandBounds`, `unionBounds` |
| `types.ts` | Core types: `Vec2`, `Bounds`, `Entity`, `Scene`, `Viewport`, `SelectionMode` |

**Key events emitted by core:**
- `"viewport:change"` — `{ viewport }`
- `"entities:changed"` — `{ type: "add"|"update"|"remove", ids: EntityId[] }`
- `"selection:change"` — `{ selection: EntityId[] }`

**Coordinate system:**
- `worldToScreen`: `(world - pan) * zoom`
- `screenToWorld`: `screen / zoom + pan`

### @floormap/svg

| Module | Responsibility |
|--------|---------------|
| `renderer.ts` | `mountSvgRenderer(core, opts)` — wires DOM, subscribes to core events, returns `{ rerender(), destroy() }` |
| `dom.ts` | `setupSvgRoot(svg, defs?)` — builds the `<g data-fm>` group hierarchy; `getGroups`, `clearChildren` |
| `handlers.ts` | `attachHandlers(svg, core, opts)` — wheel zoom, pointer drag pan, click-to-select |

**SVG group hierarchy:**
```
<svg>
  <g data-fm="viewport">        ← transform matrix applied here
    <g data-fm="grid">
    <g data-fm="objects">
      <g data-fm-layer="...">   ← one per layer
    <g data-fm="selection">
    <g data-fm="overlays">
  <defs data-fm="defs">
```

**Transform matrix:** `matrix(zoom 0 0 zoom -pan.x*zoom -pan.y*zoom)`

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

- Do not add production dependencies to `@floormap/core` or `@floormap/svg`.
- Do not bypass branded types with plain strings.
- Do not mutate `Set` objects returned by `applySelection`.
- Do not add framework-specific code to `@floormap/core` (keep it agnostic).
- Do not skip typecheck — the build uses project references.
