// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { mountSvgRenderer } from '../renderer';
import { createCore } from '@floormap-tools/core';

function makeSetup() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
  document.body.appendChild(svg);
  (svg as any).getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 600 });

  const core = createCore({
    scene: { size: { width: 2000, height: 2000 }, layers: ['L' as any], entities: new Map() },
    viewport: { zoom: 1, pan: { x: 0, y: 0 }, screenSize: { width: 800, height: 600 } },
  });

  return { svg, core };
}

function getGridG(svg: SVGSVGElement) {
  return svg.querySelector<SVGGElement>("g[data-fm='grid']")!;
}

describe('Svg renderer - grid', () => {
  let svg: SVGSVGElement;
  let core: ReturnType<typeof createCore>;

  beforeEach(() => {
    ({ svg, core } = makeSetup());
  });

  it('gridG is empty when grid option is false (default)', () => {
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {} });
    expect(getGridG(svg).children.length).toBe(0);
  });

  it('gridG has line elements when grid is enabled', () => {
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {}, grid: {} });
    const lines = getGridG(svg).querySelectorAll('line');
    expect(lines.length).toBeGreaterThan(0);
  });

  it('all lines have vector-effect=non-scaling-stroke', () => {
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {}, grid: {} });
    const lines = getGridG(svg).querySelectorAll('line');
    for (const line of lines) {
      expect(line.getAttribute('vector-effect')).toBe('non-scaling-stroke');
    }
  });

  it('grid uses default size of 50 (800/50 + 1 vertical + 600/50 + 1 horizontal)', () => {
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {}, grid: {} });
    // At zoom=1, pan=0: visible x from 0 to 800, y from 0 to 600
    // vertical lines: x = 0, 50, 100, ..., 800 → 17 lines
    // horizontal lines: y = 0, 50, ..., 600 → 13 lines → total 30
    const lines = getGridG(svg).querySelectorAll('line');
    expect(lines.length).toBe(17 + 13);
  });

  it('grid uses custom size', () => {
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {}, grid: { size: 100 } });
    // vertical: x = 0,100,...,800 → 9; horizontal: y = 0,100,...,600 → 7 → total 16
    const lines = getGridG(svg).querySelectorAll('line');
    expect(lines.length).toBe(9 + 7);
  });

  it('grid uses custom stroke color', () => {
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {}, grid: { stroke: '#ff0000' } });
    const line = getGridG(svg).querySelector('line')!;
    expect(line.getAttribute('stroke')).toBe('#ff0000');
  });

  it('gridG is repainted on viewport change', () => {
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {}, grid: {} });
    const countBefore = getGridG(svg).querySelectorAll('line').length;

    // Zoom in → fewer grid cells visible
    core.zoomAt({ x: 400, y: 300 }, 2);

    const countAfter = getGridG(svg).querySelectorAll('line').length;
    expect(countAfter).not.toBe(countBefore);
  });
});
