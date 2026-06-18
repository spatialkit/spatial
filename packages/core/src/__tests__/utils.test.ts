import { describe, it, expect } from 'vitest';
import { clamp, containsPointAABB, expandBounds, unionBounds, snapToGrid, hitTestResizeHandles, applyResizeDelta } from '../utils';
import { Bounds, Entity, EntityId, LayerId, Vec2 } from '../types';

function makeEntity(bounds: Bounds): Entity {
  return { id: 'e1' as EntityId, layer: 'l1' as LayerId, bounds, selectable: true };
}

function identityWorldToScreen(p: Vec2): Vec2 { return p; }

describe('clamp', () => {
  it('should return value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('should return min when value is below range', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('should return max when value is above range', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('should handle negative ranges', () => {
    expect(clamp(-5, -10, -1)).toBe(-5);
    expect(clamp(-15, -10, -1)).toBe(-10);
    expect(clamp(0, -10, -1)).toBe(-1);
  });
});

describe('containsPointAABB', () => {
  const bounds: Bounds = { x: 0, y: 0, width: 10, height: 10 };

  it('should return true for point inside bounds', () => {
    const point: Vec2 = { x: 5, y: 5 };
    expect(containsPointAABB(bounds, point)).toBe(true);
  });

  it('should return true for point on boundary', () => {
    expect(containsPointAABB(bounds, { x: 0, y: 0 })).toBe(true);
    expect(containsPointAABB(bounds, { x: 10, y: 10 })).toBe(true);
  });

  it('should return false for point outside bounds', () => {
    expect(containsPointAABB(bounds, { x: -1, y: 5 })).toBe(false);
    expect(containsPointAABB(bounds, { x: 11, y: 5 })).toBe(false);
    expect(containsPointAABB(bounds, { x: 5, y: -1 })).toBe(false);
    expect(containsPointAABB(bounds, { x: 5, y: 11 })).toBe(false);
  });
});

describe('expandBounds', () => {
  it('should expand bounds by padding on all sides', () => {
    const bounds: Bounds = { x: 10, y: 10, width: 20, height: 20 };
    const result = expandBounds(bounds, 5);
    expect(result).toEqual({ x: 5, y: 5, width: 30, height: 30 });
  });

  it('should handle zero padding', () => {
    const bounds: Bounds = { x: 10, y: 10, width: 20, height: 20 };
    const result = expandBounds(bounds, 0);
    expect(result).toEqual(bounds);
  });

  it('should handle negative padding (shrinking)', () => {
    const bounds: Bounds = { x: 10, y: 10, width: 20, height: 20 };
    const result = expandBounds(bounds, -5);
    expect(result).toEqual({ x: 15, y: 15, width: 10, height: 10 });
  });
});

describe('unionBounds', () => {
  it('should return union of two bounds', () => {
    const a: Bounds = { x: 0, y: 0, width: 10, height: 10 };
    const b: Bounds = { x: 5, y: 5, width: 10, height: 10 };
    const result = unionBounds(a, b);
    expect(result).toEqual({ x: 0, y: 0, width: 15, height: 15 });
  });

  it('should handle non-overlapping bounds', () => {
    const a: Bounds = { x: 0, y: 0, width: 10, height: 10 };
    const b: Bounds = { x: 20, y: 20, width: 10, height: 10 };
    const result = unionBounds(a, b);
    expect(result).toEqual({ x: 0, y: 0, width: 30, height: 30 });
  });

  it('should handle one bound containing another', () => {
    const a: Bounds = { x: 0, y: 0, width: 20, height: 20 };
    const b: Bounds = { x: 5, y: 5, width: 5, height: 5 };
    const result = unionBounds(a, b);
    expect(result).toEqual({ x: 0, y: 0, width: 20, height: 20 });
  });

  it('should handle negative coordinates', () => {
    const a: Bounds = { x: -10, y: -10, width: 10, height: 10 };
    const b: Bounds = { x: 5, y: 5, width: 10, height: 10 };
    const result = unionBounds(a, b);
    expect(result).toEqual({ x: -10, y: -10, width: 25, height: 25 });
  });
});

describe('snapToGrid', () => {
  it('snaps value to nearest grid point below', () => {
    expect(snapToGrid(42, 40)).toBe(40);
    expect(snapToGrid(127, 40)).toBe(120);
  });

  it('snaps value to nearest grid point above', () => {
    expect(snapToGrid(61, 40)).toBe(80);
    expect(snapToGrid(140, 40)).toBe(160);
  });

  it('value already on grid returns unchanged', () => {
    expect(snapToGrid(80, 40)).toBe(80);
    expect(snapToGrid(0, 40)).toBe(0);
  });

  it('works with negative values', () => {
    expect(snapToGrid(-21, 40)).toBe(-40);
    expect(snapToGrid(-85, 40)).toBe(-80);
  });

  it('works with non-round grid sizes', () => {
    expect(snapToGrid(37, 25)).toBe(25);
    expect(snapToGrid(38, 25)).toBe(50);
  });
});

