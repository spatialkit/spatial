// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createCore, createEmptyScene } from '@floormap/core';
import type { EntityId, LayerId } from '@floormap/core';
import { useFloormapCore, useSelection, useViewport } from '../index';

function makeCore() {
  return createCore({
    scene: createEmptyScene({ width: 1000, height: 1000 }, ['L' as LayerId]),
    viewport: { zoom: 1, pan: { x: 0, y: 0 }, screenSize: { width: 800, height: 600 } },
  });
}

describe('useFloormapCore', () => {
  it('returns a stable core instance across re-renders', () => {
    const { result, rerender } = renderHook(() =>
      useFloormapCore({
        scene: createEmptyScene({ width: 100, height: 100 }, []),
        viewport: { zoom: 1, pan: { x: 0, y: 0 }, screenSize: { width: 800, height: 600 } },
      }),
    );
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it('accepts an initializer function called only once', () => {
    let calls = 0;
    const { result, rerender } = renderHook(() =>
      useFloormapCore(() => {
        calls++;
        return {
          scene: createEmptyScene({ width: 100, height: 100 }, []),
          viewport: { zoom: 1, pan: { x: 0, y: 0 }, screenSize: { width: 800, height: 600 } },
        };
      }),
    );
    rerender();
    rerender();
    expect(calls).toBe(1);
    expect(result.current).toBeDefined();
  });
});

describe('useSelection', () => {
  it('returns empty set initially', () => {
    const core = makeCore();
    const { result } = renderHook(() => useSelection(core));
    expect(result.current.size).toBe(0);
  });

  it('updates when selection changes', () => {
    const core = makeCore();
    core.add({
      id: 'e1' as EntityId,
      layer: 'L' as LayerId,
      bounds: { x: 0, y: 0, width: 10, height: 10 },
      selectable: true,
    });
    const { result } = renderHook(() => useSelection(core));

    act(() => {
      core.setSelection(['e1' as EntityId], 'replace');
    });

    expect(result.current.has('e1' as EntityId)).toBe(true);
  });

  it('returns a new Set reference on each change', () => {
    const core = makeCore();
    core.add({
      id: 'e1' as EntityId,
      layer: 'L' as LayerId,
      bounds: { x: 0, y: 0, width: 10, height: 10 },
      selectable: true,
    });
    const { result } = renderHook(() => useSelection(core));
    const before = result.current;

    act(() => {
      core.setSelection(['e1' as EntityId], 'replace');
    });

    expect(result.current).not.toBe(before);
  });

  it('reflects deselection', () => {
    const core = makeCore();
    core.add({
      id: 'e1' as EntityId,
      layer: 'L' as LayerId,
      bounds: { x: 0, y: 0, width: 10, height: 10 },
      selectable: true,
    });
    core.setSelection(['e1' as EntityId], 'replace');
    const { result } = renderHook(() => useSelection(core));

    act(() => {
      core.setSelection([], 'replace');
    });

    expect(result.current.size).toBe(0);
  });
});

describe('useViewport', () => {
  it('returns current viewport state', () => {
    const core = makeCore();
    const { result } = renderHook(() => useViewport(core));
    expect(result.current.zoom).toBe(1);
    expect(result.current.pan).toEqual({ x: 0, y: 0 });
  });

  it('updates when zoom changes', () => {
    const core = makeCore();
    const { result } = renderHook(() => useViewport(core));

    act(() => {
      core.zoomAt({ x: 400, y: 300 }, 0.1);
    });

    expect(result.current.zoom).toBeGreaterThan(1);
  });

  it('returns a new object reference on each change', () => {
    const core = makeCore();
    const { result } = renderHook(() => useViewport(core));
    const before = result.current;

    act(() => {
      core.panBy({ x: 10, y: 0 });
    });

    expect(result.current).not.toBe(before);
  });
});
