import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorBoundary } from '../ErrorBoundary.jsx';

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children when no error', () => {
    // Simple render test - ErrorBoundary should pass through children
    const result = ErrorBoundary.prototype.render.call(
      { props: { children: 'Hello' }, state: { hasError: false } }
    );
    expect(result).toBe('Hello');
  });

  it('has getDerivedStateFromError static method', () => {
    const error = new Error('Test error');
    const state = ErrorBoundary.getDerivedStateFromError(error);
    expect(state.hasError).toBe(true);
    expect(state.error).toBe(error);
  });
});
