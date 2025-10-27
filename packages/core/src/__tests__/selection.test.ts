import { describe, it, expect } from 'vitest';
import { applySelection } from '../selection';
import type { EntityId } from '../types';

describe('applySelection', () => {
  describe('replace mode', () => {
    it('should replace current selection with new ids', () => {
      const current = new Set<EntityId>(['1', '2', '3'] as EntityId[]);
      const ids: EntityId[] = ['4', '5'] as EntityId[]; 
      const result = applySelection(current, ids, 'replace');

      expect(result).toEqual(new Set(['4', '5']));
      expect(result.has('1' as EntityId)).toBe(false);
      expect(result.has('2' as EntityId)).toBe(false);
      expect(result.has('3' as EntityId)).toBe(false);
    });

    it('should clear selection when ids array is empty', () => {
      const current = new Set<EntityId>(['1', '2', '3'] as EntityId[]);
      const result = applySelection(current, [], 'replace');

      expect(result.size).toBe(0);
    });

    it('should not mutate the original set', () => {
      const current = new Set<EntityId>(['1', '2'] as EntityId[]);
      const original = new Set(current);
      applySelection(current, ['3'] as EntityId[], 'replace');

      expect(current).toEqual(original);
    });
  });

  describe('add mode', () => {
    it('should add new ids to current selection', () => {
      const current = new Set<EntityId>(['1', '2'] as EntityId[]);
      const ids: EntityId[] = ['3', '4'] as EntityId[];
      const result = applySelection(current, ids, 'add');

      expect(result).toEqual(new Set(['1', '2', '3', '4']));
    });

    it('should handle duplicate ids', () => {
      const current = new Set<EntityId>(['1', '2'] as EntityId[]);
      const ids: EntityId[] = ['2', '3'] as EntityId[];
      const result = applySelection(current, ids, 'add');

      expect(result).toEqual(new Set(['1', '2', '3']));
    });

    it('should not mutate the original set', () => {
      const current = new Set<EntityId>(['1', '2'] as EntityId[]);
      const original = new Set(current);
      applySelection(current, ['3'] as EntityId[], 'add');

      expect(current).toEqual(original);
    });

    it('should handle empty current set', () => {
      const current = new Set<EntityId>();
      const ids: EntityId[] = ['1', '2'] as EntityId[];
      const result = applySelection(current, ids, 'add');

      expect(result).toEqual(new Set(['1', '2']));
    });

    it('should handle empty ids array with add mode', () => {
      const current = new Set<EntityId>(['1', '2'] as EntityId[]);
      const result = applySelection(current, [], 'add');

      expect(result).toEqual(new Set(['1', '2']));
    });
  });

  describe('toggle mode', () => {
    it('should toggle ids - add non-existing ids', () => {
      const current = new Set<EntityId>(['1', '2'] as EntityId[]);
      const ids: EntityId[] = ['3', '4'] as EntityId[];
      const result = applySelection(current, ids, 'toggle');

      expect(result).toEqual(new Set(['1', '2', '3', '4']));
    });

    it('should toggle ids - remove existing ids', () => {
      const current = new Set<EntityId>(['1', '2', '3'] as EntityId[]);
      const ids: EntityId[] = ['2', '3'] as EntityId[];
      const result = applySelection(current, ids, 'toggle');

      expect(result).toEqual(new Set(['1']));
    });

    it('should toggle mixed existing and non-existing ids', () => {
      const current = new Set<EntityId>(['1', '2'] as EntityId[]);
      const ids: EntityId[] = ['2', '3'] as EntityId[];
      const result = applySelection(current, ids, 'toggle');

      expect(result).toEqual(new Set(['1', '3']));
    });

    it('should not mutate the original set', () => {
      const current = new Set<EntityId>(['1', '2'] as EntityId[]);
      const original = new Set(current);
      applySelection(current, ['2'] as EntityId[], 'toggle');

      expect(current).toEqual(original);
    });

    it('should handle empty ids array with toggle mode', () => {
      const current = new Set<EntityId>(['1', '2'] as EntityId[]);
      const result = applySelection(current, [], 'toggle');

      expect(result).toEqual(new Set(['1', '2']));
    });
  });
});