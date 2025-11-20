import type { Entity } from '@floormap/core';

export interface SvgRendererOptions {
  mount: SVGSVGElement;
  drawEntity: (entity: Entity, ctx: { g: SVGGElement }) => void;
  defs?: (svg: SVGSVGElement) => void;
  enableWheel?: boolean;
  enablePanDrag?: boolean;
  wheelZoomFactor?: number;
  dragButton?: 0 | 1 | 2;
  clickSelect?: boolean;
  onClickEntity?: (id: Entity['id']) => void;
  clickThresholdPx?: number;
}

export interface SvgRenderer {
  rerender(): void;
  destroy(): void;
}

export { mountSvgRenderer } from './renderer';
export type { SvgRendererOptions as Options, SvgRenderer as Renderer } from './index';
