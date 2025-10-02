type Handler<T> = (payload: T) => void;
type Unsubscribe = () => void;

export class EventBus {
  private map = new Map<string, Set<Function>>();

  on<T = any>(event: string, fn: Handler<T>): Unsubscribe {
    if (!this.map.has(event)) {
      this.map.set(event, new Set());
    }

    this.map.get(event)!.add(fn);

    return () => this.off(event, fn);
  }

  off<T = any>(event: string, fn: Handler<T>) {
    if (this.map.has(event)) {
      this.map.get(event)!.delete(fn);
    }
  }

  emit<T = any>(event: string, payload: T) {
    if (this.map.has(event)) {
      this.map.get(event)!.forEach((fn) => (fn as Handler<T>)(payload));
    }
  }
}