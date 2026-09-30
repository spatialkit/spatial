---
"@spatialkit/core": minor
"@spatialkit/svg": minor
"@spatialkit/react": minor
---

Add snap-to-grid support for entity drag.

- `@spatialkit/core` exports a new `snapToGrid(value, gridSize)` utility that rounds a world-space coordinate to the nearest grid multiple
- `@spatialkit/svg` accepts a `snapToGrid?: number` option on `mountSvgRenderer`; when set, entity positions are snapped on every drag frame
- `@spatialkit/react` accepts a `snapToGrid?: number` prop on `SpatialCanvas` with the same behavior
