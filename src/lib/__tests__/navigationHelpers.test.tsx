import { Home } from '@/lib/icons';
import { describe, expect, test } from 'vitest';
import {
  createNavigationItem,
  createNavigationItems,
} from '../navigationHelpers';

// Mock component for testing
const MockComponent = () => <div>Mock</div>;

describe('navigationHelpers', () => {
  describe('createNavigationItem', () => {
    test('should create navigation item with all properties', () => {
      const item = createNavigationItem('home', 'Home', Home, MockComponent, 1);

      expect(item).toEqual({
        id: 'home',
        label: 'Home',
        icon: Home,
        component: MockComponent,
        priority: 1,
      });
    });

    test('should handle different priorities', () => {
      const item1 = createNavigationItem(
        'test',
        'Test',
        Home,
        MockComponent,
        1
      );
      const item2 = createNavigationItem(
        'test',
        'Test',
        Home,
        MockComponent,
        2
      );
      const item3 = createNavigationItem(
        'test',
        'Test',
        Home,
        MockComponent,
        3
      );

      expect(item1.priority).toBe(1);
      expect(item2.priority).toBe(2);
      expect(item3.priority).toBe(3);
    });

    test('should preserve all input values', () => {
      const item = createNavigationItem(
        'custom-id',
        'Custom Label',
        Home,
        MockComponent,
        2
      );

      expect(item.id).toBe('custom-id');
      expect(item.label).toBe('Custom Label');
      expect(item.icon).toBe(Home);
      expect(item.component).toBe(MockComponent);
      expect(item.priority).toBe(2);
    });
  });

  describe('createNavigationItems', () => {
    test('should create multiple navigation items', () => {
      const items = createNavigationItems([
        {
          id: 'home',
          label: 'Home',
          icon: Home,
          component: MockComponent,
          priority: 1,
        },
        {
          id: 'about',
          label: 'About',
          icon: Home,
          component: MockComponent,
          priority: 2,
        },
      ]);

      expect(items).toHaveLength(2);
      expect(items[0]!.id).toBe('home');
      expect(items[1]!.id).toBe('about');
    });

    test('should handle empty array', () => {
      const items = createNavigationItems([]);
      expect(items).toEqual([]);
    });

    test('should create items with correct structure', () => {
      const items = createNavigationItems([
        {
          id: 'test',
          label: 'Test',
          icon: Home,
          component: MockComponent,
          priority: 3,
        },
      ]);

      expect(items[0]!).toMatchObject({
        id: 'test',
        label: 'Test',
        priority: 3,
      });
      expect(items[0]!.icon).toBe(Home);
      expect(items[0]!.component).toBe(MockComponent);
    });

    test('should handle single item', () => {
      const items = createNavigationItems([
        {
          id: 'single',
          label: 'Single',
          icon: Home,
          component: MockComponent,
          priority: 1,
        },
      ]);

      expect(items).toHaveLength(1);
      expect(items[0]!.id).toBe('single');
    });
  });
});
