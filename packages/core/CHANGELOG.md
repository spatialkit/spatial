# @spatial-kit/core

## 0.2.0

### Minor Changes

- 6c76624: Add interactive entity resizing via drag handles.

  - `@spatial-kit/core` exports a new `ResizeDirection` type (`'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'`), `hitTestResizeHandles` to detect which handle is under the cursor in screen space, and `applyResizeDelta` to compute new bounds from a world-space drag delta (with optional snap-to-grid on the edge position)
  - `@spatial-kit/svg` adds `paintResizeHandles` painter that draws 8 handles around each selected entity at a consistent pixel size regardless of zoom, and wires resize drag into `attachHandlers` with a priority-over-entity-drag rule
  - `@spatial-kit/react` adds a `ResizeHandles` internal component that renders the same 8 handles declaratively, and wires resize drag into `attachHandlers` with the same state machine (`idle → pending → resize → idle`)

- 76f92f8: Add snap-to-grid support for entity drag.

  - `@spatial-kit/core` exports a new `snapToGrid(value, gridSize)` utility that rounds a world-space coordinate to the nearest grid multiple
  - `@spatial-kit/svg` accepts a `snapToGrid?: number` option on `mountSvgRenderer`; when set, entity positions are snapped on every drag frame
  - `@spatial-kit/react` accepts a `snapToGrid?: number` prop on `SpatialCanvas` with the same behavior

## 0.1.0

### Minor Changes

- Initial release of @spatial-kit/core, @spatial-kit/svg, and @spatial-kit/react.
