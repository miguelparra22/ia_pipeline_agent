import { useState } from 'react';
import { DEFAULT_USER } from './credentials';

/**
 * HU-004: bandera de sesión en `localStorage`. No es un token ni contiene datos sensibles —
 * solo marca que alguien ya pasó el login mock — por eso basta un valor plano fijo.
 */
export const SESSION_KEY = 'inventory_session';
const SESSION_VALUE = 'active';

function readSession(): boolean {
  return localStorage.getItem(SESSION_KEY) === SESSION_VALUE;
}

interface Auth {
  isAuthenticated: boolean;
  /** Valida contra el usuario por defecto (mock). `true` si autenticó, `false` si no. */
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

/**
 * HU-004: sesión mock contra un único usuario por defecto, persistida en `localStorage` para
 * sobrevivir recargas (criterio de aceptación 4) hasta que se cierre sesión explícitamente.
 */
export function useAuth(): Auth {
  const [isAuthenticated, setIsAuthenticated] = useState(readSession);

  function login(username: string, password: string): boolean {
    const ok = username === DEFAULT_USER.username && password === DEFAULT_USER.password;
    if (ok) {
      localStorage.setItem(SESSION_KEY, SESSION_VALUE);
      setIsAuthenticated(true);
    }
    return ok;
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
  }

  return { isAuthenticated, login, logout };
}
