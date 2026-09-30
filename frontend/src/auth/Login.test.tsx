import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_USER } from './credentials';
import { Login } from './Login';

// HU-004: escenarios de specs/inicio-sesion/spec.md para la pantalla de login. `login` se pasa
// como prop (ver Login.tsx) así que aquí se prueba con una implementación mínima equivalente a
// la del hook real, sin depender de su instancia de estado.
function fakeLogin(username: string, password: string): boolean {
  return username === DEFAULT_USER.username && password === DEFAULT_USER.password;
}

describe('Login', () => {
  it('ingreso exitoso con el usuario por defecto llama a login y no muestra error', async () => {
    const user = userEvent.setup();
    const login = vi.fn(fakeLogin);
    render(<Login login={login} />);

    await user.type(screen.getByLabelText('Usuario'), 'admin');
    await user.type(screen.getByLabelText('Contraseña'), 'admin123');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(login).toHaveBeenCalledWith('admin', 'admin123');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('credenciales incorrectas muestran el error y no inician sesión', async () => {
    const user = userEvent.setup();
    const login = vi.fn(fakeLogin);
    render(<Login login={login} />);

    await user.type(screen.getByLabelText('Usuario'), 'admin');
    await user.type(screen.getByLabelText('Contraseña'), 'incorrecta');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Usuario o contraseña incorrectos');
  });

  it('campos vacíos muestran el mismo error y no inician sesión', async () => {
    const user = userEvent.setup();
    const login = vi.fn(fakeLogin);
    render(<Login login={login} />);

    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Usuario o contraseña incorrectos');
    expect(login).toHaveBeenCalledWith('', '');
  });
});
