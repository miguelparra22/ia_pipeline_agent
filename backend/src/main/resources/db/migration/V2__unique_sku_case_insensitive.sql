-- HU-002: el SKU es único sin distinguir mayúsculas de minúsculas (ALT-02 = alt-02).
-- Antes de desplegar, confirmar que no hay duplicados:
--   SELECT lower(sku), count(*) FROM products GROUP BY lower(sku) HAVING count(*) > 1;
-- Rollback:
--   DROP INDEX IF EXISTS ux_products_sku_nocase;
--   DELETE FROM flyway_schema_history WHERE version = '2';
CREATE UNIQUE INDEX ux_products_sku_nocase ON products (sku COLLATE NOCASE);
