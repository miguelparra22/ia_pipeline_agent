import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AddProductForm, CREATE_ERROR_MESSAGE } from './AddProductForm';
import { MESSAGES } from './productValidation';

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

async function fill(user: ReturnType<typeof userEvent.setup>, values: Record<string, string>) {
  for (const [label, value] of Object.entries(values)) {
    const input = screen.getByLabelText(label);
    await user.clear(input);
    if (value) await user.type(input, value);
  }
}

const radiador = {
  SKU: 'ALT-06',
  Nombre: 'Radiador',
  'Cantidad en stock': '8',
  'Precio unitario': '350000,50',
};

// HU-002: formulario de alta de producto.
describe('AddProductForm', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const onCreated = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    onCreated.mockReset();
    onCancel.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('muestra los cuatro campos vacíos y las acciones Guardar y Cancelar', () => {
    render(<AddProductForm onCreated={onCreated} onCancel={onCancel} />);

    for (const label of Object.keys(radiador)) {
      expect(screen.getByLabelText(label)).toHaveValue('');
    }
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeEnabled();
  });

  it('valida en el cliente, muestra los errores junto a cada campo y no llama a la API', async () => {
    const user = userEvent.setup();
    render(<AddProductForm onCreated={onCreated} onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(screen.getByLabelText('SKU')).toHaveAccessibleDescription(MESSAGES.skuRequired);
    expect(screen.getByLabelText('Nombre')).toHaveAccessibleDescription(MESSAGES.nameRequired);
    expect(screen.getByLabelText('Cantidad en stock')).toHaveAccessibleDescription(MESSAGES.quantityRequired);
    expect(screen.getByLabelText('Precio unitario')).toHaveAccessibleDescription(MESSAGES.priceRequired);
    expect(screen.getByLabelText('SKU')).toHaveAttribute('aria-invalid', 'true');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('envía los datos normalizados y avisa del producto creado', async () => {
    const user = userEvent.setup();
    const created = { id: 6, sku: 'ALT-06', name: 'Radiador', quantity: 8, price: 350000.5 };
    fetchMock.mockResolvedValue(jsonResponse(201, created));
    render(<AddProductForm onCreated={onCreated} onCancel={onCancel} />);

    await fill(user, { ...radiador, SKU: ' ALT-06 ' });
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onCreated).toHaveBeenCalledWith(created);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      sku: 'ALT-06',
      name: 'Radiador',
      quantity: '8',
      price: '350000.50',
    });
  });

  it('muestra junto al SKU el error 409 del servidor', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(
      jsonResponse(409, { status: 409, errors: { sku: 'Ya existe un producto con el SKU alt-02' } }),
    );
    render(<AddProductForm onCreated={onCreated} onCancel={onCancel} />);

    await fill(user, { ...radiador, SKU: 'alt-02' });
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('Ya existe un producto con el SKU alt-02')).toBeInTheDocument();
    expect(screen.getByLabelText('SKU')).toHaveAccessibleDescription('Ya existe un producto con el SKU alt-02');
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled();
    expect(onCreated).not.toHaveBeenCalled();
  });

  it('muestra en su campo los errores 400 del servidor', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(jsonResponse(400, { status: 400, errors: { price: MESSAGES.priceInvalid } }));
    render(<AddProductForm onCreated={onCreated} onCancel={onCancel} />);

    await fill(user, radiador);
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText(MESSAGES.priceInvalid)).toBeInTheDocument();
    expect(onCreated).not.toHaveBeenCalled();
  });

  it('deshabilita Guardar mientras la solicitud está en curso', async () => {
    const user = userEvent.setup();
    let respond: (response: Response) => void = () => {};
    fetchMock.mockReturnValue(new Promise<Response>((resolve) => (respond = resolve)));
    render(<AddProductForm onCreated={onCreated} onCancel={onCancel} />);

    await fill(user, radiador);
    const save = screen.getByRole('button', { name: 'Guardar' });
    await user.click(save);

    expect(save).toBeDisabled();
    await user.click(save);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    respond(jsonResponse(201, { id: 6, sku: 'ALT-06', name: 'Radiador', quantity: 8, price: 350000.5 }));
    await vi.waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
  });

  it('ante un error inesperado conserva los datos y muestra el aviso', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(new Response('boom', { status: 500 }));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<AddProductForm onCreated={onCreated} onCancel={onCancel} />);

    await fill(user, radiador);
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(CREATE_ERROR_MESSAGE);
    expect(screen.getByLabelText('SKU')).toHaveValue('ALT-06');
    expect(screen.getByLabelText('Precio unitario')).toHaveValue('350000,50');
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled();
  });

  it('Cancelar avisa sin guardar', async () => {
    const user = userEvent.setup();
    render(<AddProductForm onCreated={onCreated} onCancel={onCancel} />);

    await fill(user, radiador);
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
