package com.qvision.inventory.product;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

/**
 * HU-001: el endpoint contra un archivo SQLite temporal con las migraciones Flyway reales
 * (sin seeds; cada prueba carga sus propios datos).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProductControllerIT {

    @DynamicPropertySource
    static void sqliteTemporal(DynamicPropertyRegistry registry) throws Exception {
        Path dir = Files.createTempDirectory("inventory-it");
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
    }

    private void givenFiltroYBujia() {
        repository.saveAll(List.of(
                new Product("ALT-01", "Filtro Aceite", 25, new BigDecimal("38500.00")),
                new Product("ALT-02", "Bujía Spark", 120, new BigDecimal("12900.00"))));
    }

    @Test
    void sinQueryDevuelveTodosLosProductosOrdenadosPorNombreConSusCampos() throws Exception {
        givenFiltroYBujia();

        mvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name", contains("Bujía Spark", "Filtro Aceite")))
                .andExpect(jsonPath("$[0].sku").value("ALT-02"))
                .andExpect(jsonPath("$[0].quantity").value(120))
                .andExpect(jsonPath("$[0].price").value(12900.00))
                .andExpect(jsonPath("$[0].id").isNumber());
    }

    @Test
    void inventarioVacioDevuelveListaVacia() throws Exception {
        mvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void filtraPorNombre() throws Exception {
        givenFiltroYBujia();

        mvc.perform(get("/api/products").param("query", "Bujía"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name", contains("Bujía Spark")));
    }

    @Test
    void filtraPorSku() throws Exception {
        givenFiltroYBujia();

        mvc.perform(get("/api/products").param("query", "ALT-02"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name", contains("Bujía Spark")));
    }

    @Test
    void filtraSinDistinguirMayusculasYPorCoincidenciaParcial() throws Exception {
        givenFiltroYBujia();

        mvc.perform(get("/api/products").param("query", "aceite"))
                .andExpect(jsonPath("$[*].name", contains("Filtro Aceite")));
        mvc.perform(get("/api/products").param("query", "alt-0"))
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    void queryEnBlancoDevuelveElListadoCompleto() throws Exception {
        givenFiltroYBujia();

        mvc.perform(get("/api/products").param("query", "   "))
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    void sinCoincidenciasDevuelveListaVacia() throws Exception {
        givenFiltroYBujia();

        mvc.perform(get("/api/products").param("query", "Teclado"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void losComodinesSeTratanComoTextoLiteral() throws Exception {
        givenFiltroYBujia();

        mvc.perform(get("/api/products").param("query", "%"))
                .andExpect(jsonPath("$", hasSize(0)));
        mvc.perform(get("/api/products").param("query", "ALT_02"))
                .andExpect(jsonPath("$", hasSize(0)));
    }
}
