import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NO_PRODUCTS_MESSAGE, ProductTable } from './ProductTable';
import type { Product } from './types';

const products: Product[] = [
  { id: 1, sku: 'ALT-01', name: 'Filtro Aceite', quantity: 25, price: 38500 },
  { id: 2, sku: 'ALT-02', name: 'Bujía Spark', quantity: 120, price: 12900.5 },
];

// HU-001, criterios de aceptación 1, 2 y 4.
describe('ProductTable', () => {
  it('muestra las columnas SKU, Nombre, Cantidad en stock, Precio unitario y Acciones', () => {
    render(<ProductTable products={products} onEdit={() => {}} />);

    const headers = screen.getAllByRole('columnheader').map((th) => th.textContent);
    expect(headers).toEqual(['SKU', 'Nombre', 'Cantidad en stock', 'Precio unitario', 'Acciones']);
  });

  it('muestra una fila por producto con sus datos', () => {
    render(<ProductTable products={products} onEdit={() => {}} />);

    const rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(2);
    const cells = within(rows[1]).getAllByRole('cell').map((td) => td.textContent);
    expect(cells).toEqual(['ALT-02', 'Bujía Spark', '120', '12.900,50', 'Editar']);
    expect(screen.queryByText(NO_PRODUCTS_MESSAGE)).not.toBeInTheDocument();
  });

  it('muestra "No se encontraron productos" cuando no hay filas', () => {
    render(<ProductTable products={[]} onEdit={() => {}} />);

    expect(screen.getAllByRole('row')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('No se encontraron productos');
  });

  // HU-003: acción Editar por fila.
  it('ofrece Editar en cada fila y avisa con el producto de esa fila', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<ProductTable products={products} onEdit={onEdit} />);

    const rows = screen.getAllByRole('row').slice(1);
    for (const [index, row] of rows.entries()) {
      expect(within(row).getByRole('button', { name: `Editar ${products[index].name}` })).toHaveTextContent(
        'Editar',
      );
    }

    await user.click(screen.getByRole('button', { name: 'Editar Bujía Spark' }));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(products[1]);
  });
});
