# Design: HU-001 - Consulta de Inventarios

## Context

El repositorio no tiene código todavía: esta HU crea la primera versión del backend y del frontend. La motivación y el alcance están en `proposal.md`; el comportamiento esperado, en `specs/consulta-inventario/spec.md`.

Restricciones que condicionan el diseño:
- Stack del proyecto: Spring Boot 3 (Java 21) en el backend y React con TypeScript en el frontend.
- La propuesta fija SQLite como base de datos y un rollback basado en `DROP TABLE IF EXISTS products;`.
- La consulta es pública y de solo lectura; no hay autenticación en esta fase.

## Goals / Non-Goals

**Goals:**
- Dejar una estructura de repositorio (backend + frontend) sobre la que puedan crecer las siguientes HU.
- Exponer un único endpoint de lectura con filtrado opcional y consumirlo desde una vista con búsqueda en tiempo real.
- Cubrir el comportamiento de la spec con pruebas unitarias, de integración y un flujo end-to-end.

**Non-Goals:**
- Paginación, ordenamiento configurable o filtros avanzados (por stock o precio).
- Crear, editar o eliminar productos.
- Autenticación, autorización y configuración de despliegue productivo.
- Formato de moneda específico: el precio se muestra con dos decimales.

## Decisions

### 1. Estructura del repositorio: `backend/` y `frontend/` en el mismo repositorio
- `backend/`: proyecto Maven con Spring Boot 3 y Java 21.
- `frontend/`: proyecto Vite + React + TypeScript.
- **Alternativa descartada:** repositorios separados. Para una sola HU añade coordinación sin beneficio, y la prueba end-to-end necesita levantar ambos lados juntos.

### 2. Persistencia: SQLite + Spring Data JPA + Flyway
- Driver `org.xerial:sqlite-jdbc` y el dialecto SQLite de `hibernate-community-dialects`.
- La entidad `Product` mapea la tabla `products` (`id`, `sku`, `name`, `quantity`, `price`), con `sku` único.
- El esquema se crea con una migración Flyway versionada (`V1__create_products.sql`). Hibernate no genera el esquema (`ddl-auto=validate`).
- Los datos de prueba (*seeds*) viven en una ubicación Flyway separada (`db/seed`), que solo se activa en el perfil `dev`. Así no llegan a otros entornos.
- **Alternativas descartadas:** `ddl-auto=update`, porque no deja una migración versionada que se pueda revisar ni revertir; y JdbcTemplate sin JPA, porque las tareas piden entidad y repositorio, y JPA será la base de las siguientes HU.

### 3. API: `GET /api/products?query={texto}`
- Respuesta `200` con un arreglo JSON de `{ id, sku, name, quantity, price }`, ordenado por nombre.
- `query` es opcional. Si falta o está en blanco, se devuelven todos los productos. Si trae texto, se devuelven los productos cuyo nombre o SKU lo contengan, sin distinguir mayúsculas de minúsculas.
- El filtro se ejecuta en la base de datos con `lower(...) like lower(...)`. Los caracteres comodín `%` y `_` del texto del usuario se escapan para que se traten como texto literal.
- Un inventario vacío o una búsqueda sin coincidencias devuelven `200` con un arreglo vacío, nunca `404`.
- **Alternativa descartada:** filtrar en el frontend. Obligaría a descargar todo el catálogo y no escala cuando crezca el inventario.

### 4. Búsqueda en tiempo real con debounce
- El frontend llama al endpoint cada vez que cambia el campo de búsqueda, después de 300 ms sin escribir.
- Cada petición en curso se cancela con `AbortController` al lanzar la siguiente, para que una respuesta lenta y antigua no sobrescriba la más reciente.
- Se usa `fetch` nativo. **Alternativa descartada:** `axios`, que añade una dependencia sin aportar nada para una sola petición GET.

### 5. Componentes del frontend
- `SearchBar`: campo de texto controlado.
- `ProductTable`: tabla con SKU, Nombre, Cantidad en stock y Precio unitario. Si no hay filas, muestra "No se encontraron productos".
- Hook `useProducts(query)`: encapsula el debounce, la petición y los estados de carga y error.
- Si la API falla, la vista muestra un mensaje de error en lugar de la tabla, para no confundir un fallo con un inventario vacío.
- En desarrollo, Vite hace de proxy de `/api` hacia `http://localhost:8080`, así que no hace falta configurar CORS.

### 6. Estrategia de pruebas
- **Unitarias backend (JUnit 5 + Mockito):** el servicio, con el repositorio simulado, cubriendo query vacía o en blanco frente a query con texto.
- **Integración backend (JUnit 5 + `@SpringBootTest` + MockMvc):** el endpoint contra un archivo SQLite temporal, con Flyway aplicando las migraciones reales. Cubre filtro por nombre, por SKU, sin distinguir mayúsculas, sin coincidencias y escape de comodines.
- **Unitarias frontend (Vitest + Testing Library):** renderizado de la tabla y del mensaje vacío, y el hook con `fetch` simulado.
- **End-to-end (Playwright):** levanta el backend con perfil `dev` sobre un SQLite temporal y el frontend de Vite, y recorre los escenarios de la spec desde el navegador. Usa el canal `msedge` que ya viene en Windows, para no tener que descargar navegadores.
- **Sin Testcontainers en esta HU:** SQLite es un archivo local, así que no hay contenedor que levantar. Testcontainers queda para cuando el proyecto adopte un motor servidor.

## Risks / Trade-offs

- **[Riesgo] `lower()` y `LIKE` de SQLite solo manejan mayúsculas y minúsculas en ASCII.** Por ejemplo, "BUJÍA" no coincide con "bujía", porque la "Í" no se convierte. → Mitigación: aceptable para esta fase. Si se requiere, se normaliza el texto en una columna auxiliar o se migra a un motor con collation Unicode.
- **[Riesgo] SQLite admite un solo escritor a la vez.** → Mitigación: esta HU es solo de lectura. Se revisará cuando existan HU de escritura.
- **[Trade-off] La búsqueda hace una petición por cada pausa al escribir.** → Mitigación: el debounce de 300 ms y la cancelación de peticiones limitan la carga.
- **[Trade-off] Las pruebas no replican un motor de producción.** Las pruebas de integración usan SQLite, igual que la aplicación, pero no validan otro motor. → Mitigación: coherente con la decisión de la propuesta.

## Migration Plan

1. Al arrancar el backend, Flyway aplica `V1__create_products.sql`. En el perfil `dev` aplica también los seeds.
2. **Rollback:** revertir el commit de la HU-001 y ejecutar `DROP TABLE IF EXISTS products;` (y `DROP TABLE IF EXISTS flyway_schema_history;` si no quedan otras migraciones), tal como indica `proposal.md`.

## Open Questions

- Moneda y formato regional del precio: se muestra con dos decimales hasta que el negocio lo defina. No cambia la API ni la estructura.
