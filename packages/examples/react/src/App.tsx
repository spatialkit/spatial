import { useCallback, useEffect, useRef, useState } from 'react';
import { SpatialCanvas, useSpatialCore, useSelection, useViewport } from '@spatial-kit/react';
import { addEntity, createEmptyScene, hitTestResizeHandles } from '@spatial-kit/core';
import type { Entity, EntityId, LayerId } from '@spatial-kit/core';

// ── Types ──────────────────────────────────────────────────────────────────────

type RoomData = { kind: 'room'; name: string; fill: string };
type DeskData = { kind: 'desk'; label: string };
type EntityData = RoomData | DeskData;

// ── Layers ─────────────────────────────────────────────────────────────────────

const L = {
  rooms: 'rooms' as LayerId,
  desks: 'desks' as LayerId,
};

// ── Initial scene (populated once, outside component) ─────────────────────────

const ROOMS: { id: string; name: string; x: number; y: number; w: number; h: number; fill: string }[] = [
  { id: 'reception',  name: 'Reception',      x: 40,  y: 40,  w: 200, h: 120, fill: '#dbeafe' },
  { id: 'meeting-a',  name: 'Meeting Room A', x: 300, y: 40,  w: 180, h: 120, fill: '#dcfce7' },
  { id: 'meeting-b',  name: 'Meeting Room B', x: 300, y: 220, w: 180, h: 120, fill: '#dcfce7' },
  { id: 'open-space', name: 'Open Space',     x: 40,  y: 220, w: 200, h: 220, fill: '#fef9c3' },
  { id: 'kitchen',    name: 'Kitchen',        x: 300, y: 400, w: 180, h: 100, fill: '#fce7f3' },
  { id: 'corridor',   name: 'Corridor',       x: 240, y: 40,  w: 60,  h: 460, fill: '#f1f5f9' },
];

const DESK_GRID = { cols: 2, rows: 4, startX: 60, startY: 240, stepX: 80, stepY: 50, w: 60, h: 36 };

const initialScene = (() => {
  const scene = createEmptyScene({ width: 700, height: 560 }, [L.rooms, L.desks]);
  for (const r of ROOMS) {
    addEntity(scene, {
      id: r.id as EntityId,
      layer: L.rooms,
      bounds: { x: r.x, y: r.y, width: r.w, height: r.h },
      selectable: true,
      data: { kind: 'room', name: r.name, fill: r.fill } satisfies RoomData,
    });
  }
  for (let row = 0; row < DESK_GRID.rows; row++) {
    for (let col = 0; col < DESK_GRID.cols; col++) {
      const n = row * DESK_GRID.cols + col + 1;
      addEntity(scene, {
        id: `desk-${n}` as EntityId,
        layer: L.desks,
        bounds: {
          x: DESK_GRID.startX + col * DESK_GRID.stepX,
          y: DESK_GRID.startY + row * DESK_GRID.stepY,
          width: DESK_GRID.w,
          height: DESK_GRID.h,
        },
        selectable: true,
        data: { kind: 'desk', label: `Desk ${n}` } satisfies DeskData,
      });
    }
  }
  return scene;
})();

// ── Entity components ──────────────────────────────────────────────────────────

function RoomShape({ entity, selected }: { entity: Entity; selected: boolean }) {
  const data = entity.data as RoomData;
  const { x, y, width, height } = entity.bounds;
  return (
    <>
      <rect
        x={x} y={y} width={width} height={height}
        fill={selected ? '#bfdbfe' : data.fill}
        stroke="#cbd5e1" strokeWidth={1.5} rx={4}
      />
      <text
        x={x + width / 2} y={y + height / 2}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={12} fontFamily="system-ui, sans-serif"
        fill="#475569" pointerEvents="none"
      >
        {data.name}
      </text>
    </>
  );
}

