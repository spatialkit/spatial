import { memo } from 'react';
import type { Entity, EntityId } from '@floormap-tools/core';

export type ResizeHandleStyle = {
  size?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
};

interface ResizeHandlesProps {
  entities: Entity[];
  selection: ReadonlySet<EntityId>;
  zoom: number;
  style?: ResizeHandleStyle;
}

const DIRECTIONS = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const;
type Dir = typeof DIRECTIONS[number];

function handleCenter(bounds: Entity['bounds'], dir: Dir) {
  const { x, y, width: w, height: h } = bounds;
  switch (dir) {
    case 'nw': return { x,          y          };
    case 'n':  return { x: x + w/2, y          };
    case 'ne': return { x: x + w,   y          };
    case 'e':  return { x: x + w,   y: y + h/2 };
    case 'se': return { x: x + w,   y: y + h   };
    case 's':  return { x: x + w/2, y: y + h   };
    case 'sw': return { x,          y: y + h   };
    case 'w':  return { x,          y: y + h/2 };
  }
}

export const ResizeHandles = memo(function ResizeHandles({
  entities,
  selection,
  zoom,
  style = {},
}: ResizeHandlesProps) {
  const { size = 8, fill = '#fff', stroke = '#2563eb', strokeWidth = 1.5 } = style;
  const halfWorld = size / zoom / 2;

  const selected = entities.filter((e) => selection.has(e.id));
  if (selected.length === 0) return null;

  return (
    <g data-fm="overlays">
      {selected.flatMap((entity) =>
        DIRECTIONS.map((dir) => {
          const center = handleCenter(entity.bounds, dir);
          return (
            <rect
              key={`${entity.id}-${dir}`}
              x={center.x - halfWorld}
              y={center.y - halfWorld}
              width={halfWorld * 2}
              height={halfWorld * 2}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
          );
        })
      )}
    </g>
  );
});
