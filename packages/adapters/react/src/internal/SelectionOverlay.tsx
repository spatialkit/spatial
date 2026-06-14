import { memo } from 'react';
import type { Entity, EntityId } from '@floormap-tools/core';
import type { SelectionOverlayStyle } from '../types';

interface SelectionOverlayProps {
  entities: Entity[];
  selection: ReadonlySet<EntityId>;
  style: SelectionOverlayStyle;
}

export const SelectionOverlay = memo(function SelectionOverlay({
  entities,
  selection,
  style,
}: SelectionOverlayProps) {
  const { stroke = '#2563eb', strokeWidth = 2, padding = 4, fill = 'none' } = style;

  return (
    <g data-fm="selection">
      {entities
        .filter((e) => selection.has(e.id))
        .map((entity) => {
          const { x, y, width, height } = entity.bounds;
          return (
            <rect
              key={entity.id}
              x={x - padding}
              y={y - padding}
              width={width + padding * 2}
              height={height + padding * 2}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              pointerEvents="none"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
    </g>
  );
});
