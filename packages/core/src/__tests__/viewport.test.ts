import { describe, it, expect } from 'vitest';
import { worldToScreen, screenToWorld, setZoomAt, panBy } from '../viewport';
import type { Viewport } from '../types';

describe('Viewport', () => {
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
