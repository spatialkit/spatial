// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountSvgRenderer } from '../renderer';
import { createCore } from '@spatialkit/core';

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

function stubPointerCapture(svg: SVGSVGElement) {
  (svg as any).setPointerCapture = () => {};
  (svg as any).releasePointerCapture = () => {};
}

function makeCore() {
  return createCore({
    scene: {
      size: { width: 1000, height: 1000 },
      layers: ['tables' as any],
      entities: new Map(),
    },
    viewport: { zoom: 1, pan: { x: 0, y: 0 }, screenSize: { width: 800, height: 600 } },
  });
}

describe('Svg renderer (smoke)', () => {
  let svg: SVGSVGElement;

  beforeEach(() => {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
    document.body.appendChild(svg);
    stubRect(svg);
  });

  it('should mounts and paints layers and entities', () => {
    const core = createCore({
      scene: {
        size: { width: 1000, height: 1000 },
        layers: ['grid' as any, 'tables' as any],
        entities: new Map(),
      },
      viewport: { zoom: 1, pan: { x: 0, y: 0 }, screenSize: { width: 800, height: 600 } },
    });

    core.add({
      id: 't1' as any,
      layer: 'tables' as any,
      bounds: { x: 100, y: 100, width: 80, height: 80 },
      selectable: true,
      data: { type: 'table' },
    });

    const renderer = mountSvgRenderer(core, {
      mount: svg,
      drawEntity: (entity, { g }) => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        const radius = entity.bounds.width / 2;

        circle.setAttribute('cx', String(entity.bounds.x + radius));
        circle.setAttribute('cy', String(entity.bounds.y + radius));
        circle.setAttribute('r', String(radius));
        g.appendChild(circle);
      },
    });

    expect(svg.querySelector("g[data-spatial='viewport']")).toBeTruthy();
    expect(svg.querySelector("g[data-spatial='objects']")).toBeTruthy();

    expect(svg.querySelector('circle')).toBeTruthy();

    renderer.destroy();
  });
});

describe('Svg renderer - event-driven repaints', () => {
  let svg: SVGSVGElement;

  beforeEach(() => {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
    document.body.appendChild(svg);
    stubRect(svg);
  });

  it('should repaint when an entity is added', () => {
    const core = makeCore();
    const drawSpy = vi.fn();

    mountSvgRenderer(core, { mount: svg, drawEntity: drawSpy });
    drawSpy.mockClear();

    core.add({ id: 'e1' as any, layer: 'tables' as any, bounds: { x: 0, y: 0, width: 10, height: 10 } });

    expect(drawSpy).toHaveBeenCalledTimes(1);
  });

  it('should repaint when selection changes', () => {
    const core = makeCore();
    core.add({ id: 'e1' as any, layer: 'tables' as any, bounds: { x: 0, y: 0, width: 10, height: 10 }, selectable: true });

    const drawSpy = vi.fn();
    mountSvgRenderer(core, { mount: svg, drawEntity: drawSpy });
    drawSpy.mockClear();

    core.setSelection(['e1' as any], 'replace');

    expect(drawSpy).toHaveBeenCalledTimes(1);
  });

  it('should update viewport transform on viewport change', () => {
    const core = makeCore();
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {} });

    const viewportG = svg.querySelector<SVGGElement>("g[data-spatial='viewport']")!;
    const before = viewportG.getAttribute('transform');

    core.zoomAt({ x: 400, y: 300 }, 0.5);

    expect(viewportG.getAttribute('transform')).not.toBe(before);
  });
});

describe('Svg renderer - selected context', () => {
  let svg: SVGSVGElement;

  beforeEach(() => {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
    document.body.appendChild(svg);
    stubRect(svg);
  });

  it('should pass selected: false before selection and selected: true after', () => {
    const core = makeCore();
    core.add({ id: 'e1' as any, layer: 'tables' as any, bounds: { x: 0, y: 0, width: 10, height: 10 }, selectable: true });

    const selectedValues: boolean[] = [];
    mountSvgRenderer(core, {
      mount: svg,
      drawEntity: (_e, ctx) => selectedValues.push(ctx.selected),
    });

    expect(selectedValues).toEqual([false]);

    selectedValues.length = 0;
    core.setSelection(['e1' as any], 'replace');

    expect(selectedValues).toEqual([true]);
  });
});

describe('Svg renderer - onClickEntity', () => {
  let svg: SVGSVGElement;

  beforeEach(() => {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
    document.body.appendChild(svg);
    stubRect(svg);
    stubPointerCapture(svg);
  });

  it('should call onClickEntity when clicking on a selectable entity', () => {
    const core = makeCore();
    core.add({
      id: 'e1' as any,
      layer: 'tables' as any,
      bounds: { x: 100, y: 100, width: 200, height: 200 },
      selectable: true,
    });

    const onClickEntity = vi.fn();
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {}, onClickEntity });

    // click inside entity bounds (world = screen at zoom=1, pan=0)
    svg.dispatchEvent(new PointerEvent('pointerdown', { button: 0, clientX: 200, clientY: 200, bubbles: true }));
    svg.dispatchEvent(new PointerEvent('pointerup', { button: 0, clientX: 200, clientY: 200, bubbles: true }));

    expect(onClickEntity).toHaveBeenCalledWith('e1');
  });

  it('should not call onClickEntity when clicking empty space', () => {
    const core = makeCore();
    const onClickEntity = vi.fn();
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {}, onClickEntity });

    svg.dispatchEvent(new PointerEvent('pointerdown', { button: 0, clientX: 500, clientY: 500, bubbles: true }));
    svg.dispatchEvent(new PointerEvent('pointerup', { button: 0, clientX: 500, clientY: 500, bubbles: true }));

    expect(onClickEntity).not.toHaveBeenCalled();
  });
});
