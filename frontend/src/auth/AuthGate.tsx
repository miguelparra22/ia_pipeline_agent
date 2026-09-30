import { App } from '../App';
import { Login } from './Login';
import { useAuth } from './useAuth';

/**
 * HU-004: punto de entrada real de la aplicación. Sin sesión activa solo se monta `<Login>`,
 * así que `<App>` (y el inventario que consulta) nunca llega a montarse ni a pedir datos.
 */
export function AuthGate() {
  const { isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated) {
    return <Login login={login} />;
  }

  return <App onLogout={logout} />;
}
