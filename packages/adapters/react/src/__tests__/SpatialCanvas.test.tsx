// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, act } from '@testing-library/react';
import { createCore, createEmptyScene } from '@spatialkit/core';
import type { Entity, EntityId, LayerId } from '@spatialkit/core';
import { SpatialCanvas } from '../SpatialCanvas';

beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    })),
  );
});

function makeCore() {
  const core = createCore({
    scene: createEmptyScene({ width: 1000, height: 1000 }, ['L' as LayerId]),
    viewport: { zoom: 1, pan: { x: 0, y: 0 }, screenSize: { width: 800, height: 600 } },
  });
  core.add({
    id: 'e1' as EntityId,
    layer: 'L' as LayerId,
    bounds: { x: 100, y: 100, width: 100, height: 100 },
    selectable: true,
    data: { label: 'Entity 1' },
  });
  return core;
}

function makeSvgStubs(container: HTMLElement) {
  const svg = container.querySelector('svg')!;
  (svg as any).getBoundingClientRect = () => ({
    left: 0, top: 0, width: 800, height: 600,
  });
  (svg as any).setPointerCapture = () => {};
  (svg as any).releasePointerCapture = () => {};
  return svg;
}

describe('SpatialCanvas', () => {
  it('renders an SVG element with viewport group', () => {
    const core = makeCore();
    const { container } = render(
      <SpatialCanvas core={core} drawEntity={() => null} />,
    );
    expect(container.querySelector('svg')).toBeTruthy();
    expect(container.querySelector("g[data-spatial='viewport']")).toBeTruthy();
    expect(container.querySelector("g[data-spatial='objects']")).toBeTruthy();
  });

  it('calls drawEntity for each entity in the scene', () => {
    const core = makeCore();
    const drawEntity = vi.fn((_e: Entity) => null);
    render(<SpatialCanvas core={core} drawEntity={drawEntity} />);
    expect(drawEntity).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'e1' }),
      expect.objectContaining({ selected: false }),
    );
  });

  it('renders JSX returned by drawEntity into the SVG', () => {
    const core = makeCore();
    const { container } = render(
      <SpatialCanvas
        core={core}
        drawEntity={(entity) => (
          <rect data-testid={`entity-${entity.id}`} x={0} y={0} width={10} height={10} />
        )}
      />,
    );
    expect(container.querySelector('[data-testid="entity-e1"]')).toBeTruthy();
  });

  it('re-renders with selected=true when entity is selected', () => {
    const core = makeCore();
    const drawEntity = vi.fn((_e: Entity, _ctx: { selected: boolean }) => null);
    render(<SpatialCanvas core={core} drawEntity={drawEntity} />);

    act(() => {
      core.setSelection(['e1' as EntityId], 'replace');
    });

    const lastCall = drawEntity.mock.calls[drawEntity.mock.calls.length - 1];
    expect(lastCall[1].selected).toBe(true);
  });

  it('re-renders when a new entity is added', () => {
    const core = makeCore();
    const drawEntity = vi.fn((_e: Entity) => null);
    render(<SpatialCanvas core={core} drawEntity={drawEntity} />);
    const callsBefore = drawEntity.mock.calls.length;

    act(() => {
      core.add({
        id: 'e2' as EntityId,
        layer: 'L' as LayerId,
        bounds: { x: 200, y: 200, width: 50, height: 50 },
        selectable: true,
      });
    });

    expect(drawEntity.mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it('renders a layer group per scene layer', () => {
    const core = makeCore();
    const { container } = render(
      <SpatialCanvas core={core} drawEntity={() => null} />,
    );
    expect(container.querySelector("[data-spatial-layer='L']")).toBeTruthy();
  });

  it('renders SelectionOverlay when selectionOverlay is set', () => {
    const core = makeCore();
    core.setSelection(['e1' as EntityId], 'replace');
    const { container } = render(
      <SpatialCanvas
        core={core}
        drawEntity={() => null}
        selectionOverlay={{ stroke: '#ff0000' }}
      />,
    );
    expect(container.querySelector("g[data-spatial='selection'] rect")).toBeTruthy();
  });

  it('entity drag moves entity in world space', () => {
    const core = makeCore();
    const { container } = render(<SpatialCanvas core={core} drawEntity={() => null} />);
    const svg = makeSvgStubs(container);

    act(() => {
      svg.dispatchEvent(new PointerEvent('pointerdown', { button: 0, clientX: 150, clientY: 150, bubbles: true }));
      svg.dispatchEvent(new PointerEvent('pointermove', { button: 0, clientX: 200, clientY: 180, bubbles: true }));
      svg.dispatchEvent(new PointerEvent('pointerup',   { button: 0, clientX: 200, clientY: 180, bubbles: true }));
    });

    const e1 = core.scene.entities.get('e1' as EntityId)!;
    expect(e1.bounds.x).toBeCloseTo(150);
    expect(e1.bounds.y).toBeCloseTo(130);
  });

  it('enableEntityDrag: false disables entity movement', () => {
    const core = makeCore();
    const { container } = render(
      <SpatialCanvas core={core} drawEntity={() => null} enableEntityDrag={false} />,
    );
    const svg = makeSvgStubs(container);

    act(() => {
      svg.dispatchEvent(new PointerEvent('pointerdown', { button: 0, clientX: 150, clientY: 150, bubbles: true }));
      svg.dispatchEvent(new PointerEvent('pointermove', { button: 0, clientX: 200, clientY: 200, bubbles: true }));
      svg.dispatchEvent(new PointerEvent('pointerup',   { button: 0, clientX: 200, clientY: 200, bubbles: true }));
    });

    const e1 = core.scene.entities.get('e1' as EntityId)!;
    expect(e1.bounds.x).toBe(100);
  });

  it('click on entity selects it via clickSelect', () => {
    const core = makeCore();
    const { container } = render(
      <SpatialCanvas core={core} drawEntity={() => null} />,
    );
    const svg = makeSvgStubs(container);

    act(() => {
      svg.dispatchEvent(
        new PointerEvent('pointerdown', { button: 0, clientX: 150, clientY: 150, bubbles: true }),
      );
      svg.dispatchEvent(
        new PointerEvent('pointerup', { button: 0, clientX: 150, clientY: 150, bubbles: true }),
      );
    });

    expect(core.selection.has('e1' as EntityId)).toBe(true);
  });
});
