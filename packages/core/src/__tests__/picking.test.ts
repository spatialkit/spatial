import { describe, it, expect, vi } from 'vitest';
import { hitTestPoint } from '../picking';
import type { Scene, Vec2, EntityId } from '../types';
import * as utils from '../utils';

vi.mock('../utils', () => ({
  containsPointAABB: vi.fn(),
}));

describe('hitTestPoint', () => {
  it('should return null when scene has no entities', () => {
    const scene: Scene = {
      layers: ['layer1'],
      entities: new Map(),
    };
    const point: Vec2 = { x: 0, y: 0 };

    const result = hitTestPoint(scene, point);

    expect(result).toBeNull();
  });

  it('should return null when no entity contains the point', () => {
    vi.mocked(utils.containsPointAABB).mockReturnValue(false);

    const scene: Scene = {
      layers: ['layer1'],
      entities: new Map([
        [
          'entity1' as EntityId,
          {
            id: 'entity1' as EntityId,
            layer: 'layer1',
            selectable: true,
            bounds: { min: { x: 0, y: 0 }, max: { x: 10, y: 10 } },
          },
        ],
      ]),
    };
    const point: Vec2 = { x: 20, y: 20 };

    const result = hitTestPoint(scene, point);

    expect(result).toBeNull();
  });

  it('should return entity id when entity contains the point', () => {
    vi.mocked(utils.containsPointAABB).mockReturnValue(true);

    const scene: Scene = {
      layers: ['layer1'],
      entities: new Map([
        [
          'entity1' as EntityId,
          {
            id: 'entity1' as EntityId,
            layer: 'layer1',
            selectable: true,
            bounds: { min: { x: 0, y: 0 }, max: { x: 10, y: 10 } },
          },
        ],
      ]),
    };
    const point: Vec2 = { x: 5, y: 5 };

    const result = hitTestPoint(scene, point);

    expect(result).toBe('entity1');
  });

  it('should return null when entity is not selectable', () => {
    vi.mocked(utils.containsPointAABB).mockReturnValue(true);

    const scene: Scene = {
      layers: ['layer1'],
      entities: new Map([
        [
          'entity1' as EntityId,
          {
            id: 'entity1' as EntityId,
            layer: 'layer1',
            selectable: false,
            bounds: { min: { x: 0, y: 0 }, max: { x: 10, y: 10 } },
          },
        ],
      ]),
    };
    const point: Vec2 = { x: 5, y: 5 };

    const result = hitTestPoint(scene, point);

    expect(result).toBeNull();
  });

  it('should return top-most layer entity when multiple entities contain point', () => {
    vi.mocked(utils.containsPointAABB).mockReturnValue(true);

    const scene: Scene = {
      layers: ['layer1', 'layer2'],
      entities: new Map([
        [
          'entity1' as EntityId,
          {
            id: 'entity1' as EntityId,
            layer: 'layer1',
            selectable: true,
            bounds: { min: { x: 0, y: 0 }, max: { x: 10, y: 10 } },
          },
        ],
        [
          'entity2' as EntityId,
          {
            id: 'entity2' as EntityId,
            layer: 'layer2',
            selectable: true,
            bounds: { min: { x: 0, y: 0 }, max: { x: 10, y: 10 } },
          },
        ],
      ]),
    };
    const point: Vec2 = { x: 5, y: 5 };

    const result = hitTestPoint(scene, point);

    expect(result).toBe('entity2');
  });

  it('should return last entity in layer when multiple entities in same layer contain point', () => {
    vi.mocked(utils.containsPointAABB).mockReturnValue(true);

    const scene: Scene = {
      layers: ['layer1'],
      entities: new Map([
        [
          'entity1' as EntityId,
          {
            id: 'entity1' as EntityId,
            layer: 'layer1',
            selectable: true,
            bounds: { min: { x: 0, y: 0 }, max: { x: 10, y: 10 } },
          },
        ],
        [
          'entity2' as EntityId,
          {
            id: 'entity2' as EntityId,
            layer: 'layer1',
            selectable: true,
            bounds: { min: { x: 0, y: 0 }, max: { x: 10, y: 10 } },
          },
        ],
      ]),
    };
    const point: Vec2 = { x: 5, y: 5 };

    const result = hitTestPoint(scene, point);

    expect(result).toBe('entity2');
  });
});
