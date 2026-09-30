// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { mountSvgRenderer } from '../renderer';
import { createCore } from '@spatialkit/core';

function makeSetup() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
  document.body.appendChild(svg);
  (svg as any).getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 600 });

  const core = createCore({
    scene: {
      size: { width: 1000, height: 1000 },
      layers: ['L' as any],
      entities: new Map(),
    },
    viewport: { zoom: 1, pan: { x: 0, y: 0 }, screenSize: { width: 800, height: 600 } },
  });

  core.add({
    id: 'e1' as any,
    layer: 'L' as any,
    bounds: { x: 100, y: 100, width: 80, height: 60 },
    selectable: true,
  });

  return { svg, core };
}

function getSelectionG(svg: SVGSVGElement) {
  return svg.querySelector<SVGGElement>("g[data-spatial='selection']")!;
}

describe('Svg renderer - selection overlay', () => {
  let svg: SVGSVGElement;
  let core: ReturnType<typeof createCore>;

  beforeEach(() => {
    ({ svg, core } = makeSetup());
  });

  it('selectionG is empty before any selection', () => {
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {} });
    expect(getSelectionG(svg).children.length).toBe(0);
  });

  it('selectionG gets a rect after setSelection', () => {
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {} });
    core.setSelection(['e1' as any], 'replace');

    const rects = getSelectionG(svg).querySelectorAll('rect');
    expect(rects.length).toBe(1);
  });

  it('rect coordinates account for default padding (4)', () => {
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {} });
    core.setSelection(['e1' as any], 'replace');

    const rect = getSelectionG(svg).querySelector('rect')!;
    expect(Number(rect.getAttribute('x'))).toBe(100 - 4);
    expect(Number(rect.getAttribute('y'))).toBe(100 - 4);
    expect(Number(rect.getAttribute('width'))).toBe(80 + 8);
    expect(Number(rect.getAttribute('height'))).toBe(60 + 8);
  });

  it('rect uses custom style options', () => {
    mountSvgRenderer(core, {
      mount: svg,
      drawEntity: () => {},
      selectionOverlay: { stroke: '#ff0000', strokeWidth: 3, padding: 8 },
    });
    core.setSelection(['e1' as any], 'replace');

    const rect = getSelectionG(svg).querySelector('rect')!;
    expect(rect.getAttribute('stroke')).toBe('#ff0000');
    expect(rect.getAttribute('stroke-width')).toBe('3');
    expect(Number(rect.getAttribute('x'))).toBe(100 - 8);
  });

  it('selectionG is cleared when selection is emptied', () => {
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {} });
    core.setSelection(['e1' as any], 'replace');
    core.setSelection([], 'replace');

    expect(getSelectionG(svg).children.length).toBe(0);
  });

  it('selectionOverlay: false keeps selectionG empty', () => {
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {}, selectionOverlay: false });
    core.setSelection(['e1' as any], 'replace');

    expect(getSelectionG(svg).children.length).toBe(0);
  });

  it('rect has pointer-events=none to not block clicks', () => {
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {} });
    core.setSelection(['e1' as any], 'replace');

    const rect = getSelectionG(svg).querySelector('rect')!;
    expect(rect.getAttribute('pointer-events')).toBe('none');
  });
});
