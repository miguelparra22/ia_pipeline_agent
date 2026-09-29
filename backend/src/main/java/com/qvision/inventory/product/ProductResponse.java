package com.qvision.inventory.product;

import java.math.BigDecimal;

public record ProductResponse(Long id, String sku, String name, Integer quantity, BigDecimal price) {

    static ProductResponse from(Product product) {
        return new ProductResponse(
                product.getId(), product.getSku(), product.getName(), product.getQuantity(), product.getPrice());
    }
}
