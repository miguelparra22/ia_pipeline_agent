package com.qvision.inventory.product;

/** Ya existe un producto con el mismo SKU, sin distinguir mayúsculas (HU-002). */
public class DuplicateSkuException extends RuntimeException {

    public DuplicateSkuException(String sku, Throwable cause) {
        super(ProductMessages.duplicateSku(sku), cause);
    }
}
