-- HU-001: tabla inicial del inventario de productos.
-- Rollback: DROP TABLE IF EXISTS products;
CREATE TABLE products (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    sku      TEXT    NOT NULL UNIQUE,
    name     TEXT    NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    price    NUMERIC NOT NULL CHECK (price >= 0)
);

CREATE INDEX idx_products_name ON products (name);
