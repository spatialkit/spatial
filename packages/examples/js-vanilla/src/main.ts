import { createCore, createEmptyScene } from '@floormap/core';
import { mountSvgRenderer } from '@floormap/svg';
import type { EntityId, LayerId } from '@floormap/core';

// ── Types ─────────────────────────────────────────────────────────────────────

type RoomData = { kind: 'room'; name: string; fill: string };
type DeskData = { kind: 'desk'; label: string };
type EntityData = RoomData | DeskData;

// ── Layers ────────────────────────────────────────────────────────────────────

const L = {
  rooms: 'rooms' as LayerId,
  desks: 'desks' as LayerId,
};

// ── Scene ─────────────────────────────────────────────────────────────────────

const scene = createEmptyScene({ width: 700, height: 560 }, [L.rooms, L.desks]);

const svgEl = document.querySelector<SVGSVGElement>('#canvas')!;

const core = createCore({
  scene,
  viewport: {
    zoom: 1,
    pan: { x: 0, y: 0 },
    screenSize: { width: svgEl.clientWidth || 800, height: svgEl.clientHeight || 600 },
  },
});

// ── Initial floor plan ────────────────────────────────────────────────────────

const ROOMS: Array<{ id: string; name: string; x: number; y: number; w: number; h: number; fill: string }> = [
  { id: 'reception',  name: 'Reception',       x: 40,  y: 40,  w: 200, h: 120, fill: '#dbeafe' },
  { id: 'meeting-a',  name: 'Meeting Room A',   x: 300, y: 40,  w: 180, h: 120, fill: '#dcfce7' },
  { id: 'meeting-b',  name: 'Meeting Room B',   x: 300, y: 220, w: 180, h: 120, fill: '#dcfce7' },
  { id: 'open-space', name: 'Open Space',       x: 40,  y: 220, w: 200, h: 220, fill: '#fef9c3' },
  { id: 'kitchen',    name: 'Kitchen',          x: 300, y: 400, w: 180, h: 100, fill: '#fce7f3' },
  { id: 'corridor',   name: 'Corridor',         x: 240, y: 40,  w: 60,  h: 460, fill: '#f1f5f9' },
];

for (const r of ROOMS) {
  core.add({
    id: r.id as EntityId,
    layer: L.rooms,
    bounds: { x: r.x, y: r.y, width: r.w, height: r.h },
    selectable: true,
    data: { kind: 'room', name: r.name, fill: r.fill } satisfies RoomData,
  });
}

// Desks inside open space (x:40–240, y:220–440) — 2 columns, 4 rows
const DESK_GRID = { cols: 2, rows: 4, startX: 60, startY: 240, stepX: 80, stepY: 50, w: 60, h: 36 };

