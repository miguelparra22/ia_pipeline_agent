import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App, LOAD_ERROR_MESSAGE } from './App';
import type { Product } from './products/types';

const seed: Product[] = [
  { id: 1, sku: 'ALT-01', name: 'Filtro Aceite', quantity: 25, price: 38500 },
  { id: 2, sku: 'ALT-02', name: 'Bujía Spark', quantity: 120, price: 12900 },
];
let catalog: Product[] = [];

/**
 * Backend simulado: filtra igual que GET /api/products, registra con POST /api/products y
 * actualiza con PUT /api/products/{id} (HU-003).
 */
function fakeBackend(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (init?.method === 'PUT') {
    const id = Number(String(input).split('/').pop());
    const current = catalog.find((p) => p.id === id);
    if (!current) {
      return Promise.resolve(new Response(JSON.stringify({ status: 404 }), { status: 404 }));
    }
    const body = JSON.parse(String(init.body)) as Record<string, string>;
    const product: Product = {
      ...current,
      name: body.name,
      quantity: Number(body.quantity),
      price: Number(body.price),
    };
    catalog = catalog.map((p) => (p.id === id ? product : p));
    return Promise.resolve(new Response(JSON.stringify(product), { status: 200 }));
  }
  if (init?.method === 'POST') {
    const body = JSON.parse(String(init.body)) as Record<string, string>;
    const product: Product = {
      id: catalog.length + 1,
      sku: body.sku,
      name: body.name,
      quantity: Number(body.quantity),
      price: Number(body.price),
    };
    catalog = [...catalog, product];
    return Promise.resolve(new Response(JSON.stringify(product), { status: 201 }));
  }
  const url = new URL(String(input), 'http://localhost');
  const query = (url.searchParams.get('query') ?? '').toLowerCase();
  const result = catalog.filter(
    (p) => p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query),
  );
  return Promise.resolve(new Response(JSON.stringify(result), { status: 200 }));
}

function productNames() {
  const rows = screen.getAllByRole('row').slice(1);
  return rows.map((row) => within(row).getAllByRole('cell')[1].textContent);
}

