import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SESSION_KEY, useAuth } from './useAuth';

// HU-004: escenarios de specs/inicio-sesion/spec.md para el hook de sesión mock.
describe('useAuth', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('login correcto guarda la sesión y marca isAuthenticated', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(false);

    act(() => {
      const ok = result.current.login('admin', 'admin123');
      expect(ok).toBe(true);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem(SESSION_KEY)).toBeTruthy();
  });

  it('login incorrecto no guarda sesión ni marca isAuthenticated', () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      const ok = result.current.login('admin', 'incorrecta');
      expect(ok).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('la sesión persiste al reinstanciar el hook (simula recarga)', () => {
    const first = renderHook(() => useAuth());
    act(() => {
      first.result.current.login('admin', 'admin123');
    });

    // Nueva instancia del hook, como ocurriría tras recargar la página.
    const second = renderHook(() => useAuth());
    expect(second.result.current.isAuthenticated).toBe(true);
  });

  it('logout borra la sesión y una nueva instancia ya no está autenticada', () => {
    const { result } = renderHook(() => useAuth());
    act(() => {
      result.current.login('admin', 'admin123');
    });
    expect(result.current.isAuthenticated).toBe(true);

    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();

    const reinstantiated = renderHook(() => useAuth());
    expect(reinstantiated.result.current.isAuthenticated).toBe(false);
  });
});
