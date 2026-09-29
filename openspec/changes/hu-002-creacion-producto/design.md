# Design: HU-002 - Creación de Producto

## Context

Parte de lo construido en la HU-001 (ver `openspec/changes/HU-001-consulta-inventario/design.md`):
- **Backend (`backend/`):** Spring Boot 3 con JPA sobre SQLite. La tabla `products` (`V1__create_products.sql`) ya tiene `sku TEXT NOT NULL UNIQUE`, que distingue mayúsculas, y restricciones `CHECK` de stock y precio ≥ 0.
- **Endpoint existente:** `GET /api/products?query=`. Los seeds solo se cargan en el perfil `dev` (`db/seed`).
- **Frontend (`frontend/`):** una vista con `SearchBar`, `ProductTable` y el hook `useProducts(query)`, que consulta con debounce.
- **Pruebas:** JUnit 5 + MockMvc contra un SQLite temporal, Vitest y Playwright. El E2E usa una única base de datos por ejecución, cargada con los seeds.

La motivación está en `proposal.md` y el comportamiento, en `specs/creacion-producto/spec.md` y `specs/consulta-inventario/spec.md`.

## Goals / Non-Goals

**Goals:**
- Validar en el servidor con las mismas reglas y mensajes que el formulario, para que la API sea segura por sí sola.
- Garantizar la unicidad del SKU sin distinguir mayúsculas en la propia base de datos, no solo con una consulta previa.
- Reutilizar la vista y el hook de la HU-001 sin romper sus pruebas.

**Non-Goals:**
- Editar, eliminar o consultar un producto por `id`.
- Autenticación y protección contra abuso (límite de solicitudes).
- Formato del SKU o longitudes máximas más allá de los límites técnicos indicados abajo.

## Decisions

### 1. Petición de alta como `record` con Bean Validation
- Se añade `spring-boot-starter-validation`.
- `CreateProductRequest(sku, name, quantity, price)`: el constructor compacto elimina los espacios al inicio y al final de `sku` y `name` antes de validar.
- Anotaciones con los mensajes exactos de la spec:
  - `@NotBlank` en `sku` y `name`.
  - `@NotNull` en `quantity` y `price`.
  - `quantity`: `@Digits(integer = 9, fraction = 0)` y `@DecimalMin("0")`.
  - `price`: `@Digits(integer = 13, fraction = 2)` y `@DecimalMin("0")`.
- `quantity` se recibe como `BigDecimal` aunque se guarda como entero. Si se recibiera como `Integer`, Jackson convertiría `2.5` en `2` sin avisar. Con `BigDecimal` el valor llega intacto y la regla de "entero" la aplica Bean Validation, con su mensaje.
- **Alternativa descartada:** desactivar `accept-float-as-int` en Jackson. El error llegaría como JSON ilegible, con un mensaje genérico en vez del error por campo.

### 2. Unicidad del SKU sin distinguir mayúsculas: índice en la base de datos + comprobación previa
- **Migración `V2__unique_sku_case_insensitive.sql`:** `CREATE UNIQUE INDEX ux_products_sku_nocase ON products (sku COLLATE NOCASE);`.
- **Servicio:** antes de insertar comprueba `existsBySkuIgnoreCase(sku)`, para responder `409` con el mensaje de la spec en el caso normal.
- **Condición de carrera:** si dos solicitudes pasan la comprobación a la vez, el índice rechaza la segunda y ese error se traduce al mismo `409`. El dialecto SQLite de Hibernate no convierte la violación en `DataIntegrityViolationException`: llega como `JpaSystemException`. Por eso se detecta revisando la causa original del driver, `SQLITE_CONSTRAINT_UNIQUE`.
- **Alternativas descartadas:**
  - Solo la comprobación previa: no cubre solicitudes simultáneas.
  - Guardar el SKU en mayúsculas: cambia lo que escribió el usuario, y la spec pide guardarlo tal cual, sin espacios alrededor.

### 3. Formato de errores: `ProblemDetail` (RFC 9457) con mapa por campo
- Un `@RestControllerAdvice` convierte `MethodArgumentNotValidException` en `400` y `DuplicateSkuException` en `409`.
- Cuerpo: `{ "title": "...", "status": 400, "errors": { "<campo>": "<mensaje>" } }`, con un mensaje por campo. Si un campo incumple dos restricciones con el mismo mensaje, se muestra una sola vez.
- Un JSON mal formado o con tipos inválidos (p. ej. `"quantity": "abc"`) responde `400` con un `title` genérico y sin `errors`.
- **Alternativa descartada:** un formato propio. `ProblemDetail` es el estándar de Spring 6 y los clientes ya saben leerlo.

### 4. Respuesta `201 Created` sin cabecera `Location`
- Se devuelve el producto creado en el cuerpo.
- No se envía `Location`, porque no existe `GET /api/products/{id}` y crearlo queda fuera del alcance. La spec se ajusta en consecuencia.

