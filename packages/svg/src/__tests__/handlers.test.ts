// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { mountSvgRenderer } from '../renderer';
import { createCore } from '@floormap/core';

function makesvg() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
  document.body.appendChild(svg);
  (svg as any).getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 600 });
  (svg as any).setPointerCapture = () => {};
  (svg as any).releasePointerCapture = () => {};
  return svg;
}

function makeCore() {
  const core = createCore({
    scene: {
      size: { width: 1000, height: 1000 },
      layers: ['L' as any],
      entities: new Map(),
    },
    viewport: { zoom: 1, pan: { x: 0, y: 0 }, screenSize: { width: 800, height: 600 } },
  });

  // Entity occupying (100,100) to (200,200) in world/screen coords
  core.add({
    id: 'e1' as any,
    layer: 'L' as any,
    bounds: { x: 100, y: 100, width: 100, height: 100 },
    selectable: true,
  });

  // Second entity to test multi-select
  core.add({
    id: 'e2' as any,
    layer: 'L' as any,
    bounds: { x: 300, y: 300, width: 100, height: 100 },
    selectable: true,
  });

  return core;
}

function click(svg: SVGSVGElement, x: number, y: number, opts: PointerEventInit = {}) {
  svg.dispatchEvent(new PointerEvent('pointerdown', { button: 0, clientX: x, clientY: y, bubbles: true, ...opts }));
  svg.dispatchEvent(new PointerEvent('pointerup', { button: 0, clientX: x, clientY: y, bubbles: true, ...opts }));
}

describe('Svg renderer - multi-select modifier keys', () => {
  let svg: SVGSVGElement;

  beforeEach(() => {
    svg = makesvg();
  });

  it('click on entity without modifier replaces selection', () => {
    const core = makeCore();
    core.setSelection(['e2' as any], 'replace');
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {} });

    click(svg, 150, 150); // inside e1

    expect([...core.selection]).toEqual(['e1']);
  });

  it('shift+click on entity adds to existing selection', () => {
    const core = makeCore();
    core.setSelection(['e2' as any], 'replace');
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {} });

    click(svg, 150, 150, { shiftKey: true }); // add e1

    expect(core.selection.has('e1' as any)).toBe(true);
    expect(core.selection.has('e2' as any)).toBe(true);
  });

  it('ctrl+click on entity toggles selection off', () => {
    const core = makeCore();
    core.setSelection(['e1' as any], 'replace');
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {} });

    click(svg, 150, 150, { ctrlKey: true }); // toggle e1 off

    expect(core.selection.has('e1' as any)).toBe(false);
  });

  it('meta+click on entity toggles selection', () => {
    const core = makeCore();
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {} });

    click(svg, 150, 150, { metaKey: true }); // toggle e1 on

    expect(core.selection.has('e1' as any)).toBe(true);
  });

  it('click on empty space without modifier clears selection', () => {
    const core = makeCore();
    core.setSelection(['e1' as any], 'replace');
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {} });

    click(svg, 600, 500); // empty space

    expect(core.selection.size).toBe(0);
  });

  it('shift+click on empty space preserves selection', () => {
    const core = makeCore();
    core.setSelection(['e1' as any], 'replace');
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {} });

    click(svg, 600, 500, { shiftKey: true }); // empty space, shift held

    expect(core.selection.has('e1' as any)).toBe(true);
  });

  it('modifierSelect: false always uses replace mode', () => {
    const core = makeCore();
    core.setSelection(['e2' as any], 'replace');
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {}, modifierSelect: false });

    click(svg, 150, 150, { shiftKey: true }); // shift ignored

    expect([...core.selection]).toEqual(['e1']);
    expect(core.selection.has('e2' as any)).toBe(false);
  });
});
