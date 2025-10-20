import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../events';

describe('EventBus', () => {
  it('should subscribe to an event', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on('test', handler);
    bus.emit('test', { data: 'value' });

    expect(handler).toHaveBeenCalledWith({ data: 'value' });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should unsubscribe from an event using off method', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on('test', handler);
    bus.off('test', handler);
    bus.emit('test', { data: 'value' });

    expect(handler).not.toHaveBeenCalled();
  });

  it('should unsubscribe from an event using returned function', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    const unsubscribe = bus.on('test', handler);
    unsubscribe();
    bus.emit('test', { data: 'value' });

    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle multiple subscribers for the same event', () => {
    const bus = new EventBus();
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    bus.on('test', handler1);
    bus.on('test', handler2);
    bus.emit('test', { data: 'value' });

    expect(handler1).toHaveBeenCalledWith({ data: 'value' });
    expect(handler2).toHaveBeenCalledWith({ data: 'value' });
  });

  it('should handle different events independently', () => {
    const bus = new EventBus();
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    bus.on('event1', handler1);
    bus.on('event2', handler2);
    bus.emit('event1', { data: 'value1' });

    expect(handler1).toHaveBeenCalledWith({ data: 'value1' });
    expect(handler2).not.toHaveBeenCalled();
  });

  it('should not throw when emitting an event with no subscribers', () => {
    const bus = new EventBus();

    expect(() => bus.emit('test', { data: 'value' })).not.toThrow();
  });

  it('should not throw when unsubscribing from a non-existent event', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    expect(() => bus.off('test', handler)).not.toThrow();
  });

  it('should allow the same handler to be subscribed multiple times', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on('test', handler);
    bus.on('test', handler);
    bus.emit('test', { data: 'value' });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should only remove the specific handler when unsubscribing', () => {
    const bus = new EventBus();
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    bus.on('test', handler1);
    bus.on('test', handler2);
    bus.off('test', handler1);
    bus.emit('test', { data: 'value' });

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalledWith({ data: 'value' });
  });
});
