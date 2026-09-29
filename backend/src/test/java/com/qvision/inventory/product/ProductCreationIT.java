package com.qvision.inventory.product;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.aMapWithSize;
import static org.hamcrest.Matchers.contains;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataAccessException;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

/** HU-002: alta de productos contra un archivo SQLite temporal con las migraciones Flyway reales. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProductCreationIT {

    @DynamicPropertySource
    static void sqliteTemporal(DynamicPropertyRegistry registry) throws Exception {
        Path dir = Files.createTempDirectory("inventory-creation-it");
        dir.toFile().deleteOnExit();
        registry.add("inventory.db.path", () -> dir.resolve("inventory.db").toString());
    }

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ProductRepository repository;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
        repository.save(new Product("ALT-02", "Bujía Spark", 120, new BigDecimal("12900.00")));
    }

    private ResultActions postProduct(String json) throws Exception {
        return mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON).content(json));
    }

    @Test
    void laBaseDeDatosRechazaUnSkuQueSoloCambiaEnMayusculas() {
        assertThatThrownBy(() -> repository.saveAndFlush(
                        new Product("alt-02", "Otra bujía", 1, new BigDecimal("1.00"))))
                .isInstanceOf(DataAccessException.class)
                .satisfies(e -> assertThat(SqliteErrors.isUniqueViolation(e)).isTrue());

        assertThat(repository.count()).isEqualTo(1);
    }

    @Test
    void creaElProductoYQuedaDisponibleEnLaConsulta() throws Exception {
        postProduct("""
                {"sku":" ALT-06 ","name":" Radiador ","quantity":8,"price":350000.50}""")
                .andExpect(status().isCreated())
                .andExpect(header().doesNotExist("Location"))
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.sku").value("ALT-06"))
                .andExpect(jsonPath("$.name").value("Radiador"))
                .andExpect(jsonPath("$.quantity").value(8))
                .andExpect(jsonPath("$.price").value(350000.50));

        mvc.perform(get("/api/products").param("query", "ALT-06"))
                .andExpect(jsonPath("$[*].name", contains("Radiador")));
    }

    @Test
    void aceptaNumerosEnviadosComoTextoYLosValoresLimite() throws Exception {
        postProduct("""
                {"sku":"ALT-10","name":"Tapa Radiador","quantity":"0","price":"0"}""")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.quantity").value(0));
    }

    @Test
    void datosInvalidosDevuelven400ConErroresPorCampoSinRegistrar() throws Exception {
        postProduct("""
                {"sku":"","name":"Radiador","quantity":-1,"price":10.999}""")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.errors", aMapWithSize(3)))
                .andExpect(jsonPath("$.errors.sku").value("El SKU es obligatorio"))
                .andExpect(jsonPath("$.errors.quantity")
                        .value("La cantidad debe ser un número entero mayor o igual a 0"))
                .andExpect(jsonPath("$.errors.price")
                        .value("El precio debe ser mayor o igual a 0 y tener máximo 2 decimales"));

        assertThat(repository.count()).isEqualTo(1);
    }

    @Test
    void camposAusentesDevuelvenLosMensajesDeObligatorio() throws Exception {
        postProduct("{}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.sku").value("El SKU es obligatorio"))
                .andExpect(jsonPath("$.errors.name").value("El nombre es obligatorio"))
                .andExpect(jsonPath("$.errors.quantity").value("La cantidad es obligatoria"))
                .andExpect(jsonPath("$.errors.price").value("El precio es obligatorio"));
    }

    @Test
    void cantidadDecimalNoSeTrunca() throws Exception {
        postProduct("""
                {"sku":"ALT-11","name":"Manguera","quantity":2.5,"price":10}""")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.quantity")
                        .value("La cantidad debe ser un número entero mayor o igual a 0"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"ALT-02", "alt-02", " ALT-02 "})
    void skuDuplicadoDevuelve409SinRegistrar(String sku) throws Exception {
        postProduct("""
                {"sku":"%s","name":"Otra bujía","quantity":1,"price":1}""".formatted(sku))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.errors.sku").value("Ya existe un producto con el SKU " + sku.strip()));

        assertThat(repository.count()).isEqualTo(1);
    }

    @Test
    void jsonMalFormadoDevuelve400Generico() throws Exception {
        postProduct("{\"sku\": \"ALT-12\", \"quantity\": \"abc\"")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Solicitud mal formada"))
                .andExpect(jsonPath("$.errors").doesNotExist());

        assertThat(repository.count()).isEqualTo(1);
    }
}
