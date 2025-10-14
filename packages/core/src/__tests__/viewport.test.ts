import { describe, it, expect } from 'vitest';
import { worldToScreen, screenToWorld, setZoomAt, panBy, fitToBounds } from '../viewport';
import type { Bounds, Viewport } from '../types';

describe('ScreenToWorld <-> WorldToScreen', () => {
  it('should convert world to screen coordinates', () => {
    const viewport: Viewport = {
      zoom: 2,
      pan: { x: 10, y: 5 },
      screenSize: {
        width: 800,
        height: 600,
      },
    };

    const screen = worldToScreen(viewport, { x: 12, y: 6 });

    expect(screen).toEqual({
      x: 4,
      y: 2,
    });

    const world = screenToWorld(viewport, screen);

    expect(world).toEqual({ x: 12, y: 6 });
  });

  it('should zoom in keeping the world point under cursor fixed', () => {
    const viewport: Viewport = {
      zoom: 1,
      pan: { x: 0, y: 0 },
      screenSize: {
        width: 800,
        height: 600,
      },
      minZoom: 0.5,
      maxZoom: 4,
    };

    const cursor = { x: 400, y: 300 };
    const worldBefore = screenToWorld(viewport, cursor);

    setZoomAt(viewport, cursor, +0.5);

    const worldAfter = screenToWorld(viewport, cursor);

    expect(worldAfter.x).toBeCloseTo(worldBefore.x, 6);
    expect(worldAfter.y).toBeCloseTo(worldBefore.y, 6);

    expect(viewport.zoom).toBeGreaterThan(1);
  });
});

describe('setZoomAt', () => {
  it('should clamp zoom between minZoom and maxZoom', () => {
    const viewport: Viewport = {
      zoom: 1,
      pan: { x: 0, y: 0 },
      screenSize: {
        width: 800,
        height: 600,
      },
      minZoom: 0.5,
      maxZoom: 2,
    };

    const cursor = { x: 100, y: 100 };

    setZoomAt(viewport, cursor, -2);
    expect(viewport.zoom).toBe(viewport.minZoom);

    setZoomAt(viewport, cursor, +5);
    expect(viewport.zoom).toBe(viewport.maxZoom);
  });
});

describe('panBy', () => {
  it('should pan viewport by screen delta at zoom level 1', () => {
    const viewport: Viewport = {
      zoom: 1,
      pan: { x: 0, y: 0 },
      screenSize: {
        width: 800,
        height: 600,
      },
    };

    panBy(viewport, { x: 100, y: 50 });

    expect(viewport.pan).toEqual({ x: 100, y: 50 });
  });

  it('should scale screen delta by inverse zoom when zoomed in', () => {
    const viewport: Viewport = {
      zoom: 2,
      pan: { x: 0, y: 0 },
      screenSize: {
        width: 800,
        height: 600,
      },
    };

    panBy(viewport, { x: 100, y: 50 });

    expect(viewport.pan).toEqual({ x: 50, y: 25 });
  });

  it('should scale screen delta by inverse zoom when zoomed out', () => {
    const viewport: Viewport = {
      zoom: 0.5,
      pan: { x: 0, y: 0 },
      screenSize: {
        width: 800,
        height: 600,
      },
    };

    panBy(viewport, { x: 100, y: 50 });

    expect(viewport.pan).toEqual({ x: 200, y: 100 });
  });

  it('should accumulate multiple pan operations', () => {
    const viewport: Viewport = {
      zoom: 1,
      pan: { x: 10, y: 20 },
      screenSize: {
        width: 800,
        height: 600,
      },
    };

    panBy(viewport, { x: 5, y: 10 });
    panBy(viewport, { x: 3, y: 7 });

    expect(viewport.pan).toEqual({ x: 18, y: 37 });
  });

  it('should handle negative delta values', () => {
    const viewport: Viewport = {
      zoom: 1,
      pan: { x: 100, y: 100 },
      screenSize: {
        width: 800,
        height: 600,
      },
    };

    panBy(viewport, { x: -50, y: -25 });

    expect(viewport.pan).toEqual({ x: 50, y: 75 });
  });

  it('should handle zero delta', () => {
    const viewport: Viewport = {
      zoom: 2,
      pan: { x: 10, y: 20 },
      screenSize: {
        width: 800,
        height: 600,
      },
    };

    panBy(viewport, { x: 0, y: 0 });

    expect(viewport.pan).toEqual({ x: 10, y: 20 });
  });

  it('should maintain world point correspondence after pan', () => {
    const viewport: Viewport = {
      zoom: 2,
      pan: { x: 0, y: 0 },
      screenSize: {
        width: 800,
        height: 600,
      },
    };

    const screenPoint = { x: 100, y: 100 };
    const worldBefore = screenToWorld(viewport, screenPoint);

    panBy(viewport, { x: 200, y: 100 });

    const newScreenPoint = worldToScreen(viewport, worldBefore);

    expect(newScreenPoint.x).toBeCloseTo(screenPoint.x - 200, 6);
    expect(newScreenPoint.y).toBeCloseTo(screenPoint.y - 100, 6);
  });

  it('should handle decimal zoom levels correctly', () => {
    const viewport: Viewport = {
      zoom: 1.5,
      pan: { x: 0, y: 0 },
      screenSize: {
        width: 800,
        height: 600,
      },
    };

    panBy(viewport, { x: 150, y: 90 });

    expect(viewport.pan.x).toBeCloseTo(100, 6);
    expect(viewport.pan.y).toBeCloseTo(60, 6);
  });
});

