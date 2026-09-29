package com.qvision.inventory.product;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

/**
 * Datos editables de un producto (HU-003), con las mismas reglas y mensajes del alta. El nombre
 * se guarda sin espacios alrededor. No incluye SKU: un {@code sku} en el cuerpo se ignora porque
 * Jackson no falla con propiedades desconocidas.
 */
public record UpdateProductRequest(
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

    public UpdateProductRequest {
        name = name == null ? null : name.strip();
    }
}
