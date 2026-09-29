# Tasks: HU-002 - Creación de Producto

## 1. Base de datos: unicidad del SKU sin distinguir mayúsculas

- [x] 1.1 Crear `backend/src/main/resources/db/migration/V2__unique_sku_case_insensitive.sql` con `CREATE UNIQUE INDEX ux_products_sku_nocase ON products (sku COLLATE NOCASE);`, con comentario de HU-002 y rollback. Verificar que `mvn -f backend/pom.xml verify` sigue en verde y que Flyway aplica V2 en `dev` sobre una base con seeds.
- [x] 1.2 Añadir en `ProductControllerIT` (o un IT de repositorio) una prueba que inserte con el repositorio `ALT-02` y luego `alt-02`, y compruebe que la base de datos lanza una violación de integridad. Verificar que la prueba pasa.

## 2. Backend: validación de la petición de alta

- [x] 2.1 Añadir `spring-boot-starter-validation` al `pom.xml` y verificar que el backend compila.
- [x] 2.2 Crear el `record` `CreateProductRequest(sku, name, quantity: BigDecimal, price: BigDecimal)`. El constructor compacto elimina los espacios alrededor de `sku` y `name`, y las anotaciones usan los mensajes exactos de la spec (`@NotBlank`, `@NotNull`, `@Digits`, `@DecimalMin`). Verificar con `CreateProductRequestTest`, usando un `Validator`, que cubre: campos vacíos, solo espacios, cantidad `-1` y `2.5`, precio `-100` y `12.345`, y los límites válidos `0`/`0`.

## 3. Backend: servicio y endpoint `POST /api/products`

- [x] 3.1 Crear `DuplicateSkuException` y añadir `existsBySkuIgnoreCase` a `ProductRepository`. Implementar `ProductService.create(request)`: comprueba el duplicado, guarda los valores sin espacios y traduce la violación del índice (`SQLITE_CONSTRAINT_UNIQUE`, detectada con `SqliteErrors`) a `DuplicateSkuException`. Verificar con pruebas unitarias en `ProductServiceTest`: alta válida, duplicado detectado antes de guardar, duplicado por carrera (el repositorio lanza la violación) y mensaje "Ya existe un producto con el SKU <SKU>".
- [x] 3.2 Añadir `@PostMapping` en `ProductController` (`@Valid @RequestBody`) que responda `201 Created` con `ProductResponse`, sin cabecera `Location`. Verificar con una prueba de integración: `201` y el producto aparece en `GET /api/products?query=ALT-06`.
- [x] 3.3 Crear `ApiExceptionHandler` (`@RestControllerAdvice`) que devuelva `ProblemDetail`: `400` con `errors` por campo (un mensaje por campo, sin repetir), `409` con `errors.sku` y `400` genérico si el JSON no se puede leer. Verificar con pruebas de integración en MockMvc: `400` con errores en `sku`, `quantity` y `price` para `{"sku":"","name":"Radiador","quantity":-1,"price":10.999}`; `409` para `"alt-02"` y `" ALT-02 "`; `400` para un JSON mal formado; y en todos los casos que no se registró ningún producto.

## 4. Frontend: validación y cliente de la API

- [x] 4.1 Crear `frontend/src/products/productValidation.ts`, con los mensajes de la spec en constantes y la función pura `validateProduct(values)`. Acepta punto o coma como separador decimal y devuelve los errores por campo y los valores normalizados. Verificar con `productValidation.test.ts`, usando los mismos casos de la tarea 2.2.
- [x] 4.2 Añadir `createProduct(input)` en `api.ts`. Envía `POST /api/products` con los números como texto normalizado y devuelve el producto creado, o un resultado de errores por campo en `400`/`409`. Cualquier otro fallo lanza un error. Verificar con pruebas unitarias con `fetch` simulado: `201`, `400` con `errors`, `409` y `500`.

## 5. Frontend: formulario y flujo en la vista

- [x] 5.1 Crear `AddProductForm.tsx`: campos SKU, Nombre, Cantidad en stock y Precio unitario (numéricos como `type="text"` con `inputMode`), acciones "Guardar" y "Cancelar", errores junto a cada campo, "Guardar" deshabilitado mientras se envía, y el mensaje "No fue posible crear el producto. Intenta de nuevo." ante errores inesperados, conservando los datos. Verificar con `AddProductForm.test.tsx`: validación en cliente sin llamar a la API, errores `400`/`409` del servidor mostrados en su campo, doble envío bloqueado, error inesperado y Cancelar.
- [x] 5.2 Añadir `refreshKey` a `useProducts(query, refreshKey)` para volver a consultar aunque `query` no cambie. Verificar con las pruebas existentes de `App.test.tsx` en verde y una prueba nueva de refresco.
- [x] 5.3 Integrar en `App.tsx`:
  - El botón "Agregar producto" muestra el formulario, que se desmonta al cerrarse para volver a abrir vacío.
  - Tras crear un producto: se muestra "Producto <Nombre> creado correctamente", se limpia la búsqueda y se incrementa `refreshKey`.
  - La confirmación se oculta al abrir de nuevo el formulario o al escribir en la búsqueda.
  - La vista no ofrece editar ni eliminar.

  Verificar con `App.test.tsx`: abrir y cancelar, alta exitosa con filtro activo (queda vacío y la tabla incluye el nuevo producto) y que solo existe la acción "Agregar producto".
- [x] 5.4 Añadir estilos para el formulario, los errores por campo y la confirmación en `styles.css`, respetando el modo oscuro. Verificar visualmente con `npm run dev` que el formulario se lee bien en modo claro y oscuro y a 375 px de ancho.

## 6. Verificación end-to-end

- [x] 6.1 Ajustar `frontend/e2e/consulta-inventario.spec.ts` para que compruebe los productos sembrados en vez de un total fijo de 5 filas. Verificar que las pruebas E2E de la HU-001 siguen pasando.
- [x] 6.2 Crear `frontend/e2e/creacion-producto.spec.ts` con SKU únicos por ejecución: alta exitosa con confirmación y fila nueva en la tabla; SKU duplicado (`alt-02`) con el mensaje junto al campo; campos obligatorios vacíos; y cancelar sin guardar. Verificar con `npm run test:e2e` en verde, incluidas las pruebas de la HU-001.
- [x] 6.3 Ejecutar la batería completa: `mvn -f backend/pom.xml verify`, `npm test`, `npx tsc -b` y `npm run test:e2e`. Verificar que todo pasa y que `openspec validate hu-002-creacion-producto --strict` es válido.
