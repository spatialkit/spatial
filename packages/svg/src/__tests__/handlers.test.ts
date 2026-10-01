// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { mountSvgRenderer } from '../renderer';
import { createCore } from '@spatial-kit/core';

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
  svg.dispatchEvent(
    new PointerEvent('pointerdown', { button: 0, clientX: x, clientY: y, bubbles: true, ...opts }),
  );
  svg.dispatchEvent(
    new PointerEvent('pointerup', { button: 0, clientX: x, clientY: y, bubbles: true, ...opts }),
  );
}

function drag(svg: SVGSVGElement, fromX: number, fromY: number, toX: number, toY: number) {
  svg.dispatchEvent(
    new PointerEvent('pointerdown', { button: 0, clientX: fromX, clientY: fromY, bubbles: true }),
  );
  svg.dispatchEvent(
    new PointerEvent('pointermove', { button: 0, clientX: toX, clientY: toY, bubbles: true }),
  );
  svg.dispatchEvent(
    new PointerEvent('pointerup', { button: 0, clientX: toX, clientY: toY, bubbles: true }),
  );
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

describe('Svg renderer - entity drag', () => {
  let svg: SVGSVGElement;

  beforeEach(() => {
    svg = makesvg();
  });

  it('dragging a selected entity moves it by the pointer delta in world space', () => {
    const core = makeCore();
    core.setSelection(['e1' as any], 'replace');
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {} });

    drag(svg, 150, 150, 200, 180); // drag 50px right, 30px down

    const e1 = core.scene.entities.get('e1' as any)!;
    expect(e1.bounds.x).toBeCloseTo(150);
    expect(e1.bounds.y).toBeCloseTo(130);
  });

  it('dragging moves all selected entities together', () => {
    const core = makeCore();
    core.setSelection(['e1' as any, 'e2' as any], 'replace');
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {} });

    drag(svg, 150, 150, 160, 160); // drag 10px right, 10px down (on e1)

    const e1 = core.scene.entities.get('e1' as any)!;
    const e2 = core.scene.entities.get('e2' as any)!;
    expect(e1.bounds.x).toBeCloseTo(110);
    expect(e1.bounds.y).toBeCloseTo(110);
    expect(e2.bounds.x).toBeCloseTo(310);
    expect(e2.bounds.y).toBeCloseTo(310);
  });

  it('dragging an unselected entity selects it and moves it', () => {
    const core = makeCore();
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {} });

    drag(svg, 150, 150, 200, 200); // drag on e1 (unselected)

    expect(core.selection.has('e1' as any)).toBe(true);
    const e1 = core.scene.entities.get('e1' as any)!;
    expect(e1.bounds.x).toBeCloseTo(150);
    expect(e1.bounds.y).toBeCloseTo(150);
  });

  it('a small movement within click threshold is treated as click, not drag', () => {
    const core = makeCore();
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {} });

    // Move only 2px (below default 3px threshold) — should be a click, not a drag
    drag(svg, 150, 150, 152, 150);

    const e1 = core.scene.entities.get('e1' as any)!;
    expect(e1.bounds.x).toBe(100); // unchanged
    expect(core.selection.has('e1' as any)).toBe(true); // was treated as click
  });

  it('dragging on empty space pans instead of moving entities', () => {
    const core = makeCore();
    core.setSelection(['e1' as any], 'replace');
    const initialPan = { ...core.viewport.pan };
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {} });

    drag(svg, 500, 400, 550, 420); // empty space drag

    const e1 = core.scene.entities.get('e1' as any)!;
    expect(e1.bounds.x).toBe(100); // entity unmoved
    expect(core.viewport.pan.x).not.toBe(initialPan.x); // viewport panned
  });

  it('enableEntityDrag: false disables entity drag', () => {
    const core = makeCore();
    core.setSelection(['e1' as any], 'replace');
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {}, enableEntityDrag: false });

    drag(svg, 150, 150, 200, 200);

    const e1 = core.scene.entities.get('e1' as any)!;
    expect(e1.bounds.x).toBe(100); // entity unmoved
  });

  it('snapToGrid snaps entity position to nearest grid point', () => {
    const core = makeCore();
    core.setSelection(['e1' as any], 'replace');
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {}, snapToGrid: 40 });

    drag(svg, 150, 150, 177, 150);

    const e1 = core.scene.entities.get('e1' as any)!;

    expect(e1.bounds.x).toBe(120);
    expect(e1.bounds.y).toBe(120);
  });

  it('snapToGrid rounds up when past the midpoint', () => {
    const core = makeCore();
    core.setSelection(['e1' as any], 'replace');
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {}, snapToGrid: 40 });

    drag(svg, 150, 150, 190, 150);

    const e1 = core.scene.entities.get('e1' as any)!;
    expect(e1.bounds.x).toBe(160);
  });

  it('without snapToGrid entity position is not snapped', () => {
    const core = makeCore();
    core.setSelection(['e1' as any], 'replace');
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {} });

    drag(svg, 150, 150, 177, 150);

    const e1 = core.scene.entities.get('e1' as any)!;
    expect(e1.bounds.x).toBeCloseTo(127);
  });
});

