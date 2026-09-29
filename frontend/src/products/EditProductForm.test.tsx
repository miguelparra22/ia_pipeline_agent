import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EditProductForm, NOT_FOUND_MESSAGE, UPDATE_ERROR_MESSAGE } from './EditProductForm';
import { MESSAGES } from './productValidation';
import type { Product } from './types';

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

const bujia: Product = { id: 2, sku: 'ALT-02', name: 'Bujía Spark', quantity: 120, price: 12900 };

const iridium = {
  Nombre: 'Bujía Spark Iridium',
  'Cantidad en stock': '95',
  'Precio unitario': '15900,50',
};

// HU-003: formulario de edición de producto.
describe('EditProductForm', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const onUpdated = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    onUpdated.mockReset();
    onCancel.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function renderForm(product: Product = bujia) {
    render(<EditProductForm product={product} onUpdated={onUpdated} onCancel={onCancel} />);
  }

  it('muestra los datos actuales, el SKU de solo lectura y las acciones Guardar y Cancelar', async () => {
    const user = userEvent.setup();
    renderForm();

    expect(screen.getByRole('region', { name: 'Editar producto' })).toBeInTheDocument();
    expect(screen.getByLabelText('SKU')).toHaveValue('ALT-02');
    expect(screen.getByLabelText('Nombre')).toHaveValue('Bujía Spark');
    expect(screen.getByLabelText('Cantidad en stock')).toHaveValue('120');
    expect(screen.getByLabelText('Precio unitario')).toHaveValue('12900');
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeEnabled();

    const sku = screen.getByLabelText('SKU');
    expect(sku).toHaveAttribute('readonly');
    expect(sku).not.toBeDisabled();
    await user.type(sku, 'X');
    expect(sku).toHaveValue('ALT-02');
  });

  it('precarga el precio con punto decimal', () => {
    renderForm({ ...bujia, price: 12900.5 });

    expect(screen.getByLabelText('Precio unitario')).toHaveValue('12900.5');
  });

  it('valida en el cliente, muestra los errores junto a cada campo y no llama a la API', async () => {
    const user = userEvent.setup();
    renderForm();

    await fill(user, { Nombre: '', 'Cantidad en stock': '', 'Precio unitario': '' });
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(screen.getByLabelText('Nombre')).toHaveAccessibleDescription(MESSAGES.nameRequired);
    expect(screen.getByLabelText('Cantidad en stock')).toHaveAccessibleDescription(MESSAGES.quantityRequired);
    expect(screen.getByLabelText('Precio unitario')).toHaveAccessibleDescription(MESSAGES.priceRequired);

    await fill(user, { Nombre: 'Bujía Spark', 'Cantidad en stock': '2.5', 'Precio unitario': '12.345' });
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(screen.getByLabelText('Cantidad en stock')).toHaveAccessibleDescription(MESSAGES.quantityInvalid);
    expect(screen.getByLabelText('Precio unitario')).toHaveAccessibleDescription(MESSAGES.priceInvalid);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('envía los datos normalizados sin el SKU y avisa del producto actualizado', async () => {
    const user = userEvent.setup();
    const updated = { id: 2, sku: 'ALT-02', name: 'Bujía Spark Iridium', quantity: 95, price: 15900.5 };
    fetchMock.mockResolvedValue(jsonResponse(200, updated));
    renderForm();

    await fill(user, { ...iridium, Nombre: '  Bujía Spark Iridium  ' });
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onUpdated).toHaveBeenCalledWith(updated);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/products/2');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual({ name: 'Bujía Spark Iridium', quantity: '95', price: '15900.50' });
  });

  it('muestra en su campo los errores 400 del servidor', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(jsonResponse(400, { status: 400, errors: { price: MESSAGES.priceInvalid } }));
    renderForm();

    await fill(user, iridium);
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText(MESSAGES.priceInvalid)).toBeInTheDocument();
    expect(screen.getByLabelText('Precio unitario')).toHaveAccessibleDescription(MESSAGES.priceInvalid);
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled();
    expect(onUpdated).not.toHaveBeenCalled();
  });

  it('si el producto ya no existe conserva los datos y muestra el aviso', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(jsonResponse(404, { status: 404, title: 'Not Found' }));
    renderForm();

    await fill(user, iridium);
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(NOT_FOUND_MESSAGE);
    expect(screen.getByLabelText('Nombre')).toHaveValue('Bujía Spark Iridium');
    expect(screen.getByLabelText('Precio unitario')).toHaveValue('15900,50');
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled();
    expect(onUpdated).not.toHaveBeenCalled();
  });

  it('ante un error inesperado conserva los datos y muestra el aviso', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(new Response('boom', { status: 500 }));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderForm();

    await fill(user, iridium);
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(UPDATE_ERROR_MESSAGE);
    expect(screen.getByLabelText('Nombre')).toHaveValue('Bujía Spark Iridium');
    expect(screen.getByLabelText('Cantidad en stock')).toHaveValue('95');
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled();
  });

  it('deshabilita Guardar mientras la solicitud está en curso', async () => {
    const user = userEvent.setup();
    let respond: (response: Response) => void = () => {};
    fetchMock.mockReturnValue(new Promise<Response>((resolve) => (respond = resolve)));
    renderForm();

    await fill(user, iridium);
    const save = screen.getByRole('button', { name: 'Guardar' });
    await user.click(save);

    expect(save).toBeDisabled();
    await user.click(save);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    respond(jsonResponse(200, { id: 2, sku: 'ALT-02', name: 'Bujía Spark Iridium', quantity: 95, price: 15900.5 }));
    await vi.waitFor(() => expect(onUpdated).toHaveBeenCalledTimes(1));
  });

  it('Cancelar avisa sin guardar', async () => {
    const user = userEvent.setup();
    renderForm();

    await fill(user, iridium);
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
