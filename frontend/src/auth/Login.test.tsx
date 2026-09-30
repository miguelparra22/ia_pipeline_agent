import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { Login } from './Login';
import { SESSION_KEY } from './useAuth';

// HU-004: escenarios de specs/inicio-sesion/spec.md para la pantalla de login.
describe('Login', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('ingreso exitoso con el usuario por defecto inicia la sesión', async () => {
    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByLabelText('Usuario'), 'admin');
    await user.type(screen.getByLabelText('Contraseña'), 'admin123');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(localStorage.getItem(SESSION_KEY)).toBeTruthy();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('credenciales incorrectas muestran el error y no inician sesión', async () => {
    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByLabelText('Usuario'), 'admin');
    await user.type(screen.getByLabelText('Contraseña'), 'incorrecta');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Usuario o contraseña incorrectos');
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('campos vacíos muestran el mismo error y no inician sesión', async () => {
    const user = userEvent.setup();
    render(<Login />);

    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Usuario o contraseña incorrectos');
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });
});
