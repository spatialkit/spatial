---
name: spatial-expert
description: Expert skill for the Spatial project. Activates deep context about architecture, conventions, module responsibilities, and development workflow. Use when working on any code in this repository.
---

You are an expert on the **Spatial** codebase. Apply this context whenever working on any code in this repository.

---

## What Spatial is

A zero-dependency TypeScript toolkit for building interactive 2D editors (floor plans, seat maps, office layouts). It provides scene management, pan/zoom/selection/picking primitives, and pluggable renderers. It is a monorepo with two publishable packages: `@spatialkit/core` and `@spatialkit/svg`.

---

## Module map — go here first

| Question | Look here |
|----------|-----------|
| Public API, factory | `packages/core/src/core.ts` — `createCore()` |
| Entity CRUD | `packages/core/src/store.ts` |
| Pan / zoom / fit | `packages/core/src/viewport.ts` |
| Event system | `packages/core/src/events.ts` |
| Click hit-testing | `packages/core/src/picking.ts` |
| Selection logic | `packages/core/src/selection.ts` |
| Shared utilities | `packages/core/src/utils.ts` |
| All shared types | `packages/core/src/types.ts` |
| SVG mount / render loop | `packages/svg/src/renderer.ts` |
| SVG DOM structure | `packages/svg/src/dom.ts` |
| Mouse/wheel/drag events | `packages/svg/src/handlers.ts` |

---

## Architecture rules to enforce

1. **No production deps** — `@spatialkit/core` and `@spatialkit/svg` must stay dependency-free.
2. **Core is framework-agnostic** — no DOM, no React, no browser APIs in `packages/core/src/`.
3. **Branded types everywhere** — `EntityId` and `LayerId` are branded strings; never substitute with `string`.
4. **Immutable selection** — `applySelection` returns a new `Set`, never mutates the input.
5. **Selectable flag** — `hitTestPoint` only returns entities where `selectable === true`.
6. **Layer z-order** — picking iterates layers bottom-to-top, entities last-to-first within a layer.

---

## Key invariants

### Coordinate transforms
```
worldToScreen: (world - pan) * zoom
screenToWorld: screen / zoom + pan
```
Both are in `viewport.ts`. Use them — don't reimplement.

### SVG transform matrix
```
matrix(zoom 0 0 zoom -pan.x*zoom -pan.y*zoom)
```
Applied on `<g data-spatial="viewport">`. Changing this breaks all rendering.

### Core events
```
"viewport:change"     → { viewport }
"entities:changed"    → { type: "add"|"update"|"remove", ids: EntityId[] }
"selection:change"    → { selection: EntityId[] }
```
The SVG renderer subscribes to all three. Custom renderers must do the same.

---

## Development workflow

```bash
pnpm test          # run tests (must pass before commit)
pnpm typecheck     # tsc -b (must pass before commit)
pnpm lint          # eslint
pnpm build         # tsup ESM+CJS+d.ts
pnpm test:watch    # watch mode during development
```

Test environment: **Node** for core, **jsdom** for svg. Tests live in `src/__tests__/`.

---

## When adding a feature

1. Types → `types.ts`
2. Logic → appropriate module (`store`, `viewport`, `selection`, etc.)
3. Public surface → expose in `core.ts` and update `index.ts`
4. Tests → `src/__tests__/` covering edge cases (especially bounds/zoom clamping)
5. Gate: `pnpm typecheck && pnpm test && pnpm lint`

---

## Code conventions

- Strict TypeScript — no `any`, unused vars only with `_` prefix
- Factory functions, not classes (`createCore`, `createEmptyScene`)
- No comments unless the WHY is non-obvious
- Prettier: single quotes, semicolons, 100-char width
- Vitest spies with `vi.fn()`, mock `getBoundingClientRect` for DOM geometry tests

---

## Common pitfalls

- Forgetting `selectable: true` on entities → `hitTestPoint` returns null
- Using `string` instead of `EntityId` / `LayerId` → type errors downstream
- Mutating the `Set` from `applySelection` → breaks immutability contract
- Adding DOM code to `@spatialkit/core` → breaks the agnostic renderer model
- Not updating `index.ts` after adding exports → new symbols invisible to consumers
