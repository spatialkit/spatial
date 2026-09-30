// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { mountSvgRenderer } from '../renderer';
import { createCore } from '@spatialkit/core';

function makeSetup() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
  document.body.appendChild(svg);
  (svg as any).getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 600 });
  (svg as any).setPointerCapture = () => {};
  (svg as any).releasePointerCapture = () => {};

  const core = createCore({
    scene: { size: { width: 2000, height: 2000 }, layers: ['L' as any], entities: new Map() },
    viewport: {
      zoom: 1,
      pan: { x: 0, y: 0 },
      screenSize: { width: 800, height: 600 },
      minZoom: 0.1,
      maxZoom: 10,
    },
  });

  return { svg, core };
}

function pointerDown(svg: SVGSVGElement, pointerId: number, x: number, y: number) {
  svg.dispatchEvent(
    new PointerEvent('pointerdown', { pointerId, button: 0, clientX: x, clientY: y, bubbles: true }),
  );
}

function pointerMove(svg: SVGSVGElement, pointerId: number, x: number, y: number) {
  svg.dispatchEvent(
    new PointerEvent('pointermove', { pointerId, button: 0, clientX: x, clientY: y, bubbles: true }),
  );
}

function pointerUp(svg: SVGSVGElement, pointerId: number, x: number, y: number) {
  svg.dispatchEvent(
    new PointerEvent('pointerup', { pointerId, button: 0, clientX: x, clientY: y, bubbles: true }),
  );
}

describe('Svg renderer - pinch-to-zoom', () => {
  let svg: SVGSVGElement;
  let core: ReturnType<typeof createCore>;

  beforeEach(() => {
    ({ svg, core } = makeSetup());
  });

  it('two pointers moving apart increases zoom', () => {
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {}, pinchZoomFactor: 0.01 });

    const initialZoom = core.viewport.zoom;

    // Place two fingers 100px apart
    pointerDown(svg, 1, 350, 300);
    pointerDown(svg, 2, 450, 300);

    // Move finger 1 left and finger 2 right → now 200px apart
    pointerMove(svg, 1, 300, 300);

    expect(core.viewport.zoom).toBeGreaterThan(initialZoom);
  });

  it('two pointers moving together decreases zoom', () => {
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {}, pinchZoomFactor: 0.01 });

    const initialZoom = core.viewport.zoom;

    // Place two fingers 200px apart
    pointerDown(svg, 1, 300, 300);
    pointerDown(svg, 2, 500, 300);

    // Move finger 1 right → now 100px apart
    pointerMove(svg, 1, 400, 300);

    expect(core.viewport.zoom).toBeLessThan(initialZoom);
  });

  it('single pointer drag resumes after pinch ends', () => {
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {}, pinchZoomFactor: 0.01 });

    // Start pinch
    pointerDown(svg, 1, 350, 300);
    pointerDown(svg, 2, 450, 300);
    pointerMove(svg, 1, 300, 300);

    // End pinch
    pointerUp(svg, 2, 450, 300);
    pointerUp(svg, 1, 300, 300);

    // New single-finger drag
    const panBefore = { ...core.viewport.pan };
    pointerDown(svg, 3, 400, 300);
    pointerMove(svg, 3, 300, 300);

    expect(core.viewport.pan).not.toEqual(panBefore);
  });
});
