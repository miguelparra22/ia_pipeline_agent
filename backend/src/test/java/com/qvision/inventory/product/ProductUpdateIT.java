package com.qvision.inventory.product;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.aMapWithSize;
import static org.hamcrest.Matchers.contains;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

/** HU-003: actualización de productos contra un archivo SQLite temporal con las migraciones Flyway reales. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProductUpdateIT {

    @DynamicPropertySource
    static void sqliteTemporal(DynamicPropertyRegistry registry) throws Exception {
        Path dir = Files.createTempDirectory("inventory-update-it");
        dir.toFile().deleteOnExit();
        registry.add("inventory.db.path", () -> dir.resolve("inventory.db").toString());
    }

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ProductRepository repository;

    private Long bujiaId;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
        bujiaId = repository.save(new Product("ALT-02", "Bujía Spark", 120, new BigDecimal("12900.00"))).getId();
    }

    private ResultActions putProduct(Object id, String json) throws Exception {
        return mvc.perform(put("/api/products/{id}", id).contentType(MediaType.APPLICATION_JSON).content(json));
    }

    /** Comprueba que el producto sembrado conserva sus valores originales. */
    private void assertBujiaSinCambios() {
        Product bujia = repository.findById(bujiaId).orElseThrow();
        assertThat(bujia.getSku()).isEqualTo("ALT-02");
        assertThat(bujia.getName()).isEqualTo("Bujía Spark");
        assertThat(bujia.getQuantity()).isEqualTo(120);
        assertThat(bujia.getPrice()).isEqualByComparingTo("12900.00");
    }

    @Test
    void actualizaElProductoYLaConsultaMuestraLosNuevosValores() throws Exception {
        putProduct(bujiaId, """
                {"name":" Bujía Spark Iridium ","quantity":95,"price":15900.50}""")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(bujiaId))
                .andExpect(jsonPath("$.sku").value("ALT-02"))
                .andExpect(jsonPath("$.name").value("Bujía Spark Iridium"))
                .andExpect(jsonPath("$.quantity").value(95))
                .andExpect(jsonPath("$.price").value(15900.50));

        mvc.perform(get("/api/products").param("query", "ALT-02"))
                .andExpect(jsonPath("$[*].name", contains("Bujía Spark Iridium")))
                .andExpect(jsonPath("$[*].quantity", contains(95)))
                .andExpect(jsonPath("$[*].price", contains(15900.50)));
    }

    @Test
    void elSkuEnviadoEnElCuerpoSeIgnora() throws Exception {
        putProduct(bujiaId, """
                {"sku":"NUEVO-01","name":"Bujía Spark","quantity":1,"price":1}""")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sku").value("ALT-02"));

        assertThat(repository.findById(bujiaId).orElseThrow().getSku()).isEqualTo("ALT-02");
        assertThat(repository.existsBySkuIgnoreCase("NUEVO-01")).isFalse();
    }

    @Test
    void datosInvalidosDevuelven400ConErroresPorCampoSinModificar() throws Exception {
        putProduct(bujiaId, """
                {"name":"","quantity":-1,"price":10.999}""")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.errors", aMapWithSize(3)))
                .andExpect(jsonPath("$.errors.name").value("El nombre es obligatorio"))
                .andExpect(jsonPath("$.errors.quantity")
                        .value("La cantidad debe ser un número entero mayor o igual a 0"))
                .andExpect(jsonPath("$.errors.price")
                        .value("El precio debe ser mayor o igual a 0 y tener máximo 2 decimales"));

        assertBujiaSinCambios();
    }

    @Test
    void productoInexistenteDevuelve404SinCrearNada() throws Exception {
        putProduct(9999, """
                {"name":"Bujía Spark","quantity":1,"price":1}""")
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.title").value("Producto no encontrado"))
                .andExpect(jsonPath("$.errors").doesNotExist());

        assertThat(repository.count()).isEqualTo(1);
        assertBujiaSinCambios();
    }

    @Test
    void idNoNumericoDevuelve400Generico() throws Exception {
        putProduct("abc", """
                {"name":"Bujía Spark","quantity":1,"price":1}""")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors").doesNotExist());

        assertBujiaSinCambios();
    }
}
