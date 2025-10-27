import { describe, it, expect, beforeEach } from 'vitest';
import type { Scene, Entity, LayerId, EntityId } from '../types';
import {
  createEmptyScene,
  addEntity,
  updateEntity,
  removeEntity,
  getEntity,
  allEntities,
  sceneBounds,
} from '../store';

describe('store', () => {
  let scene: Scene;
  
  beforeEach(() => {
    scene = createEmptyScene({ width: 800, height: 600 }, ['layer1', 'layer2'] as LayerId[]);
  });
  
  describe('createEmptyScene', () => {
    it('should create an empty scene with the given size and layers', () => {
      expect(scene.size).toEqual({ width: 800, height: 600 });
      expect(scene.layers).toEqual(['layer1', 'layer2']);
      expect(scene.entities.size).toBe(0);
    });
  });
  
  describe('addEntity', () => {
    it('should add an entity to the scene', () => {
      const entity: Entity = {
        id: 'entity1' as EntityId,
        layer: 'layer1' as LayerId,
        bounds: { x: 10, y: 20, width: 50, height: 60 },
      };
      
      addEntity(scene, entity);
      
      expect(scene.entities.get('entity1' as EntityId)).toEqual(entity);
      expect(scene.entities.size).toBe(1);
    });
  });
  
  describe('updateEntity', () => {
    it('should update an existing entity', () => {
      const entity: Entity = {
        id: 'entity1' as EntityId,
        layer: 'layer1' as LayerId,
        bounds: { x: 10, y: 20, width: 50, height: 60 },
      };
      
      addEntity(scene, entity);
      updateEntity(scene, 'entity1' as EntityId, { bounds: { x: 30, y: 40, width: 50, height: 60 } });
      
      const updated = scene.entities.get('entity1' as EntityId);
      expect(updated?.bounds.x).toBe(30);
      expect(updated?.bounds.y).toBe(40);
    });
    
    it('should not update if entity does not exist', () => {
      updateEntity(scene, 'nonexistent' as EntityId, { layer: 'layer2' as LayerId });
      expect(scene.entities.size).toBe(0);
    });
    
    it('should preserve entity id when updating', () => {
      const entity: Entity = {
        id: 'entity1' as EntityId,
        layer: 'layer1' as LayerId,
        bounds: { x: 10, y: 20, width: 50, height: 60 },
      };
      
      addEntity(scene, entity);
      updateEntity(scene, 'entity1' as EntityId, { id: 'different-id' as any });
      
      expect(scene.entities.get('entity1' as EntityId)?.id).toBe('entity1');
    });
  });
  
  describe('removeEntity', () => {
    it('should remove an entity from the scene', () => {
      const entity: Entity = {
        id: 'entity1' as EntityId,
        layer: 'layer1' as LayerId,
        bounds: { x: 10, y: 20, width: 50, height: 60 },
      };
      
      addEntity(scene, entity);
      removeEntity(scene, 'entity1' as EntityId);
      
      expect(scene.entities.has('entity1' as EntityId)).toBe(false);
      expect(scene.entities.size).toBe(0);
    });
  });
  
  describe('getEntity', () => {
    it('should return an entity by id', () => {
      const entity: Entity = {
        id: 'entity1' as EntityId,
        layer: 'layer1' as LayerId,
        bounds: { x: 10, y: 20, width: 50, height: 60 },
      };
      
      addEntity(scene, entity);
      
      expect(getEntity(scene, 'entity1' as EntityId)).toEqual(entity);
    });
    
    it('should return null if entity does not exist', () => {
      expect(getEntity(scene, 'nonexistent' as EntityId)).toBeNull();
    });
  });
  
  describe('allEntities', () => {
    it('should return all entities as an array', () => {
      const entity1: Entity = {
        id: 'entity1' as EntityId,
        layer: 'layer1' as LayerId,
        bounds: { x: 10, y: 20, width: 50, height: 60 },
      };
      const entity2: Entity = {
        id: 'entity2' as EntityId,
        layer: 'layer2' as LayerId,
        bounds: { x: 100, y: 200, width: 150, height: 160 },
      };
      
      addEntity(scene, entity1);
      addEntity(scene, entity2);
      
      const entities = allEntities(scene);
      expect(entities).toHaveLength(2);
      expect(entities).toContainEqual(entity1);
      expect(entities).toContainEqual(entity2);
    });
    
    it('should return empty array if no entities', () => {
      expect(allEntities(scene)).toEqual([]);
    });
  });
  
  describe('sceneBounds', () => {
    it('should return scene size if no entities', () => {
      const bounds = sceneBounds(scene);
      expect(bounds).toEqual({ x: 0, y: 0, width: 800, height: 600 });
    });
    
    it('should calculate bounds for a single entity', () => {
      const entity: Entity = {
        id: 'entity1' as EntityId,
        layer: 'layer1' as LayerId,
        bounds: { x: 10, y: 20, width: 50, height: 60 },
      };
      
      addEntity(scene, entity);
      
      const bounds = sceneBounds(scene);
      expect(bounds).toEqual({ x: 10, y: 20, width: 50, height: 60 });
    });
    
    it('should calculate bounds for multiple entities', () => {
      const entity1: Entity = {
        id: 'entity1' as EntityId,
        layer: 'layer1' as LayerId,
        bounds: { x: 10, y: 20, width: 50, height: 60 },
      };
      const entity2: Entity = {
        id: 'entity2' as EntityId,
        layer: 'layer2' as LayerId,
        bounds: { x: 100, y: 50, width: 150, height: 100 },
      };
      
      addEntity(scene, entity1);
      addEntity(scene, entity2);
      
      const bounds = sceneBounds(scene);
      expect(bounds).toEqual({ x: 10, y: 20, width: 240, height: 130 });
    });
  });
});