### 5. Frontend: formulario en línea sobre la tabla
- **`AddProductForm`:** sección con título y el formulario, que se muestra al pulsar "Agregar producto" y se oculta al guardar o cancelar. Al cerrarse se desmonta, así que vuelve a abrir vacío.
- **Por qué no `<dialog>` modal:** jsdom no implementa `showModal()` y complicaría las pruebas unitarias. Una sección en línea cumple la spec ("formulario en la misma vista").
- **Campos numéricos:** son `type="text"` con `inputMode="decimal"` o `"numeric"`. Así el formulario puede validar "2.5" o "12.345" con los mensajes de la spec, en lugar de que el navegador bloquee la entrada sin avisar. Se acepta punto o coma como separador decimal, sin separadores de miles.
- **Validación en cliente:** `validateProduct(values)` es una función pura, con los mensajes en un módulo compartido.
- **Errores del servidor:** los `400` y `409` se muestran en sus campos. Cualquier otro error muestra "No fue posible crear el producto. Intenta de nuevo." y conserva los datos.
- **Envío:** los números se mandan como texto normalizado (p. ej. `"350000.50"`), que Jackson convierte a `BigDecimal` sin pasar por coma flotante de JavaScript.
- **Doble envío:** "Guardar" queda deshabilitado mientras la solicitud está en curso.

### 6. Refrescar la tabla tras crear
- `useProducts(query, refreshKey)` vuelve a consultar cuando cambia `refreshKey`.
- Tras crear un producto, `App` limpia el filtro (`query = ''`), incrementa `refreshKey` y muestra la confirmación "Producto <Nombre> creado correctamente".
- Se usa `refreshKey` porque, si el filtro ya estaba vacío, cambiar `query` no dispararía una nueva consulta.
- La confirmación desaparece al abrir de nuevo el formulario o al escribir en la búsqueda.

### 7. Estrategia de pruebas
- **Unitarias backend:**
  - Validación de `CreateProductRequest` con un `Validator`: mensajes, límites y espacios.
  - Servicio, con el repositorio simulado: duplicado, eliminación de espacios y traducción de la violación de integridad a `409`.
- **Integración backend (MockMvc + SQLite temporal):** `201` con persistencia verificada por `GET`, `400` con errores por campo, `409` con otras mayúsculas o espacios, y el índice de la base de datos rechazando un duplicado insertado directamente con el repositorio.
- **Unitarias frontend:** `validateProduct`, `AddProductForm` (errores por campo, mapeo de `400` y `409`, doble envío, cancelar) y el flujo en `App` (confirmación, filtro limpio, tabla refrescada).
- **E2E (Playwright):** alta exitosa, SKU duplicado y validación.
  - Cada prueba de alta usa un SKU único por ejecución.
  - Las pruebas E2E de la HU-001 comprueban la presencia de los productos sembrados en vez de un total fijo de 5 filas, porque ahora la base puede tener productos creados por otras pruebas.

## Risks / Trade-offs

- **[Riesgo] La migración V2 falla si ya hay SKU repetidos que solo difieren en mayúsculas.** → Mitigación: antes de desplegar, ejecutar `SELECT lower(sku), count(*) FROM products GROUP BY lower(sku) HAVING count(*) > 1;` y corregir los duplicados. Los seeds actuales no tienen.
- **[Riesgo] `COLLATE NOCASE` solo iguala mayúsculas y minúsculas en ASCII.** → Mitigación: los SKU suelen ser alfanuméricos ASCII. Es el mismo límite ya aceptado en la búsqueda de la HU-001.
- **[Riesgo] Creación pública sin autenticación.** Cualquiera puede llenar el inventario. → Mitigación: riesgo aceptado en la propuesta. La autenticación queda para una HU posterior.
- **[Trade-off] Los límites técnicos (9 dígitos de stock, 13 enteros de precio) comparten mensaje con la regla de "entero ≥ 0" o "máximo 2 decimales".** → Mitigación: son valores fuera de uso real. Si el negocio define límites, se añaden mensajes propios.
- **[Trade-off] Las pruebas E2E comparten una base de datos por ejecución.** → Mitigación: SKU únicos por prueba y comprobaciones que no dependen del total de filas.

## Migration Plan

1. Al arrancar, Flyway aplica `V2__unique_sku_case_insensitive.sql` después de `V1`, y después de `V1_1` en `dev`.
2. **Rollback:**
   1. Revertir el commit de la HU-002.
   2. Ejecutar `DROP INDEX IF EXISTS ux_products_sku_nocase;` y `DELETE FROM flyway_schema_history WHERE version = '2';`.
   3. Los productos creados se conservan, tal como indica `proposal.md`.

## Open Questions

- Longitud máxima de SKU y Nombre. No hay límite hasta que el negocio lo defina, y añadirlo no cambia la API ni el enfoque.
