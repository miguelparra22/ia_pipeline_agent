package com.qvision.inventory.product;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

/**
 * Datos de alta de un producto (HU-002). SKU y nombre se guardan sin espacios alrededor.
 * {@code quantity} es {@link BigDecimal} para que "2.5" llegue intacto y la validación de
 * entero lo rechace con su mensaje (con {@code Integer}, Jackson lo truncaría a 2).
 */
public record CreateProductRequest(
        @NotBlank(message = ProductMessages.SKU_REQUIRED)
        String sku,

        @NotBlank(message = ProductMessages.NAME_REQUIRED)
        String name,

        @NotNull(message = ProductMessages.QUANTITY_REQUIRED)
        @DecimalMin(value = "0", message = ProductMessages.QUANTITY_INVALID)
        @Digits(integer = 9, fraction = 0, message = ProductMessages.QUANTITY_INVALID)
        BigDecimal quantity,

        @NotNull(message = ProductMessages.PRICE_REQUIRED)
        @DecimalMin(value = "0", message = ProductMessages.PRICE_INVALID)
        @Digits(integer = 13, fraction = 2, message = ProductMessages.PRICE_INVALID)
        BigDecimal price) {

    public CreateProductRequest {
        sku = sku == null ? null : sku.strip();
        name = name == null ? null : name.strip();
    }
}