describe('fitToBounds', () => {
  it('should fit a square bounds perfectly in a square viewport', () => {
    const viewport: Viewport = {
      pan: { x: 0, y: 0 },
      zoom: 1,
      screenSize: { width: 800, height: 800 },
      minZoom: 0.1,
      maxZoom: 8,
    };

    const bounds: Bounds = {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    };

    fitToBounds(viewport, bounds);

    expect(viewport.zoom).toBeCloseTo(7.84, 1);
    expect(viewport.pan.x).toBeCloseTo(50 - 51, 1);
    expect(viewport.pan.y).toBeCloseTo(50 - 51, 1);
  });

  it('should fit a wide rectangle using height as limiting factor', () => {
    const viewport: Viewport = {
      pan: { x: 0, y: 0 },
      zoom: 1,
      screenSize: { width: 1000, height: 500 },
      minZoom: 0.1,
      maxZoom: 8,
    };

    const bounds: Bounds = {
      x: 0,
      y: 0,
      width: 200,
      height: 100,
    };

    fitToBounds(viewport, bounds);

    expect(viewport.zoom).toBeCloseTo(4.9, 1);
  });

  it('should fit a tall rectangle using width as limiting factor', () => {
    const viewport: Viewport = {
      pan: { x: 0, y: 0 },
      zoom: 1,
      screenSize: { width: 500, height: 1000 },
      minZoom: 0.1,
      maxZoom: 8,
    };

    const bounds: Bounds = {
      x: 0,
      y: 0,
      width: 100,
      height: 200,
    };

    fitToBounds(viewport, bounds);

    expect(viewport.zoom).toBeCloseTo(4.9, 1);
  });

  it('should respect minZoom constraint', () => {
    const viewport: Viewport = {
      pan: { x: 0, y: 0 },
      zoom: 1,
      screenSize: { width: 100, height: 100 },
      minZoom: 0.5,
      maxZoom: 8,
    };

    const bounds: Bounds = {
      x: 0,
      y: 0,
      width: 10000,
      height: 10000,
    };

    fitToBounds(viewport, bounds);

    expect(viewport.zoom).toBe(0.5);
  });

  it('should respect maxZoom constraint', () => {
    const viewport: Viewport = {
      pan: { x: 0, y: 0 },
      zoom: 1,
      screenSize: { width: 1000, height: 1000 },
      minZoom: 0.1,
      maxZoom: 2,
    };

    const bounds: Bounds = {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    };

    fitToBounds(viewport, bounds);

    expect(viewport.zoom).toBe(2);
  });

  it('should apply padding correctly', () => {
    const viewport: Viewport = {
      pan: { x: 0, y: 0 },
      zoom: 1,
      screenSize: { width: 800, height: 800 },
      minZoom: 0.1,
      maxZoom: 8,
    };

    const bounds: Bounds = {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    };

    fitToBounds(viewport, bounds, 50);

    expect(viewport.zoom).toBeCloseTo(5.26, 1);
  });

  it('should center bounds with offset position', () => {
    const viewport: Viewport = {
      pan: { x: 0, y: 0 },
      zoom: 1,
      screenSize: { width: 800, height: 800 },
      minZoom: 0.1,
      maxZoom: 8,
    };

    const bounds: Bounds = {
      x: 100,
      y: 200,
      width: 100,
      height: 100,
    };

    fitToBounds(viewport, bounds);

    const zoom = viewport.zoom;

    expect(viewport.pan.x).toBeCloseTo(150 - 800 / zoom / 2, 1);
    expect(viewport.pan.y).toBeCloseTo(250 - 800 / zoom / 2, 1);
  });

  it('should handle zero padding', () => {
    const viewport: Viewport = {
      pan: { x: 0, y: 0 },
      zoom: 1,
      screenSize: { width: 800, height: 800 },
      minZoom: 0.1,
      maxZoom: 8,
    };

    const bounds: Bounds = {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    };

    fitToBounds(viewport, bounds, 0);

    expect(viewport.zoom).toBeCloseTo(7.84, 1);
  });

  it('should use default minZoom when not specified', () => {
    const viewport: Viewport = {
      pan: { x: 0, y: 0 },
      zoom: 1,
      screenSize: { width: 100, height: 100 },
    };

    const bounds: Bounds = {
      x: 0,
      y: 0,
      width: 10000,
      height: 10000,
    };

    fitToBounds(viewport, bounds);

    expect(viewport.zoom).toBe(0.1);
  });

  it('should use default maxZoom when not specified', () => {
    const viewport: Viewport = {
      pan: { x: 0, y: 0 },
      zoom: 1,
      screenSize: { width: 1000, height: 1000 },
    };

    const bounds: Bounds = {
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    };

    fitToBounds(viewport, bounds);

    expect(viewport.zoom).toBe(8);
  });
});
