import { describe, it, expect, vi } from 'vitest';
import { hitTestPoint } from '../picking';
import type { Scene, Vec2, EntityId, LayerId } from '../types';
import * as utils from '../utils';

vi.mock('./utils', () => ({
  containsPointAABB: vi.fn(),
}));

describe('hitTestPoint', () => {
  const mockPoint: Vec2 = { x: 10, y: 20 };

  it('should return null when scene has no entities', () => {
    const scene: Scene = {
      layers: ['layer1' as LayerId],
      entities: new Map(),
      size: { width: 100, height: 100 },
    };

    const result = hitTestPoint(scene, mockPoint);

    expect(result).toBeNull();
  });

  it('should return null when no entity is hit', () => {
    const scene: Scene = {
      layers: ['layer1' as LayerId],
      entities: new Map([
        [
          'entity1' as EntityId,
          {
            id: 'entity1' as EntityId,
            layer: 'layer1' as LayerId,
            selectable: true,
            bounds: { min: { x: 0, y: 0 }, max: { x: 5, y: 5 } },
          },
        ],
      ]),
    };

    vi.mocked(utils.containsPointAABB).mockReturnValue(false);

    const result = hitTestPoint(scene, mockPoint);

    expect(result).toBeNull();
  });

  it('should return entity id when hit', () => {
    const scene: Scene = {
      layers: ['layer1' as LayerId],
      entities: new Map([
        [
          'entity1' as EntityId,
          {
            id: 'entity1' as EntityId,
            layer: 'layer1',
            selectable: true,
            bounds: { min: { x: 0, y: 0 }, max: { x: 50, y: 50 } },
          },
        ],
      ]),
    };

    vi.mocked(utils.containsPointAABB).mockReturnValue(true);

    const result = hitTestPoint(scene, mockPoint);

    expect(result).toBe('entity1');
  });

  it('should skip non-selectable entities', () => {
    const scene: Scene = {
      layers: ['layer1' as LayerId],
      entities: new Map([
        [
          'entity1' as EntityId,
          {
            id: 'entity1' as EntityId,
            layer: 'layer1',
            selectable: false,
            bounds: { min: { x: 0, y: 0 }, max: { x: 50, y: 50 } },
          },
        ],
      ]),
    };

    vi.mocked(utils.containsPointAABB).mockReturnValue(true);

    const result = hitTestPoint(scene, mockPoint);

    expect(result).toBeNull();
  });

  it('should return topmost layer entity when multiple entities are hit', () => {
    const scene: Scene = {
      layers: ['layer1' as LayerId, 'layer2' as LayerId],
      entities: new Map([
        [
          'entity1' as EntityId,
          {
            id: 'entity1' as EntityId,
            layer: 'layer1',
            selectable: true,
            bounds: { min: { x: 0, y: 0 }, max: { x: 50, y: 50 } },
          },
        ],
        [
          'entity2' as EntityId,
          {
            id: 'entity2' as EntityId,
            layer: 'layer2',
            selectable: true,
            bounds: { min: { x: 0, y: 0 }, max: { x: 50, y: 50 } },
          },
        ],
      ]),
    };

    vi.mocked(utils.containsPointAABB).mockReturnValue(true);

    const result = hitTestPoint(scene, mockPoint);

    expect(result).toBe('entity2');
  });

  it('should return last entity in layer when multiple entities in same layer are hit', () => {
    const scene: Scene = {
      layers: ['layer1' as LayerId],
      entities: new Map([
        [
          'entity1' as EntityId,
          {
            id: 'entity1' as EntityId,
            layer: 'layer1',
            selectable: true,
            bounds: { min: { x: 0, y: 0 }, max: { x: 50, y: 50 } },
          },
        ],
        [
          'entity2' as EntityId,
          {
            id: 'entity2' as EntityId,
            layer: 'layer1',
            selectable: true,
            bounds: { min: { x: 0, y: 0 }, max: { x: 50, y: 50 } },
          },
        ],
      ]),
    };

    vi.mocked(utils.containsPointAABB).mockReturnValue(true);

    const result = hitTestPoint(scene, mockPoint);

    expect(result).toBe('entity2');
  });
});
