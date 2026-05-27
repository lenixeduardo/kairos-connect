import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock config
vi.mock('../config.js', () => ({
  KAIROS_API_URL: 'https://test-api.example.com',
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = String(value); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// Mock window.dispatchEvent
globalThis.window = { dispatchEvent: vi.fn() };

const { kairosApi, clearKairosAuth } = await import('../kairosApi.js');

describe('kairosApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe('isConfigured', () => {
    it('returns true when BASE_URL is set', () => {
      expect(kairosApi.isConfigured()).toBe(true);
    });
  });

  describe('login', () => {
    it('throws error when backend returns 401', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Credenciais inválidas' }),
      });

      await expect(kairosApi.login('wrong@email.com', 'wrongpass'))
        .rejects.toThrow('Credenciais inválidas');
    });

    it('saves tokens and user on successful login', async () => {
      const mockResponse = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        user: { id: 1, email: 'admin@test.com', name: 'Admin', role: 'admin' },
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await kairosApi.login('admin@test.com', 'password');

      expect(result).toEqual(mockResponse);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('kairos_access_token', 'test-access-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('kairos_refresh_token', 'test-refresh-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('kairos_user', JSON.stringify(mockResponse.user));
    });

    it('sends correct request body', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ accessToken: 'x', refreshToken: 'y', user: {} }),
      });

      await kairosApi.login('user@test.com', 'mypassword');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://test-api.example.com/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'user@test.com', password: 'mypassword' }),
        })
      );
    });
  });

  describe('clearKairosAuth', () => {
    it('removes all auth data from localStorage', () => {
      localStorageMock.setItem('kairos_access_token', 'token');
      localStorageMock.setItem('kairos_refresh_token', 'refresh');
      localStorageMock.setItem('kairos_user', '{"name":"test"}');

      clearKairosAuth();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('kairos_access_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('kairos_refresh_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('kairos_user');
    });
  });

  describe('getStoredUser', () => {
    it('returns null when no user stored', () => {
      expect(kairosApi.getStoredUser()).toBeNull();
    });

    it('parses stored user JSON', () => {
      const user = { id: 1, name: 'Test', email: 'test@test.com' };
      localStorageMock.setItem('kairos_user', JSON.stringify(user));

      expect(kairosApi.getStoredUser()).toEqual(user);
    });
  });
});
