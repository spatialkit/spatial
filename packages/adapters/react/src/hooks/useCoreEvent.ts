import { useEffect, useRef } from 'react';
import type { SpatialCore } from '@spatialkit/core';

export function useCoreEvent<T = unknown>(
  core: SpatialCore,
  event: string,
  handler: (payload: T) => void,
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    return core.on<T>(event, (payload) => handlerRef.current(payload));
  }, [core, event]);
}
