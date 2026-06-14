import { describe, it, expect } from 'vitest';
import { clamp, containsPointAABB, expandBounds, unionBounds, snapToGrid } from '../utils';
import { Bounds, Vec2 } from '../types';

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