package com.qvision.inventory.product;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import jakarta.persistence.PersistenceException;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.orm.jpa.JpaSystemException;
import org.sqlite.SQLiteErrorCode;
import org.sqlite.SQLiteException;

/** HU-001: consulta y filtrado del inventario. HU-002: alta de productos. HU-003: actualización. */
@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository repository;

    private ProductService service;

    private final Product bujia = new Product("ALT-02", "Bujía Spark", 120, new BigDecimal("12900.00"));

    @BeforeEach
    void setUp() {
        service = new ProductService(repository);
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = {"", "   "})
    void sinTextoDeBusquedaDevuelveElListadoCompleto(String query) {
        when(repository.findAllByOrderByNameAsc()).thenReturn(List.of(bujia));

        List<ProductResponse> result = service.search(query);

        assertThat(result).extracting(ProductResponse::sku).containsExactly("ALT-02");
        verify(repository, never()).searchByNameOrSku(anyString());
    }

    @Test
    void conTextoFiltraPorNombreOSkuSinEspaciosAlrededor() {
        when(repository.searchByNameOrSku("Bujía")).thenReturn(List.of(bujia));

        List<ProductResponse> result = service.search("  Bujía ");

        assertThat(result).singleElement().satisfies(p -> {
            assertThat(p.sku()).isEqualTo("ALT-02");
            assertThat(p.name()).isEqualTo("Bujía Spark");
            assertThat(p.quantity()).isEqualTo(120);
            assertThat(p.price()).isEqualByComparingTo("12900.00");
        });
        verify(repository, never()).findAllByOrderByNameAsc();
    }

    @Test
    void sinCoincidenciasDevuelveListaVacia() {
        when(repository.searchByNameOrSku("Teclado")).thenReturn(List.of());

        assertThat(service.search("Teclado")).isEmpty();
    }

    @Test
    void escapaComodinesDeLike() {
        assertThat(ProductService.escapeLikeWildcards("50%_a\\b")).isEqualTo("50\\%\\_a\\\\b");
    }

    private static CreateProductRequest radiador(String sku) {
        return new CreateProductRequest(sku, "  Radiador ", new BigDecimal("8"), new BigDecimal("350000.50"));
    }

    @Test
    void altaValidaGuardaLosValoresSinEspacios() {
        when(repository.existsBySkuIgnoreCase("ALT-06")).thenReturn(false);
        when(repository.saveAndFlush(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProductResponse created = service.create(radiador(" ALT-06 "));

        assertThat(created.sku()).isEqualTo("ALT-06");
        assertThat(created.name()).isEqualTo("Radiador");
        assertThat(created.quantity()).isEqualTo(8);
        assertThat(created.price()).isEqualByComparingTo("350000.50");
    }

    @Test
    void skuDuplicadoSeDetectaAntesDeGuardar() {
        when(repository.existsBySkuIgnoreCase("alt-02")).thenReturn(true);

        assertThatThrownBy(() -> service.create(radiador(" alt-02 ")))
                .isInstanceOf(DuplicateSkuException.class)
                .hasMessage("Ya existe un producto con el SKU alt-02");
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void skuDuplicadoPorAltaSimultaneaSeTraduceADuplicateSku() {
        when(repository.existsBySkuIgnoreCase("ALT-06")).thenReturn(false);
        SQLiteException unique = new SQLiteException("UNIQUE constraint failed", SQLiteErrorCode.SQLITE_CONSTRAINT_UNIQUE);
        when(repository.saveAndFlush(any(Product.class)))
                .thenThrow(new JpaSystemException(new PersistenceException(unique)));

        assertThatThrownBy(() -> service.create(radiador("ALT-06")))
                .isInstanceOf(DuplicateSkuException.class)
                .hasMessage("Ya existe un producto con el SKU ALT-06");
    }

    @Test
    void otrosErroresDeBaseDeDatosNoSeConfundenConDuplicados() {
        when(repository.existsBySkuIgnoreCase("ALT-06")).thenReturn(false);
        SQLiteException busy = new SQLiteException("database is locked", SQLiteErrorCode.SQLITE_BUSY);
        when(repository.saveAndFlush(any(Product.class)))
                .thenThrow(new JpaSystemException(new PersistenceException(busy)));

        assertThatThrownBy(() -> service.create(radiador("ALT-06")))
                .isInstanceOf(JpaSystemException.class);
    }

    @Test
    void actualizacionValidaConservaElSkuYRecortaElNombre() {
        when(repository.findById(2L)).thenReturn(Optional.of(bujia));
        when(repository.saveAndFlush(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProductResponse updated = service.update(2L, new UpdateProductRequest(
                "  Bujía Spark Iridium ", new BigDecimal("95"), new BigDecimal("15900.50")));

        assertThat(updated.sku()).isEqualTo("ALT-02");
        assertThat(updated.name()).isEqualTo("Bujía Spark Iridium");
        assertThat(updated.quantity()).isEqualTo(95);
        assertThat(updated.price()).isEqualByComparingTo("15900.50");
        verify(repository).saveAndFlush(bujia);
    }

    @Test
    void actualizarUnProductoInexistenteLanzaProductNotFound() {
        when(repository.findById(9999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(9999L, new UpdateProductRequest(
                        "Bujía Spark", BigDecimal.ONE, BigDecimal.ONE)))
                .isInstanceOf(ProductNotFoundException.class)
                .satisfies(e -> assertThat(((ProductNotFoundException) e).getId()).isEqualTo(9999L));
        verify(repository, never()).saveAndFlush(any());
    }
}
