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
    bounds: { x: 100, y: 100, width: 100, height: 100 },
    selectable: true,
  });

  core.add({
    id: 'e2' as any,
    layer: 'L' as any,
    bounds: { x: 300, y: 300, width: 80, height: 60 },
    selectable: true,
  });

  return { svg, core };
}

function getOverlaysG(svg: SVGSVGElement) {
  return svg.querySelector<SVGGElement>("g[data-spatial='overlays']")!;
}

describe('paintResizeHandles', () => {
  let svg: SVGSVGElement;
  let core: ReturnType<typeof createCore>;

  beforeEach(() => {
    ({ svg, core } = makeSetup());
  });

  it('overlaysG is empty when there is no selection', () => {
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {} });
    expect(getOverlaysG(svg).children.length).toBe(0);
  });

  it('shows 8 handles per selected entity', () => {
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {} });
    core.setSelection(['e1' as any], 'replace');

    const rects = getOverlaysG(svg).querySelectorAll('rect');
    expect(rects.length).toBe(8);
  });

  it('shows 16 handles when two entities are selected', () => {
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {} });
    core.setSelection(['e1' as any, 'e2' as any], 'replace');

    const rects = getOverlaysG(svg).querySelectorAll('rect');
    expect(rects.length).toBe(16);
  });

  it('clears handles when selection is emptied', () => {
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {} });
    core.setSelection(['e1' as any], 'replace');
    core.setSelection([], 'replace');

    expect(getOverlaysG(svg).children.length).toBe(0);
  });

  it('handles have pointer-events=none', () => {
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {} });
    core.setSelection(['e1' as any], 'replace');

    const rects = getOverlaysG(svg).querySelectorAll('rect');
    rects.forEach((rect) => {
      expect(rect.getAttribute('pointer-events')).toBe('none');
    });
  });

  it('handles update when entity bounds change', () => {
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {} });
    core.setSelection(['e1' as any], 'replace');

    const rectsBefore = [...getOverlaysG(svg).querySelectorAll('rect')].map((r) => r.getAttribute('x'));
    core.update('e1' as any, { bounds: { x: 200, y: 200, width: 100, height: 100 } });
    const rectsAfter = [...getOverlaysG(svg).querySelectorAll('rect')].map((r) => r.getAttribute('x'));

    expect(rectsBefore).not.toEqual(rectsAfter);
  });

  it('handles reposition when viewport zooms', () => {
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {} });
    core.setSelection(['e1' as any], 'replace');

    const widthBefore = Number(getOverlaysG(svg).querySelector('rect')!.getAttribute('width'));
    core.zoomAt({ x: 400, y: 300 }, 1);
    const widthAfter = Number(getOverlaysG(svg).querySelector('rect')!.getAttribute('width'));

    // Handle world-space size decreases as zoom increases (to keep screen-space size constant)
    expect(widthAfter).toBeLessThan(widthBefore);
  });
});
