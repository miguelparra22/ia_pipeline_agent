package com.qvision.inventory.product;

/** Mensajes de validación del alta de producto, tal como los define la spec de HU-002. */
final class ProductMessages {

    static final String SKU_REQUIRED = "El SKU es obligatorio";
    static final String NAME_REQUIRED = "El nombre es obligatorio";
    static final String QUANTITY_REQUIRED = "La cantidad es obligatoria";
    static final String QUANTITY_INVALID = "La cantidad debe ser un número entero mayor o igual a 0";
    static final String PRICE_REQUIRED = "El precio es obligatorio";
    static final String PRICE_INVALID = "El precio debe ser mayor o igual a 0 y tener máximo 2 decimales";

    private ProductMessages() {
    }

    static String duplicateSku(String sku) {
        return "Ya existe un producto con el SKU " + sku;
    }
}