for (let row = 0; row < DESK_GRID.rows; row++) {
  for (let col = 0; col < DESK_GRID.cols; col++) {
    const n = row * DESK_GRID.cols + col + 1;
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
}

// ── Renderer ──────────────────────────────────────────────────────────────────

const NS = 'http://www.w3.org/2000/svg';

const renderer = mountSvgRenderer(core, {
  mount: svgEl,
  grid: { size: 40, stroke: '#f1f5f9', strokeWidth: 1 },
  selectionOverlay: { stroke: '#2563eb', strokeWidth: 2, padding: 4 },

  drawEntity(entity, { g, selected }) {
    const data = entity.data as EntityData;
    const { x, y, width, height } = entity.bounds;

    if (data.kind === 'room') {
      const rect = document.createElementNS(NS, 'rect');
      rect.setAttribute('x', String(x));
      rect.setAttribute('y', String(y));
      rect.setAttribute('width', String(width));
      rect.setAttribute('height', String(height));
      rect.setAttribute('fill', selected ? '#bfdbfe' : data.fill);
      rect.setAttribute('stroke', '#cbd5e1');
      rect.setAttribute('stroke-width', '1.5');
      rect.setAttribute('rx', '4');
      g.appendChild(rect);

      const text = document.createElementNS(NS, 'text');
      text.setAttribute('x', String(x + width / 2));
      text.setAttribute('y', String(y + height / 2));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('font-size', '12');
      text.setAttribute('font-family', 'system-ui, sans-serif');
      text.setAttribute('fill', '#475569');
      text.setAttribute('pointer-events', 'none');
      text.textContent = data.name;
      g.appendChild(text);
    }

    if (data.kind === 'desk') {
      const rect = document.createElementNS(NS, 'rect');
      rect.setAttribute('x', String(x));
      rect.setAttribute('y', String(y));
      rect.setAttribute('width', String(width));
      rect.setAttribute('height', String(height));
      rect.setAttribute('fill', selected ? '#bfdbfe' : '#e2e8f0');
      rect.setAttribute('stroke', '#94a3b8');
      rect.setAttribute('stroke-width', '1');
      rect.setAttribute('rx', '3');
      g.appendChild(rect);

      const text = document.createElementNS(NS, 'text');
      text.setAttribute('x', String(x + width / 2));
      text.setAttribute('y', String(y + height / 2));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('font-size', '10');
      text.setAttribute('font-family', 'system-ui, sans-serif');
      text.setAttribute('fill', '#64748b');
      text.setAttribute('pointer-events', 'none');
      text.textContent = data.label;
      g.appendChild(text);
    }
  },
});

// ── Fit on load ───────────────────────────────────────────────────────────────

core.fitToScene(48);

// ── Toolbar actions ───────────────────────────────────────────────────────────

document.getElementById('btn-fit')!.addEventListener('click', () => core.fitToScene(48));

document.getElementById('btn-delete')!.addEventListener('click', deleteSelected);

let deskCounter = DESK_GRID.cols * DESK_GRID.rows + 1;
document.getElementById('btn-add-desk')!.addEventListener('click', () => {
  // Place new desk near the open space, wrapping columns
  const col = (deskCounter - 1) % DESK_GRID.cols;
  const row = Math.floor((deskCounter - 1) / DESK_GRID.cols) % 6;
  core.add({
    id: `desk-${deskCounter}` as EntityId,
    layer: L.desks,
    bounds: {
      x: DESK_GRID.startX + col * DESK_GRID.stepX,
      y: DESK_GRID.startY + row * DESK_GRID.stepY,
      width: DESK_GRID.w,
      height: DESK_GRID.h,
    },
    selectable: true,
    data: { kind: 'desk', label: `Desk ${deskCounter}` } satisfies DeskData,
  });
  deskCounter++;
});

// ── Keyboard shortcuts ────────────────────────────────────────────────────────

window.addEventListener('keydown', (e) => {
  const tag = (document.activeElement as HTMLElement)?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;

  if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected();
  if (e.key === 'Escape') core.setSelection([], 'replace');
  if (e.key === 'f' || e.key === 'F') core.fitToScene(48);
});

function deleteSelected() {
  for (const id of [...core.selection]) core.remove(id);
}

// ── Selection panel ───────────────────────────────────────────────────────────

core.on('selection:change', renderPanel);

function renderPanel() {
  const container = document.getElementById('selection-info')!;
  const ids = [...core.selection];

  if (ids.length === 0) {
    container.innerHTML = `
      <p class="hint">Click an entity to select it.</p>
      <p class="hint">Shift+click to add, Ctrl+click to toggle.</p>
    `;
    return;
  }

  container.innerHTML = ids
    .map((id) => {
      const entity = core.scene.entities.get(id);
      if (!entity) return '';
      const data = entity.data as EntityData;
      const { x, y, width, height } = entity.bounds;
      const name = data.kind === 'room' ? data.name : data.label;

      return `
        <div class="entity-card">
          <div class="card-id">${id}</div>
          <span class="card-badge ${data.kind}">${data.kind}</span>
          <div class="card-name">${name}</div>
          <div class="card-bounds">${width}×${height} at (${x}, ${y})</div>
        </div>
      `;
    })
    .join('');
}

// ── Zoom display ──────────────────────────────────────────────────────────────

const zoomDisplay = document.getElementById('zoom-display')!;

core.on('viewport:change', () => {
  zoomDisplay.textContent = `${Math.round(core.viewport.zoom * 100)}%`;
});

// ── Resize handling ───────────────────────────────────────────────────────────

new ResizeObserver(() => {
  core.viewport.screenSize = { width: svgEl.clientWidth, height: svgEl.clientHeight };
  renderer.rerender();
}).observe(svgEl);
