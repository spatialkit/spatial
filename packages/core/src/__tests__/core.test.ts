import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCore } from "../core";
import type { Scene, Viewport, Entity, EntityId, LayerId } from "../types";

describe("createCore", () => {
  let scene: Scene;
  let viewport: Viewport;

  beforeEach(() => {
    scene = {
      size: { width: 1000, height: 1000 },
      layers: [],
      entities: new Map(),
    };
    viewport = {
      zoom: 1,
      pan: {
        x: 0,
        y: 0,
      },
      screenSize: {
        width: 800,
        height: 600,
      }
    };
  });

  it("should create a core instance with initial state", () => {
    const core = createCore({ scene, viewport });

    expect(core.scene).toBe(scene);
    expect(core.viewport).toEqual(viewport);
    expect(core.selection).toBeInstanceOf(Set);
    expect(core.selection.size).toBe(0);
  });

  describe("entity operations", () => {
    it("should add an entity and emit event", () => {
      const core = createCore({ scene, viewport });
      const handler = vi.fn();
      core.on("entities:changed", handler);

      const entity: Entity = {
        id: "entity-1" as EntityId,
        layer: "layer-1" as LayerId,
        bounds: { x: 0, y: 0, width: 100, height: 100 },
      };

      core.add(entity);

      expect(scene.entities.get("entity-1" as EntityId)).toBe(entity);
      expect(handler).toHaveBeenCalledWith({ type: "add", ids: ["entity-1"] });
    });

    it("should update an entity and emit event", () => {
      const core = createCore({ scene, viewport });
      const entity: Entity = {
        id: "entity-1" as EntityId,
        layer: "layer-1" as LayerId,
        bounds: { x: 0, y: 0, width: 100, height: 100 },
      };
      core.add(entity);

      const handler = vi.fn();
      core.on("entities:changed", handler);

      core.update("entity-1" as EntityId, { bounds: { x: 10, y: 10, width: 100, height: 100 } });

      expect(handler).toHaveBeenCalledWith({ type: "update", ids: ["entity-1"] });
    });

    it("should remove an entity and emit event", () => {
      const core = createCore({ scene, viewport });
      const entity: Entity = {
        id: "entity-1" as EntityId,
        layer: "layer-1" as LayerId,
        bounds: { x: 0, y: 0, width: 100, height: 100 },
      };
      core.add(entity);

      const handler = vi.fn();
      core.on("entities:changed", handler);

      core.remove("entity-1" as EntityId);

      expect(scene.entities.has("entity-1" as EntityId)).toBe(false);
      expect(handler).toHaveBeenCalledWith({ type: "remove", ids: ["entity-1"] });
    });

    it("should remove entity from selection when removed", () => {
      const core = createCore({ scene, viewport });
      const entity: Entity = {
        id: "entity-1" as EntityId,
        layer: "layer-1" as LayerId,
        bounds: { x: 0, y: 0, width: 100, height: 100 },
      };
      core.add(entity);
      core.setSelection(["entity-1" as EntityId], "replace");

      const selectionHandler = vi.fn();
      core.on("selection:change", selectionHandler);

      core.remove("entity-1" as EntityId);

      expect(core.selection.has("entity-1" as EntityId)).toBe(false);
      expect(selectionHandler).toHaveBeenCalledWith({ selection: [] });
    });
  });

  describe("selection operations", () => {
    it("should set selection and emit event", () => {
      const core = createCore({ scene, viewport });
      const handler = vi.fn();
      core.on("selection:change", handler);

      core.setSelection(["entity-1", "entity-2"] as EntityId[], "replace");

      expect(Array.from(core.selection)).toEqual(["entity-1", "entity-2"]);
      expect(handler).toHaveBeenCalledWith({ selection: ["entity-1", "entity-2"] });
    });
  });

  describe("viewport operations", () => {
    it("should zoom at a point and emit event", () => {
      const core = createCore({ scene, viewport });
      const handler = vi.fn();
      core.on("viewport:change", handler);

      core.zoomAt({ x: 400, y: 300 }, 0.1);

      expect(handler).toHaveBeenCalledWith({ viewport: expect.objectContaining({ zoom: expect.any(Number) }) });
    });

    it("should pan by delta and emit event", () => {
      const core = createCore({ scene, viewport });
      const handler = vi.fn();
      core.on("viewport:change", handler);

      core.panBy({ x: 10, y: 20 });

      expect(handler).toHaveBeenCalledWith({ viewport: expect.any(Object) });
    });

    it("should fit to bounds and emit event", () => {
      const core = createCore({ scene, viewport });
      const handler = vi.fn();
      core.on("viewport:change", handler);

      core.fitToBounds({ x: 0, y: 0, width: 200, height: 200 }, 10);

      expect(handler).toHaveBeenCalledWith({ viewport: expect.any(Object) });
    });

    it("should center on entity if it exists", () => {
      const core = createCore({ scene, viewport });
      const entity: Entity = {
        id: "entity-1" as EntityId,
        layer: "layer-1" as LayerId,
        bounds: { x: 100, y: 100, width: 50, height: 50 },
      };
      core.add(entity);

      const handler = vi.fn();
      core.on("viewport:change", handler);

      core.centerOn("entity-1" as EntityId, 20);

      expect(handler).toHaveBeenCalledWith({ viewport: expect.any(Object) });
    });

    it("should not emit event when centering on non-existent entity", () => {
      const core = createCore({ scene, viewport });
      const handler = vi.fn();
      core.on("viewport:change", handler);

      core.centerOn("non-existent" as EntityId, 20);

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("event bus", () => {
    it("should allow subscribing and unsubscribing from events", () => {
      const core = createCore({ scene, viewport });
      const handler = vi.fn();

      const unsubscribe = core.on("custom:event", handler);
      core.emit("custom:event", { data: "test" });

      expect(handler).toHaveBeenCalledWith({ data: "test" });

      handler.mockClear();
      unsubscribe();
      core.emit("custom:event", { data: "test2" });

      expect(handler).not.toHaveBeenCalled();
    });
  });
});