import type { Entity, EntityId } from '@floormap-tools/core';
import type { SelectionOverlayStyle } from './selection-overlay';
import type { GridOptions } from './grid';

export interface SvgRendererOptions {
  mount: SVGSVGElement;
  drawEntity: (entity: Entity, ctx: { g: SVGGElement; selected: boolean }) => void;
  defs?: (defs: SVGDefsElement) => void;
  enableWheel?: boolean;
  enablePanDrag?: boolean;
  wheelZoomFactor?: number;
  dragButton?: 0 | 1 | 2;
  clickSelect?: boolean;
  onClickEntity?: (id: EntityId) => void;
  clickThresholdPx?: number;
  /** Use Shift/Ctrl+click for add/toggle selection modes. Default: true */
  modifierSelect?: boolean;
  /** Allow dragging selected entities to move them. Default: true */
  enableEntityDrag?: boolean;
  /** Sensitivity for pinch-to-zoom gestures. Default: 0.005 */
  pinchZoomFactor?: number;
  /** Automatic selection overlay drawn in selectionG. false to disable. Default: {} */
  selectionOverlay?: SelectionOverlayStyle | false;
  /** Background grid drawn in gridG. false to disable. Default: false */
  grid?: GridOptions | false;
  /** Remove SVG groups from DOM on destroy(). Default: true */
  clearOnDestroy?: boolean;
  /** Grid size in world units for snap-to-grid when dragging entities. Disabled when absent. */
  snapToGrid?: number;
}

export interface SvgRenderer {
  rerender(): void;
  destroy(): void;
}

export { mountSvgRenderer } from './renderer';
export type { SvgRendererOptions as Options, SvgRenderer as Renderer };
export type { SelectionOverlayStyle } from './selection-overlay';
export type { GridOptions } from './grid';
