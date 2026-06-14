import { useEffect, useRef } from 'react';
import type { FloormapCore } from '@floormap-tools/core';

export function useCoreEvent<T = unknown>(
  core: FloormapCore,
  event: string,
  handler: (payload: T) => void,
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    return core.on<T>(event, (payload) => handlerRef.current(payload));
  }, [core, event]);
}
