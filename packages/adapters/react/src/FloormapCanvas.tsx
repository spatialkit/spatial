import {
  memo,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type ReactNode,
} from 'react';
import type { Entity, EntityId, FloormapCore, LayerId } from '@floormap/core';
import { attachHandlers } from './internal/attachHandlers';
import { useEntities } from './internal/useEntities';
import { useViewportTransform } from './internal/useViewportTransform';
import { GridLayer } from './internal/GridLayer';
import { SelectionOverlay } from './internal/SelectionOverlay';
import { useSelection } from './hooks/useSelection';
import type { GridOptions, SelectionOverlayStyle } from './types';

const DEFAULT_SELECTION_OVERLAY: SelectionOverlayStyle = {};

export interface FloormapCanvasProps {
  core: FloormapCore;
  drawEntity: (entity: Entity, ctx: { selected: boolean }) => ReactNode;

  // Visual
  grid?: GridOptions | false;
  selectionOverlay?: SelectionOverlayStyle | false;

  // Interaction
  enableWheel?: boolean;
  enablePanDrag?: boolean;
  enableEntityDrag?: boolean;
  dragButton?: 0 | 1 | 2;
  clickSelect?: boolean;
  modifierSelect?: boolean;
  onClickEntity?: (id: EntityId) => void;
  clickThresholdPx?: number;
  wheelZoomFactor?: number;
  pinchZoomFactor?: number;

  // SVG element
  className?: string;
  style?: CSSProperties;
}

export const FloormapCanvas = memo(function FloormapCanvas({
  core,
  drawEntity,
  grid = false,
  selectionOverlay = DEFAULT_SELECTION_OVERLAY,
  enableWheel = true,
  enablePanDrag = true,
  enableEntityDrag = true,
  dragButton = 0,
  clickSelect = true,
  modifierSelect = true,
  onClickEntity,
  clickThresholdPx = 3,
  wheelZoomFactor = 0.0015,
  pinchZoomFactor = 0.005,
  className,
  style,
}: FloormapCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const viewportGRef = useRef<SVGGElement>(null);

  // Stable ref for onClickEntity so it doesn't cause handler re-attachment
  const onClickEntityRef = useRef(onClickEntity);
  onClickEntityRef.current = onClickEntity;

  useViewportTransform(core, viewportGRef);

  const entities = useEntities(core);
  const selection = useSelection(core);

  // Attach interaction handlers
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    return attachHandlers(svg, core, {
      enableWheel,
      enablePanDrag,
      enableEntityDrag,
      wheelZoomFactor,
      dragButton,
      clickSelect,
      clickThresholdPx,
      modifierSelect,
      pinchZoomFactor,
      onClickEntity: (id) => onClickEntityRef.current?.(id),
    });
  }, [
    core,
    enableWheel,
    enablePanDrag,
    enableEntityDrag,
    wheelZoomFactor,
    dragButton,
    clickSelect,
    clickThresholdPx,
    modifierSelect,
    pinchZoomFactor,
  ]);

  // Keep viewport.screenSize in sync with the SVG element dimensions
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const obs = new ResizeObserver(() => {
      core.viewport.screenSize = { width: svg.clientWidth, height: svg.clientHeight };
      core.emit('viewport:change', { viewport: { ...core.viewport } });
    });
    obs.observe(svg);
    return () => obs.disconnect();
  }, [core]);

  const entitiesByLayer = useMemo(() => {
    const map = new Map<LayerId, Entity[]>();
    for (const entity of entities) {
      const bucket = map.get(entity.layer);
      if (bucket) bucket.push(entity);
      else map.set(entity.layer, [entity]);
    }
    return map;
  }, [entities]);

  return (
    <svg ref={svgRef} className={className} style={{ display: 'block', touchAction: 'none', ...style }}>
      <g data-fm="viewport" ref={viewportGRef}>
        {grid !== false && <GridLayer core={core} options={grid} />}
        <g data-fm="objects">
          {core.scene.layers.map((layerId) => (
            <g key={String(layerId)} data-fm-layer={String(layerId)}>
              {(entitiesByLayer.get(layerId) ?? []).map((entity) => (
                <g key={entity.id}>
                  {drawEntity(entity, { selected: selection.has(entity.id) })}
                </g>
              ))}
            </g>
          ))}
        </g>
        {selectionOverlay !== false && (
          <SelectionOverlay entities={entities} selection={selection} style={selectionOverlay} />
        )}
      </g>
    </svg>
  );
});
