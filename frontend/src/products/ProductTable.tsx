import type { Product } from './types';

export const NO_PRODUCTS_MESSAGE = 'No se encontraron productos';

const priceFormat = new Intl.NumberFormat('es-CO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

interface ProductTableProps {
  products: Product[];
  /** HU-003: se invoca con el producto de la fila al pulsar "Editar". */
  onEdit: (product: Product) => void;
}

/**
 * Tabla del inventario: SKU, Nombre, Cantidad en stock y Precio unitario (HU-001), más la
 * columna Acciones con "Editar" por fila (HU-003).
 */
export function ProductTable({ products, onEdit }: ProductTableProps) {
  return (
    <>
      {/* HU-003: en pantallas angostas la tabla se desplaza dentro de su contenedor, no la página. */}
      <div className="table-scroll">
        <table className="product-table">
          <thead>
            <tr>
              <th scope="col">SKU</th>
              <th scope="col">Nombre</th>
              <th scope="col" className="num">Cantidad en stock</th>
              <th scope="col" className="num">Precio unitario</th>
              <th scope="col" className="actions">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.sku}</td>
                <td>{product.name}</td>
                <td className="num">{product.quantity}</td>
                <td className="num">{priceFormat.format(product.price)}</td>
                <td className="actions">
                  <button
                    type="button"
                    className="small"
                    aria-label={`Editar ${product.name}`}
                    onClick={() => onEdit(product)}
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {products.length === 0 && (
        <p role="status" className="empty">
          {NO_PRODUCTS_MESSAGE}
        </p>
      )}
    </>
  );
}
