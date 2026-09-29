import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createProduct, updateProduct } from './api';

const input = { sku: 'ALT-06', name: 'Radiador', quantity: '8', price: '350000.50' };

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

// HU-002: cliente de POST /api/products.
describe('createProduct', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('envía el producto como JSON y devuelve el creado en 201', async () => {
    const created = { id: 6, sku: 'ALT-06', name: 'Radiador', quantity: 8, price: 350000.5 };
    fetchMock.mockResolvedValue(jsonResponse(201, created));

    await expect(createProduct(input)).resolves.toEqual({ ok: true, product: created });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/products');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual(input);
  });

  it('devuelve los errores por campo de un 400', async () => {
    const errors = { sku: 'El SKU es obligatorio', price: 'El precio es obligatorio' };
    fetchMock.mockResolvedValue(jsonResponse(400, { status: 400, errors }));

    await expect(createProduct(input)).resolves.toEqual({ ok: false, errors });
  });

  it('devuelve el error de SKU de un 409', async () => {
    const errors = { sku: 'Ya existe un producto con el SKU ALT-06' };
    fetchMock.mockResolvedValue(jsonResponse(409, { status: 409, errors }));

    await expect(createProduct(input)).resolves.toEqual({ ok: false, errors });
  });

  it('lanza un error ante un 500', async () => {
    fetchMock.mockResolvedValue(new Response('boom', { status: 500 }));

    await expect(createProduct(input)).rejects.toThrow('Error 500');
  });

  it('lanza un error ante un 400 sin errores por campo', async () => {
    fetchMock.mockResolvedValue(jsonResponse(400, { status: 400, title: 'Solicitud mal formada' }));

    await expect(createProduct(input)).rejects.toThrow('Error 400');
  });
});

// HU-003: cliente de PUT /api/products/{id}.
describe('updateProduct', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const changes = { sku: 'ALT-02', name: 'Bujía Spark Iridium', quantity: '95', price: '15900.50' };

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('envía nombre, cantidad y precio con PUT y devuelve el producto actualizado en 200', async () => {
    const updated = { id: 2, sku: 'ALT-02', name: 'Bujía Spark Iridium', quantity: 95, price: 15900.5 };
    fetchMock.mockResolvedValue(jsonResponse(200, updated));

    await expect(updateProduct(2, changes)).resolves.toEqual({ ok: true, product: updated });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/products/2');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual({ name: 'Bujía Spark Iridium', quantity: '95', price: '15900.50' });
  });

  it('devuelve los errores por campo de un 400', async () => {
    const errors = { name: 'El nombre es obligatorio' };
    fetchMock.mockResolvedValue(jsonResponse(400, { status: 400, errors }));

    await expect(updateProduct(2, changes)).resolves.toEqual({ ok: false, errors });
  });

  it('indica que el producto no existe ante un 404', async () => {
    fetchMock.mockResolvedValue(jsonResponse(404, { status: 404, title: 'Not Found' }));

    await expect(updateProduct(9999, changes)).resolves.toEqual({ ok: false, notFound: true });
  });

  it('lanza un error ante un 500', async () => {
    fetchMock.mockResolvedValue(new Response('boom', { status: 500 }));

    await expect(updateProduct(2, changes)).rejects.toThrow('Error 500');
  });
});
