---
"@spatial-kit/core": minor
"@spatial-kit/svg": minor
"@spatial-kit/react": minor
---

Add snap-to-grid support for entity drag.

- `@spatial-kit/core` exports a new `snapToGrid(value, gridSize)` utility that rounds a world-space coordinate to the nearest grid multiple
- `@spatial-kit/svg` accepts a `snapToGrid?: number` option on `mountSvgRenderer`; when set, entity positions are snapped on every drag frame
- `@spatial-kit/react` accepts a `snapToGrid?: number` prop on `SpatialCanvas` with the same behavior
