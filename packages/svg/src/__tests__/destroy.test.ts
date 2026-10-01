// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { mountSvgRenderer } from '../renderer';
import { createCore } from '@spatial-kit/core';

function makeSetup() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
  document.body.appendChild(svg);
  (svg as any).getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 600 });

  const core = createCore({
    scene: { size: { width: 1000, height: 1000 }, layers: ['L' as any], entities: new Map() },
    viewport: { zoom: 1, pan: { x: 0, y: 0 }, screenSize: { width: 800, height: 600 } },
  });

  return { svg, core };
}

describe('Svg renderer - destroy DOM cleanup', () => {
  let svg: SVGSVGElement;
  let core: ReturnType<typeof createCore>;

  beforeEach(() => {
    ({ svg, core } = makeSetup());
  });

  it('destroy() removes viewport group by default', () => {
    const renderer = mountSvgRenderer(core, { mount: svg, drawEntity: () => {} });

    expect(svg.querySelector("g[data-spatial='viewport']")).toBeTruthy();
    renderer.destroy();
    expect(svg.querySelector("g[data-spatial='viewport']")).toBeNull();
  });

  it('destroy() removes defs element when present', () => {
    const renderer = mountSvgRenderer(core, {
      mount: svg,
      drawEntity: () => {},
      defs: (d) => {
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        d.appendChild(marker);
      },
    });

    expect(svg.querySelector("defs[data-spatial='defs']")).toBeTruthy();
    renderer.destroy();
    expect(svg.querySelector("defs[data-spatial='defs']")).toBeNull();
  });

  it('destroy() with clearOnDestroy: false preserves DOM', () => {
    const renderer = mountSvgRenderer(core, {
      mount: svg,
      drawEntity: () => {},
      clearOnDestroy: false,
    });

    renderer.destroy();
    expect(svg.querySelector("g[data-spatial='viewport']")).toBeTruthy();
  });

  it('destroy() unsubscribes from core events (no repaint after destroy)', () => {
    let paintCount = 0;
    const renderer = mountSvgRenderer(core, {
      mount: svg,
      drawEntity: () => { paintCount++; },
    });

    renderer.destroy();
    paintCount = 0;

    core.add({ id: 'e1' as any, layer: 'L' as any, bounds: { x: 0, y: 0, width: 10, height: 10 } });

    expect(paintCount).toBe(0);
  });
});