describe('hitTestResizeHandles', () => {
  const bounds: Bounds = { x: 100, y: 100, width: 100, height: 100 };
  const entity = makeEntity(bounds);
  const entities = [entity];

  it('returns null when no entities', () => {
    expect(hitTestResizeHandles([], identityWorldToScreen, { x: 100, y: 100 })).toBeNull();
  });

  it('returns null when pointer is far from all handles', () => {
    expect(hitTestResizeHandles(entities, identityWorldToScreen, { x: 150, y: 150 })).toBeNull();
  });

  it('hits nw corner handle', () => {
    const result = hitTestResizeHandles(entities, identityWorldToScreen, { x: 100, y: 100 });
    expect(result).toEqual({ entityId: 'e1', direction: 'nw' });
  });

  it('hits ne corner handle', () => {
    const result = hitTestResizeHandles(entities, identityWorldToScreen, { x: 200, y: 100 });
    expect(result).toEqual({ entityId: 'e1', direction: 'ne' });
  });

  it('hits se corner handle', () => {
    const result = hitTestResizeHandles(entities, identityWorldToScreen, { x: 200, y: 200 });
    expect(result).toEqual({ entityId: 'e1', direction: 'se' });
  });

  it('hits sw corner handle', () => {
    const result = hitTestResizeHandles(entities, identityWorldToScreen, { x: 100, y: 200 });
    expect(result).toEqual({ entityId: 'e1', direction: 'sw' });
  });

  it('hits n edge handle', () => {
    const result = hitTestResizeHandles(entities, identityWorldToScreen, { x: 150, y: 100 });
    expect(result).toEqual({ entityId: 'e1', direction: 'n' });
  });

  it('hits s edge handle', () => {
    const result = hitTestResizeHandles(entities, identityWorldToScreen, { x: 150, y: 200 });
    expect(result).toEqual({ entityId: 'e1', direction: 's' });
  });

  it('hits e edge handle', () => {
    const result = hitTestResizeHandles(entities, identityWorldToScreen, { x: 200, y: 150 });
    expect(result).toEqual({ entityId: 'e1', direction: 'e' });
  });

  it('hits w edge handle', () => {
    const result = hitTestResizeHandles(entities, identityWorldToScreen, { x: 100, y: 150 });
    expect(result).toEqual({ entityId: 'e1', direction: 'w' });
  });

  it('respects custom handle size', () => {
    // pointer 3px away from center — should hit with size=8, miss with size=4
    expect(hitTestResizeHandles(entities, identityWorldToScreen, { x: 103, y: 100 }, 8)).toEqual({ entityId: 'e1', direction: 'nw' });
    expect(hitTestResizeHandles(entities, identityWorldToScreen, { x: 103, y: 100 }, 4)).toBeNull();
  });

  it('works with zoom=2 (worldToScreen scales coords)', () => {
    // zoom=2: screen = world * 2, entity corner nw at world(100,100) → screen(200,200)
    const worldToScreen = (p: Vec2): Vec2 => ({ x: p.x * 2, y: p.y * 2 });
    const result = hitTestResizeHandles(entities, worldToScreen, { x: 200, y: 200 });
    expect(result).toEqual({ entityId: 'e1', direction: 'nw' });
  });
});

describe('applyResizeDelta', () => {
  const original: Bounds = { x: 100, y: 100, width: 200, height: 100 };

  it('e — extends right edge', () => {
    const result = applyResizeDelta(original, 'e', { x: 50, y: 0 });
    expect(result).toEqual({ x: 100, y: 100, width: 250, height: 100 });
  });

  it('w — moves left edge, keeps right edge fixed', () => {
    const result = applyResizeDelta(original, 'w', { x: -50, y: 0 });
    expect(result).toEqual({ x: 50, y: 100, width: 250, height: 100 });
  });

  it('s — extends bottom edge', () => {
    const result = applyResizeDelta(original, 's', { x: 0, y: 30 });
    expect(result).toEqual({ x: 100, y: 100, width: 200, height: 130 });
  });

  it('n — moves top edge, keeps bottom edge fixed', () => {
    const result = applyResizeDelta(original, 'n', { x: 0, y: -20 });
    expect(result).toEqual({ x: 100, y: 80, width: 200, height: 120 });
  });

  it('se — extends right and bottom', () => {
    const result = applyResizeDelta(original, 'se', { x: 10, y: 20 });
    expect(result).toEqual({ x: 100, y: 100, width: 210, height: 120 });
  });

  it('nw — moves top-left corner', () => {
    const result = applyResizeDelta(original, 'nw', { x: 10, y: 10 });
    expect(result).toEqual({ x: 110, y: 110, width: 190, height: 90 });
  });

  it('enforces minimum width and height of 1', () => {
    const result = applyResizeDelta(original, 'e', { x: -300, y: 0 });
    expect(result.width).toBe(1);
  });

  it('respects snapToGrid', () => {
    // right edge: 100 + 200 + 15 = 315 → snap to 40 → 320 → width = 320 - 100 = 220
    const result = applyResizeDelta(original, 'e', { x: 15, y: 0 }, 40);
    expect(result.width).toBe(220);
  });

  it('snapToGrid on west edge snaps the x position', () => {
    // x: 100 + (-15) = 85 → snap to 40 → 80 → width = 200 + (100 - 80) = 220
    const result = applyResizeDelta(original, 'w', { x: -15, y: 0 }, 40);
    expect(result.x).toBe(80);
    expect(result.width).toBe(220);
  });
});