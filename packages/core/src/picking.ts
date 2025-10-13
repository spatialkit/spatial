import type { EntityId, Scene, Vec2 } from "./types";
import { containsPointAABB } from "./utils";

export function hitTestPoint(scene: Scene, pointWorld: Vec2): EntityId | null {
  const byLayer = new Map(scene.layers.map((layer) => [layer, [] as string[]]));

  for (const entity of scene.entities.values()) {
    byLayer.get(entity.layer)?.push(entity.id);
  }

  for (let li = scene.layers.length - 1; li >= 0; li--) {
    const layerId = scene.layers[li];
    const list = byLayer.get(layerId) || [];

    for (let i = list.length - 1; i >= 0; i--) {
      const id = list[i] as EntityId;
      const ent = scene.entities.get(id);

      if (ent?.selectable && containsPointAABB(ent.bounds, pointWorld)) {
        return id
      }
    }
  }

  return null;
}