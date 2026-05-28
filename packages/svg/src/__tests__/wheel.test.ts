// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { mountSvgRenderer } from '../renderer';
import { createCore } from '@floormap/core';

function stubRect(svg: SVGSVGElement) {
  (svg as any).getBoundingClientRect = () => ({
    left: 0,
    top: 0,
    width: 800,
    height: 600,
    x: 0,
    y: 0,
    right: 800,
    bottom: 600,
    toJSON() {
      return {};
    },
  });
}

describe('Svg renderer - wheel zoom', () => {
  let svg: SVGSVGElement;

  beforeEach(() => {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
    document.body.appendChild(svg);
    stubRect(svg);
  });

  it('should change viewport zoom on wheel', () => {
    const core = createCore({
      scene: { size: { width: 1000, height: 1000 }, layers: ['L' as any], entities: new Map() },
      viewport: {
        zoom: 1,
        pan: { x: 0, y: 0 },
        screenSize: { width: 800, height: 600 },
        minZoom: 0.5,
        maxZoom: 4,
      },
    });

    mountSvgRenderer(core, {
      mount: svg,
      drawEntity: () => {},
      wheelZoomFactor: 0.01,
    });

    const prev = core.viewport.zoom;
    const evt = new WheelEvent('wheel', { deltaY: -100 });
    svg.dispatchEvent(evt);

    expect(core.viewport.zoom).toBeGreaterThan(prev);
  });
});
