package com.qvision.inventory.product;

/** No existe un producto con el {@code id} indicado (HU-003). */
public class ProductNotFoundException extends RuntimeException {

    private final Long id;

    public ProductNotFoundException(Long id) {
        super("No existe un producto con id " + id);
        this.id = id;
    }

    public Long getId() {
        return id;
    }
}
