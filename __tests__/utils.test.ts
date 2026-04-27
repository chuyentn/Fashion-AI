import { describe, it, expect } from 'vitest';

/**
 * Example utility function tests
 * Add tests here for helper functions and utilities
 */

describe('Utility Functions', () => {
  it('should demonstrate basic math operations', () => {
    const add = (a: number, b: number) => a + b;
    expect(add(2, 3)).toBe(5);
  });

  it('should handle string operations', () => {
    const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
    expect(capitalize('fashion')).toBe('Fashion');
  });

  it('should test array operations', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(arr).toHaveLength(5);
    expect(arr).toContain(3);
  });
});
