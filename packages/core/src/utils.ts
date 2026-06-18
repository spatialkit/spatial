import { Bounds, Entity, EntityId, ResizeDirection, Vec2 } from './types';

export const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, value));
};

export const containsPointAABB = (bounds: Bounds, point: Vec2) => {
  return point.x >= bounds.x && point.x <= bounds.x + bounds.width && point.y >= bounds.y && point.y <= bounds.y + bounds.height;
};

export const expandBounds = (bounds: Bounds, padding: number): Bounds => {
  return {
    x: bounds.x - padding,
    y: bounds.y - padding,
    width: bounds.width + padding * 2,
    height: bounds.height + padding * 2
  }
};

export const unionBounds = (a: Bounds, b: Bounds): Bounds => {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.max(a.x + a.width, b.x + b.width) - Math.min(a.x, b.x),
    height: Math.max(a.y + a.height, b.y + b.height) - Math.min(a.y, b.y)
  }
};

export const snapToGrid = (value: number, gridSize: number): number =>
  Math.round(value / gridSize) * gridSize;

const DIRECTIONS: ResizeDirection[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

function handleCenter(bounds: Bounds, dir: ResizeDirection): Vec2 {
  const { x, y, width: w, height: h } = bounds;
  switch (dir) {
    case 'nw': return { x,           y           };
    case 'n':  return { x: x + w/2,  y           };
    case 'ne': return { x: x + w,    y           };
    case 'e':  return { x: x + w,    y: y + h/2  };
    case 'se': return { x: x + w,    y: y + h    };
    case 's':  return { x: x + w/2,  y: y + h    };
    case 'sw': return { x,           y: y + h    };
    case 'w':  return { x,           y: y + h/2  };
  }
}

export function hitTestResizeHandles(
  selectedEntities: Entity[],
  worldToScreen: (p: Vec2) => Vec2,
  screenPoint: Vec2,
  handleSizePx = 8,
): { entityId: EntityId; direction: ResizeDirection } | null {
  const half = handleSizePx / 2;
  for (const entity of selectedEntities) {
    for (const dir of DIRECTIONS) {
      const sc = worldToScreen(handleCenter(entity.bounds, dir));
      const dx = screenPoint.x - sc.x;
      const dy = screenPoint.y - sc.y;
      if (Math.abs(dx) <= half && Math.abs(dy) <= half) {
        return { entityId: entity.id, direction: dir };
      }
    }
  }
  return null;
}

export function applyResizeDelta(
  original: Bounds,
  direction: ResizeDirection,
  worldDelta: Vec2,
  snapSize?: number,
): Bounds {
  const snap = snapSize ? (v: number) => snapToGrid(v, snapSize) : (v: number) => v;
  let { x, y, width, height } = original;

  if (direction.includes('w')) {
    const newX = snap(x + worldDelta.x);
    width = width - (newX - x);
    x = newX;
  }
  if (direction.includes('e')) {
    const newRight = snap(x + width + worldDelta.x);
    width = newRight - x;
  }
  if (direction.includes('n')) {
    const newY = snap(y + worldDelta.y);
    height = height - (newY - y);
    y = newY;
  }
  if (direction.includes('s')) {
    const newBottom = snap(y + height + worldDelta.y);
    height = newBottom - y;
  }

  return { x, y, width: Math.max(1, width), height: Math.max(1, height) };
}