describe('Svg renderer - resize handles', () => {
  let svg: SVGSVGElement;

  beforeEach(() => {
    svg = makesvg();
  });

  it('dragging the east handle extends entity width', () => {
    const core = makeCore();
    core.setSelection(['e1' as any], 'replace');
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {} });

    // e1: x=100, y=100, w=100, h=100 — east handle at world(200,150) = screen(200,150)
    drag(svg, 200, 150, 250, 150);

    const e1 = core.scene.entities.get('e1' as any)!;
    expect(e1.bounds.x).toBeCloseTo(100);      // x unchanged
    expect(e1.bounds.y).toBeCloseTo(100);      // y unchanged
    expect(e1.bounds.width).toBeCloseTo(150);  // width grew by 50
    expect(e1.bounds.height).toBeCloseTo(100); // height unchanged
  });

  it('dragging the west handle moves x and adjusts width', () => {
    const core = makeCore();
    core.setSelection(['e1' as any], 'replace');
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {} });

    // west handle at world(100,150) = screen(100,150), drag left 30px
    drag(svg, 100, 150, 70, 150);

    const e1 = core.scene.entities.get('e1' as any)!;
    expect(e1.bounds.x).toBeCloseTo(70);
    expect(e1.bounds.width).toBeCloseTo(130);
  });

  it('dragging the south handle extends entity height', () => {
    const core = makeCore();
    core.setSelection(['e1' as any], 'replace');
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {} });

    // south handle at world(150,200) = screen(150,200), drag down 40px
    drag(svg, 150, 200, 150, 240);

    const e1 = core.scene.entities.get('e1' as any)!;
    expect(e1.bounds.height).toBeCloseTo(140);
    expect(e1.bounds.y).toBeCloseTo(100);
  });

  it('dragging the nw corner moves x,y and adjusts width,height', () => {
    const core = makeCore();
    core.setSelection(['e1' as any], 'replace');
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {} });

    // nw handle at world(100,100) = screen(100,100), drag to (80,80)
    drag(svg, 100, 100, 80, 80);

    const e1 = core.scene.entities.get('e1' as any)!;
    expect(e1.bounds.x).toBeCloseTo(80);
    expect(e1.bounds.y).toBeCloseTo(80);
    expect(e1.bounds.width).toBeCloseTo(120);
    expect(e1.bounds.height).toBeCloseTo(120);
  });

  it('resize within click threshold is not triggered', () => {
    const core = makeCore();
    core.setSelection(['e1' as any], 'replace');
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {} });

    // Move only 2px from east handle — below default 3px threshold
    drag(svg, 200, 150, 202, 150);

    const e1 = core.scene.entities.get('e1' as any)!;
    expect(e1.bounds.width).toBe(100); // unchanged
  });

  it('resize with snapToGrid snaps the resized edge', () => {
    const core = makeCore();
    core.setSelection(['e1' as any], 'replace');
    mountSvgRenderer(core, { mount: svg, drawEntity: () => {}, snapToGrid: 40 });

    // east handle at 200, drag +15 → right edge = 215 → snap to 40 → 200, width = 100 (no change)
    // drag +25 → right edge = 225 → snap to 40 → 240, width = 140
    drag(svg, 200, 150, 225, 150);

    const e1 = core.scene.entities.get('e1' as any)!;
    expect(e1.bounds.width).toBe(140);
  });
});
