import { describe, it, expect } from 'vitest';
import { worldToScreen, screenToWorld } from '../viewport';
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
});