function DeskShape({ entity, selected }: { entity: Entity; selected: boolean }) {
  const data = entity.data as DeskData;
  const { x, y, width, height } = entity.bounds;
  return (
    <>
      <rect
        x={x} y={y} width={width} height={height}
        fill={selected ? '#bfdbfe' : '#e2e8f0'}
        stroke="#94a3b8" strokeWidth={1} rx={3}
      />
      <text
        x={x + width / 2} y={y + height / 2}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={10} fontFamily="system-ui, sans-serif"
        fill="#64748b" pointerEvents="none"
      >
        {data.label}
      </text>
    </>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────

export function App() {
  const core = useSpatialCore(() => ({
    scene: initialScene,
    viewport: { zoom: 1, pan: { x: 0, y: 0 }, screenSize: { width: 800, height: 600 } },
  }));

  const selection = useSelection(core);
  const viewport = useViewport(core);
  const deskCounterRef = useRef(DESK_GRID.cols * DESK_GRID.rows + 1);

  const [snapEnabled, setSnapEnabled] = useState(false);
  const [snapSize, setSnapSize] = useState(40);
  const [hoverCursor, setHoverCursor] = useState('');

  const RESIZE_CURSORS: Record<string, string> = {
    n: 'ns-resize', s: 'ns-resize',
    e: 'ew-resize', w: 'ew-resize',
    ne: 'nesw-resize', sw: 'nesw-resize',
    nw: 'nwse-resize', se: 'nwse-resize',
  };

  function handleCanvasPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.buttons !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const screen = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const selectedEntities = [...core.selection]
      .map((id) => core.scene.entities.get(id))
      .filter((en): en is NonNullable<typeof en> => en != null);
    const handleHit = hitTestResizeHandles(selectedEntities, (p) => core.worldToScreen(p), screen);
    if (handleHit) {
      setHoverCursor(RESIZE_CURSORS[handleHit.direction]);
    } else {
      setHoverCursor(core.hitTest(core.screenToWorld(screen)) ? 'grab' : '');
    }
  }

  useEffect(() => {
    core.fitToScene(48);
  }, [core]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        for (const id of [...core.selection]) core.remove(id);
      }
      if (e.key === 'Escape') core.setSelection([], 'replace');
      if (e.key === 'f' || e.key === 'F') core.fitToScene(48);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [core]);

  const drawEntity = useCallback((entity: Entity, { selected }: { selected: boolean }) => {
    const data = entity.data as EntityData;
    if (data.kind === 'room') return <RoomShape entity={entity} selected={selected} />;
    if (data.kind === 'desk') return <DeskShape entity={entity} selected={selected} />;
    return null;
  }, []);

  function addDesk() {
    const n = deskCounterRef.current++;
    const col = (n - 1) % DESK_GRID.cols;
    const row = Math.floor((n - 1) / DESK_GRID.cols) % 6;
    core.add({
      id: `desk-${n}` as EntityId,
      layer: L.desks,
      bounds: {
        x: DESK_GRID.startX + col * DESK_GRID.stepX,
        y: DESK_GRID.startY + row * DESK_GRID.stepY,
        width: DESK_GRID.w,
        height: DESK_GRID.h,
      },
      selectable: true,
      data: { kind: 'desk', label: `Desk ${n}` } satisfies DeskData,
    });
  }

  const selectedEntities = [...selection].map((id) => core.scene.entities.get(id)).filter(Boolean) as Entity[];

  return (
    <div id="app">
      <header id="toolbar">
        <span className="logo">Spatial</span>
        <span className="example-name">Office Floor Plan — React</span>
        <div className="controls">
          <button onClick={() => core.fitToScene(48)}>Fit to scene</button>
          <button onClick={addDesk}>Add desk</button>
          <button onClick={() => { for (const id of [...selection]) core.remove(id); }}>
            Delete selected
          </button>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={snapEnabled}
              onChange={(e) => setSnapEnabled(e.target.checked)}
            />
            Snap to grid
          </label>
          {snapEnabled && (
            <input
              type="number"
              value={snapSize}
              min={5}
              max={200}
              step={5}
              title="Grid size in world units"
              onChange={(e) => setSnapSize(Math.max(5, Number(e.target.value)))}
              style={{ width: 52, fontSize: 13 }}
            />
          )}
        </div>
        <div id="zoom-display">{Math.round(viewport.zoom * 100)}%</div>
      </header>

      <div id="main">
        <div
          style={{ flex: 1, display: 'flex', cursor: hoverCursor }}
          onPointerMove={handleCanvasPointerMove}
          onPointerLeave={() => setHoverCursor('')}
        >
          <SpatialCanvas
            core={core}
            drawEntity={drawEntity}
            grid={{ size: snapEnabled ? snapSize : 40, stroke: '#f1f5f9', strokeWidth: 1 }}
            selectionOverlay={false}
            snapToGrid={snapEnabled ? snapSize : undefined}
            style={{ flex: 1 }}
          />
        </div>

        <aside id="panel">
          <div className="panel-section">
            <div className="panel-label">Selection</div>
            <div id="selection-info">
              {selectedEntities.length === 0 ? (
                <>
                  <p className="hint">Click an entity to select it.</p>
                  <p className="hint">Shift+click to add, Ctrl/⌘+click to toggle.</p>
                  <p className="hint">Drag a selected entity to move it.</p>
                  <p className="hint">Drag a handle to resize it.</p>
                </>
              ) : (
                selectedEntities.map((entity) => {
                  const data = entity.data as EntityData;
                  const { x, y, width, height } = entity.bounds;
                  const name = data.kind === 'room' ? data.name : data.label;
                  return (
                    <div key={entity.id} className="entity-card">
                      <div className="card-id">{entity.id}</div>
                      <span className={`card-badge ${data.kind}`}>{data.kind}</span>
                      <div className="card-name">{name}</div>
                      <div className="card-bounds">
                        {width}×{height} at ({Math.round(x)}, {Math.round(y)})
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-label">Layers</div>
            <div className="layer-list">
              <div className="layer-row">
                <span className="layer-dot" style={{ background: '#93c5fd' }} />
                <span>rooms</span>
              </div>
              <div className="layer-row">
                <span className="layer-dot" style={{ background: '#6ee7b7' }} />
                <span>desks</span>
              </div>
            </div>
          </div>

          <div className="panel-section panel-section--keyboard">
            <div className="panel-label">Keyboard</div>
            <div className="shortcuts">
              <div className="shortcut"><kbd>Scroll</kbd> Zoom</div>
              <div className="shortcut"><kbd>Drag</kbd> Pan / Move</div>
              <div className="shortcut"><kbd>Shift</kbd>+click Add</div>
              <div className="shortcut"><kbd>Ctrl</kbd>/<kbd>⌘</kbd>+click Toggle</div>
              <div className="shortcut"><kbd>Del</kbd> Delete</div>
              <div className="shortcut"><kbd>Esc</kbd> Deselect</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
