import type { Bounds, Vec2, Viewport } from './types';
import { clamp } from './utils';

export function worldToScreen(viewport: Viewport, pan: Vec2): Vec2 {
  return {
    x: (pan.x - viewport.pan.x) * viewport.zoom,
    y: (pan.y - viewport.pan.y) * viewport.zoom,
  };
}

export function screenToWorld(viewport: Viewport, pan: Vec2): Vec2 {
  return {
    x: pan.x / viewport.zoom + viewport.pan.x,
    y: pan.y / viewport.zoom + viewport.pan.y,
  };
}

export function setZoomAt(viewport: Viewport, screenPoint: Vec2, delta: number) {
  const min = viewport.minZoom ?? 0.1;
  const max = viewport.maxZoom ?? 8;
  const prevZoom = viewport.zoom;
  const nextZoom = clamp(prevZoom * (1 + delta), min, max);

  if (nextZoom === prevZoom) {
    return;
  }

  const worldBefore = screenToWorld(viewport, screenPoint);
  viewport.zoom = nextZoom;
  const worldAfter = screenToWorld(viewport, screenPoint);

  viewport.pan.x += worldBefore.x - worldAfter.x;
  viewport.pan.y += worldBefore.y - worldAfter.y;
}

export function panBy(viewport: Viewport, deltaScreen: Vec2) {
  viewport.pan.x += deltaScreen.x / viewport.zoom;
  viewport.pan.y += deltaScreen.y / viewport.zoom;
}

export function fitToBounds(viewport: Viewport, bounds: Bounds, padding = 0) {
  const W = viewport.screenSize.width;
  const H = viewport.screenSize.height;
  const scaleX = W / (bounds.width + 2 + padding);
  const scaleY = H / (bounds.height + 2 + padding);
  const targetZoom = Math.min(scaleX, scaleY);
  const min = viewport.minZoom ?? 0.1;
  const max = viewport.maxZoom ?? 8;
  viewport.zoom = clamp(targetZoom, min, max);

  viewport.pan.x = bounds.x + bounds.width / 2 - W / viewport.zoom / 2;
  viewport.pan.y = bounds.y + bounds.height / 2 - H / viewport.zoom / 2;
}
