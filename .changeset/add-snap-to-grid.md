---
"@floormap-tools/core": minor
"@floormap-tools/svg": minor
"@floormap-tools/react": minor
---

Add snap-to-grid support for entity drag.

- `@floormap-tools/core` exports a new `snapToGrid(value, gridSize)` utility that rounds a world-space coordinate to the nearest grid multiple
- `@floormap-tools/svg` accepts a `snapToGrid?: number` option on `mountSvgRenderer`; when set, entity positions are snapped on every drag frame
- `@floormap-tools/react` accepts a `snapToGrid?: number` prop on `FloormapCanvas` with the same behavior
