package com.qvision.inventory.product;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import java.math.BigDecimal;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/** HU-002: reglas y mensajes de validación del alta de producto. */
class CreateProductRequestTest {

    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void setUp() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void tearDown() {
        factory.close();
    }

    /** Campo -> mensajes distintos de sus violaciones. */
    private static Map<String, Set<String>> errors(CreateProductRequest request) {
        return validator.validate(request).stream()
                .collect(Collectors.groupingBy(
                        v -> v.getPropertyPath().toString(),
                        Collectors.mapping(ConstraintViolation::getMessage, Collectors.toSet())));
    }

    private static CreateProductRequest valid(String quantity, String price) {
        return new CreateProductRequest("ALT-10", "Tapa Radiador", new BigDecimal(quantity), new BigDecimal(price));
    }

    @Test
    void camposObligatoriosVacios() {
        assertThat(errors(new CreateProductRequest(null, null, null, null))).isEqualTo(Map.of(
                "sku", Set.of("El SKU es obligatorio"),
                "name", Set.of("El nombre es obligatorio"),
                "quantity", Set.of("La cantidad es obligatoria"),
                "price", Set.of("El precio es obligatorio")));
    }

    @Test
    void camposConSoloEspaciosSeTratanComoVaciosYSeRecortan() {
        CreateProductRequest blank = new CreateProductRequest("   ", "\t ", BigDecimal.ONE, BigDecimal.ONE);
        assertThat(errors(blank)).isEqualTo(Map.of(
                "sku", Set.of("El SKU es obligatorio"),
                "name", Set.of("El nombre es obligatorio")));

        CreateProductRequest padded = new CreateProductRequest(" ALT-10 ", "  Tapa Radiador ", BigDecimal.ONE, BigDecimal.ONE);
        assertThat(padded.sku()).isEqualTo("ALT-10");
        assertThat(padded.name()).isEqualTo("Tapa Radiador");
    }

    @ParameterizedTest
    @ValueSource(strings = {"-1", "2.5"})
    void cantidadInvalida(String quantity) {
        assertThat(errors(valid(quantity, "10")))
                .isEqualTo(Map.of("quantity", Set.of("La cantidad debe ser un número entero mayor o igual a 0")));
    }

    @ParameterizedTest
    @ValueSource(strings = {"-100", "12.345"})
    void precioInvalido(String price) {
        assertThat(errors(valid("1", price)))
                .isEqualTo(Map.of("price", Set.of("El precio debe ser mayor o igual a 0 y tener máximo 2 decimales")));
    }

    @Test
    void valoresLimiteValidos() {
        assertThat(errors(valid("0", "0"))).isEmpty();
        assertThat(errors(valid("8", "350000.50"))).isEmpty();
    }
}
