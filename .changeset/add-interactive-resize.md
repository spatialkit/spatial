---
"@floormap-tools/core": minor
"@floormap-tools/svg": minor
"@floormap-tools/react": minor
---

Add interactive entity resizing via drag handles.

- `@floormap-tools/core` exports a new `ResizeDirection` type (`'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'`), `hitTestResizeHandles` to detect which handle is under the cursor in screen space, and `applyResizeDelta` to compute new bounds from a world-space drag delta (with optional snap-to-grid on the edge position)
- `@floormap-tools/svg` adds `paintResizeHandles` painter that draws 8 handles around each selected entity at a consistent pixel size regardless of zoom, and wires resize drag into `attachHandlers` with a priority-over-entity-drag rule
- `@floormap-tools/react` adds a `ResizeHandles` internal component that renders the same 8 handles declaratively, and wires resize drag into `attachHandlers` with the same state machine (`idle → pending → resize → idle`)
