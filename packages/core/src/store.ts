import type { Bounds, Entity, EntityId, LayerId, Scene } from "./types";

export function createEmptyScene(size: {width: number; height: number}, layers: LayerId[]): Scene {
  return {
    size,
    layers,
    entities: new Map(),
  };
}

export function addEntity(scene: Scene, entity: Entity) {
  scene.entities.set(entity.id, entity);
}

export function updateEntity(scene: Scene, id: EntityId, patch: Partial<Entity>) {
  const current = scene.entities.get(id);

  if (!current) {
    return;
  }

  scene.entities.set(id, {...current, ...patch, id: current.id});
}

export function removeEntity(scene: Scene, id: EntityId) {
  scene.entities.delete(id);
}

export function getEntity(scene: Scene, id: EntityId): Entity | null {
  return scene.entities.get(id) || null;
};

export function allEntities(scene: Scene): Entity[] {
  return Array.from(scene.entities.values());
}

export function sceneBounds(scene: Scene): Bounds {
  const arr = allEntities(scene);

  if (arr.length === 0) {
    return {
      x: 0,
      y: 0,
      width: scene.size.width,
      height: scene.size.height,
    }
  }

  let x1 = Infinity
  let y1 = Infinity
  let x2 = -Infinity
  let y2 = -Infinity;

  for (const e of arr) {
    x1 = Math.min(x1, e.bounds.x);
    y1 = Math.min(y1, e.bounds.y);
    x2 = Math.max(x2, e.bounds.x + e.bounds.width);
    y2 = Math.max(y2, e.bounds.y + e.bounds.height);
  }

  return {
    x: x1,
    y: y1,
    width: x2 - x1,
    height: y2 - y1,
  }
}