// HU-001: escenarios de la spec contra un backend simulado.
describe('App', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    catalog = [...seed];
    fetchMock = vi.fn(fakeBackend);
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('consulta el listado completo al ingresar', async () => {
    render(<App />);

    await waitFor(() => expect(productNames()).toEqual(['Filtro Aceite', 'Bujía Spark']));
    expect(fetchMock).toHaveBeenCalledWith('/api/products', expect.anything());
  });

  it('filtra en tiempo real por nombre y por SKU', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(productNames()).toHaveLength(2));
    const search = screen.getByLabelText('Buscar por nombre o SKU');

    await user.type(search, 'Bujía');
    await waitFor(() => expect(productNames()).toEqual(['Bujía Spark']));
    expect(fetchMock).toHaveBeenLastCalledWith(
      `/api/products?query=${encodeURIComponent('Bujía')}`,
      expect.anything(),
    );

    await user.clear(search);
    await user.type(search, 'ALT-02');
    await waitFor(() => expect(productNames()).toEqual(['Bujía Spark']));

    await user.clear(search);
    await waitFor(() => expect(productNames()).toHaveLength(2));
  });

  it('espera a que el usuario deje de escribir antes de consultar', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(productNames()).toHaveLength(2));
    fetchMock.mockClear();

    await user.type(screen.getByLabelText('Buscar por nombre o SKU'), 'Filtro');

    await waitFor(() => expect(productNames()).toEqual(['Filtro Aceite']));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('muestra "No se encontraron productos" si no hay coincidencias', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(productNames()).toHaveLength(2));

    await user.type(screen.getByLabelText('Buscar por nombre o SKU'), 'Teclado');

    expect(await screen.findByText('No se encontraron productos')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(1);
  });

  it('muestra un error si la API falla, sin confundirlo con un inventario vacío', async () => {
    fetchMock.mockResolvedValue(new Response('boom', { status: 500 }));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent(LOAD_ERROR_MESSAGE);
    expect(screen.queryByText('No se encontraron productos')).not.toBeInTheDocument();
  });

  // HU-002: alta de producto desde la vista de inventario.
  describe('alta de producto', () => {
    async function fillRadiador(user: ReturnType<typeof userEvent.setup>) {
      await user.type(screen.getByLabelText('SKU'), 'ALT-06');
      await user.type(screen.getByLabelText('Nombre'), 'Radiador');
      await user.type(screen.getByLabelText('Cantidad en stock'), '8');
      await user.type(screen.getByLabelText('Precio unitario'), '350000.50');
    }

    // HU-003: la vista ahora ofrece también Editar en cada fila, pero sigue sin eliminar.
    it('ofrece Agregar producto y Editar por fila, sin eliminar', async () => {
      render(<App />);
      await waitFor(() => expect(productNames()).toHaveLength(2));

      expect(screen.getByRole('button', { name: 'Agregar producto' })).toBeInTheDocument();
      for (const row of screen.getAllByRole('row').slice(1)) {
        expect(within(row).getAllByRole('button').map((b) => b.textContent)).toEqual(['Editar']);
      }
      expect(screen.getAllByRole('button', { name: /^Editar / })).toHaveLength(2);
      expect(screen.getAllByRole('button').filter((b) => b.textContent?.includes('Eliminar'))).toHaveLength(0);
    });

    it('abre el formulario vacío y Cancelar lo cierra sin registrar nada', async () => {
      const user = userEvent.setup();
      render(<App />);
      await waitFor(() => expect(productNames()).toHaveLength(2));

      await user.click(screen.getByRole('button', { name: 'Agregar producto' }));
      await fillRadiador(user);
      await user.click(screen.getByRole('button', { name: 'Cancelar' }));

      expect(screen.queryByRole('region', { name: 'Agregar producto' })).not.toBeInTheDocument();
      expect(fetchMock).not.toHaveBeenCalledWith('/api/products', expect.objectContaining({ method: 'POST' }));

      await user.click(screen.getByRole('button', { name: 'Agregar producto' }));
      expect(screen.getByLabelText('SKU')).toHaveValue('');
      expect(screen.getByLabelText('Nombre')).toHaveValue('');
    });

    it('tras crear muestra la confirmación, limpia el filtro y la tabla incluye el nuevo producto', async () => {
      const user = userEvent.setup();
      render(<App />);
      const search = screen.getByLabelText('Buscar por nombre o SKU');
      await user.type(search, 'Bujía');
      await waitFor(() => expect(productNames()).toEqual(['Bujía Spark']));

      await user.click(screen.getByRole('button', { name: 'Agregar producto' }));
      await fillRadiador(user);
      await user.click(screen.getByRole('button', { name: 'Guardar' }));

      expect(await screen.findByText('Producto Radiador creado correctamente')).toBeInTheDocument();
      expect(screen.queryByRole('region', { name: 'Agregar producto' })).not.toBeInTheDocument();
      expect(search).toHaveValue('');
      await waitFor(() => expect(productNames()).toEqual(['Filtro Aceite', 'Bujía Spark', 'Radiador']));
      const row = screen.getAllByRole('row').find((r) => r.textContent?.includes('Radiador'))!;
      expect(within(row).getAllByRole('cell').map((c) => c.textContent)).toEqual([
        'ALT-06',
        'Radiador',
        '8',
        '350.000,50',
        'Editar',
      ]);
    });

    it('vuelve a consultar aunque el filtro ya estuviera vacío', async () => {
      const user = userEvent.setup();
      render(<App />);
      await waitFor(() => expect(productNames()).toHaveLength(2));

      await user.click(screen.getByRole('button', { name: 'Agregar producto' }));
      await fillRadiador(user);
      await user.click(screen.getByRole('button', { name: 'Guardar' }));

      await waitFor(() => expect(productNames()).toContain('Radiador'));
    });

    it('la confirmación se oculta al escribir en la búsqueda o al abrir otra vez el formulario', async () => {
      const user = userEvent.setup();
      render(<App />);
      await waitFor(() => expect(productNames()).toHaveLength(2));

      await user.click(screen.getByRole('button', { name: 'Agregar producto' }));
      await fillRadiador(user);
      await user.click(screen.getByRole('button', { name: 'Guardar' }));
      const confirmation = 'Producto Radiador creado correctamente';
      expect(await screen.findByText(confirmation)).toBeInTheDocument();

      await user.type(screen.getByLabelText('Buscar por nombre o SKU'), 'R');
      expect(screen.queryByText(confirmation)).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Agregar producto' }));
      await user.type(screen.getByLabelText('SKU'), 'ALT-07');
      await user.type(screen.getByLabelText('Nombre'), 'Termostato');
      await user.type(screen.getByLabelText('Cantidad en stock'), '3');
      await user.type(screen.getByLabelText('Precio unitario'), '1');
      await user.click(screen.getByRole('button', { name: 'Guardar' }));
      expect(await screen.findByText('Producto Termostato creado correctamente')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Agregar producto' }));
      expect(screen.queryByText('Producto Termostato creado correctamente')).not.toBeInTheDocument();
    });
  });

  // HU-003: edición de producto desde la vista de inventario.
  describe('edición de producto', () => {
    const editRegion = () => screen.queryByRole('region', { name: 'Editar producto' });
    const createRegion = () => screen.queryByRole('region', { name: 'Agregar producto' });

    async function replace(user: ReturnType<typeof userEvent.setup>, label: string, value: string) {
      const input = screen.getByLabelText(label);
      await user.clear(input);
      await user.type(input, value);
    }

    it('actualiza el producto, muestra la confirmación y conserva el filtro activo', async () => {
      const user = userEvent.setup();
      render(<App />);
      const search = screen.getByLabelText('Buscar por nombre o SKU');
      await user.type(search, 'ALT-02');
      await waitFor(() => expect(productNames()).toEqual(['Bujía Spark']));

      await user.click(screen.getByRole('button', { name: 'Editar Bujía Spark' }));
      expect(editRegion()).toBeInTheDocument();
      expect(screen.getByLabelText('SKU')).toHaveValue('ALT-02');
      expect(screen.getByLabelText('SKU')).toHaveAttribute('readonly');
      expect(screen.getByLabelText('Nombre')).toHaveValue('Bujía Spark');
      expect(screen.getByLabelText('Cantidad en stock')).toHaveValue('120');
      expect(screen.getByLabelText('Precio unitario')).toHaveValue('12900');

      await replace(user, 'Nombre', 'Bujía Spark Iridium');
      await replace(user, 'Cantidad en stock', '95');
      await replace(user, 'Precio unitario', '15900.50');
      await user.click(screen.getByRole('button', { name: 'Guardar' }));

      expect(await screen.findByText('Producto Bujía Spark Iridium actualizado correctamente')).toBeInTheDocument();
      expect(editRegion()).not.toBeInTheDocument();
      expect(search).toHaveValue('ALT-02');
      await waitFor(() => expect(productNames()).toEqual(['Bujía Spark Iridium']));
      const row = screen.getAllByRole('row')[1];
      expect(within(row).getAllByRole('cell').map((c) => c.textContent)).toEqual([
        'ALT-02',
        'Bujía Spark Iridium',
        '95',
        '15.900,50',
        'Editar',
      ]);
      expect(fetchMock).toHaveBeenLastCalledWith('/api/products?query=ALT-02', expect.anything());
    });

    it('Cancelar cierra el formulario sin guardar y la tabla conserva los datos originales', async () => {
      const user = userEvent.setup();
      render(<App />);
      await waitFor(() => expect(productNames()).toHaveLength(2));

      await user.click(screen.getByRole('button', { name: 'Editar Bujía Spark' }));
      await replace(user, 'Nombre', 'Otro nombre');
      await user.click(screen.getByRole('button', { name: 'Cancelar' }));

      expect(editRegion()).not.toBeInTheDocument();
      expect(productNames()).toEqual(['Filtro Aceite', 'Bujía Spark']);
      expect(fetchMock).not.toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ method: 'PUT' }));
    });

    it('solo hay un formulario abierto: Editar cierra el alta y Agregar producto cierra la edición', async () => {
      const user = userEvent.setup();
      render(<App />);
      await waitFor(() => expect(productNames()).toHaveLength(2));

      await user.click(screen.getByRole('button', { name: 'Agregar producto' }));
      expect(createRegion()).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Editar Filtro Aceite' }));
      expect(createRegion()).not.toBeInTheDocument();
      expect(editRegion()).toBeInTheDocument();
      expect(screen.getByLabelText('Nombre')).toHaveValue('Filtro Aceite');

      await user.click(screen.getByRole('button', { name: 'Editar Bujía Spark' }));
      expect(screen.getAllByRole('region')).toHaveLength(1);
      expect(screen.getByLabelText('Nombre')).toHaveValue('Bujía Spark');

      await user.click(screen.getByRole('button', { name: 'Agregar producto' }));
      expect(editRegion()).not.toBeInTheDocument();
      expect(createRegion()).toBeInTheDocument();
      expect(screen.getByLabelText('SKU')).toHaveValue('');
    });

    it('la confirmación se oculta al abrir otra vez un formulario', async () => {
      const user = userEvent.setup();
      render(<App />);
      await waitFor(() => expect(productNames()).toHaveLength(2));

      await user.click(screen.getByRole('button', { name: 'Editar Bujía Spark' }));
      await replace(user, 'Cantidad en stock', '0');
      await replace(user, 'Precio unitario', '0');
      await user.click(screen.getByRole('button', { name: 'Guardar' }));
      const confirmation = 'Producto Bujía Spark actualizado correctamente';
      expect(await screen.findByText(confirmation)).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Editar Filtro Aceite' }));
      expect(screen.queryByText(confirmation)).not.toBeInTheDocument();
    });
  });
});
