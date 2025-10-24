import { describe, it, expect } from 'vitest';
import { hitTestPoint } from '../picking';
import type { Scene, Vec2, EntityId, LayerId } from '../types';

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
      size: { width: 100, height: 100 },
      entities: new Map([
        [
          'entity1' as EntityId,
          {
            id: 'entity1' as EntityId,
            layer: 'layer1' as LayerId,
            selectable: true,
            bounds: { x: 2, y: 3, width: 2, height: 2 },
          },
        ],
      ]),
    };

    const result = hitTestPoint(scene, mockPoint);

    expect(result).toBeNull();
  });

  it('should return entity id when hit', () => {
    const scene: Scene = {
      layers: ['layer1' as LayerId],
      size: { width: 100, height: 100 },
      entities: new Map([
        [
          'entity1' as EntityId,
          {
            id: 'entity1' as EntityId,
            layer: 'layer1' as LayerId,
            selectable: true,
            bounds: { x: 10, y: 20, width: 2, height: 2 },
          },
        ],
      ]),
    };

    const result = hitTestPoint(scene, mockPoint);

    expect(result).toBe('entity1');
  });

  it('should skip non-selectable entities', () => {
    const scene: Scene = {
      layers: ['layer1' as LayerId],
      size: { width: 100, height: 100 },
      entities: new Map([
        [
          'entity1' as EntityId,
          {
            id: 'entity1' as EntityId,
            layer: 'layer1' as LayerId,
            selectable: false,
            bounds: { x: 10, y: 20, width: 2, height: 2 },
          },
        ],
      ]),
    };

    const result = hitTestPoint(scene, mockPoint);

    expect(result).toBeNull();
  });

  it('should return topmost layer entity when multiple entities are hit', () => {
    const scene: Scene = {
      layers: ['layer1' as LayerId, 'layer2' as LayerId],
      size: { width: 100, height: 100 },
      entities: new Map([
        [
          'entity1' as EntityId,
          {
            id: 'entity1' as EntityId,
            layer: 'layer1' as LayerId,
            selectable: true,
            bounds: { x: 10, y: 20, width: 2, height: 2 },
          },
        ],
        [
          'entity2' as EntityId,
          {
            id: 'entity2' as EntityId,
            layer: 'layer2' as LayerId,
            selectable: true,
            bounds: { x: 10, y: 20, width: 2, height: 2 },
          },
        ],
      ]),
    };

    const result = hitTestPoint(scene, mockPoint);

    expect(result).toBe('entity2');
  });

  it('should return last entity in layer when multiple entities in same layer are hit', () => {
    const scene: Scene = {
      layers: ['layer1' as LayerId],
      size: { width: 100, height: 100 },
      entities: new Map([
        [
          'entity1' as EntityId,
          {
            id: 'entity1' as EntityId,
            layer: 'layer1' as LayerId,
            selectable: true,
            bounds: { x: 10, y: 20, width: 2, height: 2 },
          },
        ],
        [
          'entity2' as EntityId,
          {
            id: 'entity2' as EntityId,
            layer: 'layer1' as LayerId,
            selectable: true,
            bounds: { x: 10, y: 20, width: 2, height: 2 },
          },
        ],
      ]),
    };

    const result = hitTestPoint(scene, mockPoint);

    expect(result).toBe('entity2');
  });
});
