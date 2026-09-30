import { useId, useState, type FormEvent } from 'react';

export const INVALID_CREDENTIALS_MESSAGE = 'Usuario o contraseña incorrectos';

interface LoginProps {
  /**
   * HU-004: recibido desde `AuthGate`, que es quien posee la única instancia de `useAuth()`.
   * Si `Login` llamara a su propio `useAuth()`, su estado de React sería independiente del de
   * `AuthGate` y el login exitoso no haría que `AuthGate` mostrara el inventario.
   */
  login: (username: string, password: string) => boolean;
}

/**
 * HU-004: pantalla de login mock. Campos vacíos se tratan igual que credenciales incorrectas
 * (spec: "Campos vacíos" espera el mismo mensaje que "Credenciales incorrectas").
 */
export function Login({ login }: LoginProps) {
  const id = useId();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = login(username, password);
    if (!ok) {
      setError(INVALID_CREDENTIALS_MESSAGE);
    }
  }

  return (
    <main className="app login">
      <section className="add-product" aria-labelledby={`${id}-title`}>
        <h1 id={`${id}-title`}>Iniciar sesión</h1>
        <form noValidate onSubmit={handleSubmit}>
          <div className="add-product-fields">
            <div className="field">
              <label htmlFor={`${id}-username`}>Usuario</label>
              <input
                id={`${id}-username`}
                name="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor={`${id}-password`}>Contraseña</label>
              <input
                id={`${id}-password`}
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </div>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <div className="add-product-actions">
            <button type="submit" className="primary">
              Ingresar
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
