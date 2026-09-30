import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '../products/types';
import { AuthGate } from './AuthGate';

const seed: Product[] = [{ id: 1, sku: 'ALT-01', name: 'Filtro Aceite', quantity: 25, price: 38500 }];

// HU-004: integración login <-> inventario. El fetch simulado solo importa para comprobar que
// el inventario nunca se consulta ni se muestra antes de autenticar.
function fakeBackend(): Promise<Response> {
  return Promise.resolve(new Response(JSON.stringify(seed), { status: 200 }));
}

describe('AuthGate', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(fakeBackend);
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('sin sesión muestra el login y nunca el inventario', () => {
    render(<AuthGate />);

    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('tras iniciar sesión se ve el inventario', async () => {
    const user = userEvent.setup();
    render(<AuthGate />);

    await user.type(screen.getByLabelText('Usuario'), 'admin');
    await user.type(screen.getByLabelText('Contraseña'), 'admin123');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByText('Filtro Aceite')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ingresar' })).not.toBeInTheDocument();
  });

  it('tras cerrar sesión vuelve a mostrarse el login y una recarga simulada no restaura el inventario', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<AuthGate />);

    await user.type(screen.getByLabelText('Usuario'), 'admin');
    await user.type(screen.getByLabelText('Contraseña'), 'admin123');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));
    await waitFor(() => expect(screen.getByText('Filtro Aceite')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument();
    expect(screen.queryByText('Filtro Aceite')).not.toBeInTheDocument();

    // Simula una recarga: se desmonta y se vuelve a montar una instancia nueva del árbol.
    unmount();
    render(<AuthGate />);

    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument();
    expect(screen.queryByText('Filtro Aceite')).not.toBeInTheDocument();
  });
});
