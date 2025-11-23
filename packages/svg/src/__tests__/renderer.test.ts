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

    expect(svg.querySelector("g[data-fm='viewport']")).toBeTruthy();
    expect(svg.querySelector("g[data-fm='objects']")).toBeTruthy();

    expect(svg.querySelector('circle')).toBeTruthy();

    renderer.destroy();
  });
});
