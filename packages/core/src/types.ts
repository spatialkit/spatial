export type Vec2 = {x: number; y: number};
export type Bounds = {x: number; y: number; width: number; height: number};

export type EntityId = string & {__brand: 'EntityId'};
export type LayerId = string & {__brand: 'LayerId'};

export interface Entity {
  id: EntityId;
  layer: LayerId;
  bounds: Bounds;
  data?: unknown;
  selectable?: boolean;
};

export interface Scene {
  size: {width: number; height: number};
  layers: LayerId[];
  entities: Map<EntityId, Entity>;
}

export interface Viewport {
  zoom: number;
  pan: Vec2;
  screenSize: {width: number; height: number};
  minZoom?: number;
  maxZoom?: number;
}

export type SelectionMode = 'replace' | 'add' | 'toggle';