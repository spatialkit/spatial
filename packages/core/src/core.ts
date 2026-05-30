import { EventBus } from "./events";
import { hitTestPoint } from "./picking";
import { applySelection } from "./selection";
import { addEntity, getEntity, removeEntity, sceneBounds, updateEntity } from "./store";
import type { Bounds, Entity, EntityId, Scene, SelectionMode, Vec2, Viewport } from "./types";
import { fitToBounds, panBy, screenToWorld, setZoomAt, worldToScreen } from "./viewport";

export interface FloormapCore {
  scene: Scene;
  viewport: Viewport;
  selection: Set<EntityId>;

  // Coords
  worldToScreen(pan: Vec2): Vec2;
  screenToWorld(pan: Vec2): Vec2;

  // Viewport controls
  zoomAt(screenPoint: Vec2, delta: number): void;
  panBy(deltaScreen: Vec2): void;
  fitToBounds(bounds: Bounds, padding?: number): void;
  fitToScene(padding?: number): void;
  centerOn(id: EntityId, padding?: number): void;

  // Entity controls
  add(entity: Entity): void;
  update(id: EntityId, patch: Partial<Entity>): void;
  updateMany(patches: { id: EntityId; patch: Partial<Entity> }[]): void;
  remove(id: EntityId): void;

  // Selection controls
  setSelection(ids: EntityId[], mode: SelectionMode): void;

  // Picking
  hitTest(pointWorld: Vec2): EntityId | null;

  // Events
  on<T = any>(event: string, handler: (payload: T) => void): () => void;
  emit<T = any>(event: string, payload: T): void;
}

type CreateCoreProps = {
  scene: Scene;
  viewport: Viewport;
};

export function createCore(props: CreateCoreProps): FloormapCore {
  const bus = new EventBus();
  const selection = new Set<EntityId>();
  const scene = props.scene;
  const viewport = { ...props.viewport };

  const api: FloormapCore = {
    scene,
    viewport,
    selection,
    worldToScreen: (pan) => worldToScreen(viewport, pan),
    screenToWorld: (pan) => screenToWorld(viewport, pan),
    zoomAt: (screenPoint, delta) => {
      setZoomAt(viewport, screenPoint, delta);
      bus.emit("viewport:change", { viewport: { ...viewport } });
    },
    panBy: (deltaScreen) => {
      panBy(viewport, deltaScreen);
      bus.emit("viewport:change", { viewport: { ...viewport } });
    },
    fitToBounds: (bounds, padding = 0) => {
      fitToBounds(viewport, bounds, padding);
      bus.emit("viewport:change", { viewport: { ...viewport } });
    },
    fitToScene: (padding = 0) => {
      api.fitToBounds(sceneBounds(scene), padding);
    },
    centerOn: (id, padding = 0) => {
      const entity = getEntity(scene, id);

      if (!entity) {
        return;
      }

      fitToBounds(viewport, entity.bounds, padding);
      bus.emit("viewport:change", { viewport: { ...viewport } });
    },
    add: (entity) => {
      addEntity(scene, entity);
      bus.emit("entities:changed", { type: "add", ids: [entity.id] });
    },
    update: (id, patch) => {
      updateEntity(scene, id, patch);
      bus.emit("entities:changed", { type: "update", ids: [id] });
    },
    updateMany: (patches) => {
      const ids: EntityId[] = [];
      for (const { id, patch } of patches) {
        updateEntity(scene, id, patch);
        ids.push(id);
      }
      if (ids.length > 0) bus.emit("entities:changed", { type: "update", ids });
    },
    remove: (id) => {
      removeEntity(scene, id);

      if (selection.delete(id)) {
        bus.emit("selection:change", { selection: Array.from(selection) });
      }

      bus.emit("entities:changed", { type: "remove", ids: [id] });
    },
    setSelection: (ids, mode) => {
      const next = applySelection(selection, ids, mode);
      selection.clear();
      next.forEach(id => selection.add(id));
      bus.emit("selection:change", { selection: Array.from(selection) });
    },
    hitTest: (pointWorld) => hitTestPoint(scene, pointWorld),
    on: (event, handler) => bus.on(event, handler),
    emit: (event, payload) => bus.emit(event, payload),
  };

  return api;
}