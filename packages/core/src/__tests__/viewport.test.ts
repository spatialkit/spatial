import { describe, it, expect } from 'vitest';
import { worldToScreen, screenToWorld, setZoomAt } from '../viewport';
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
});
