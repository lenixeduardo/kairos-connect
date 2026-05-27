import { describe, it, expect } from 'vitest';
import { cn } from '../utils.js';

describe('cn', () => {
  it('merges class names correctly', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('resolves tailwind conflicts', () => {
    // px-4 should be overridden by px-6
    expect(cn('px-4', 'px-6')).toBe('px-6');
  });
});
