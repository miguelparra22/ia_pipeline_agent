# Tasks: HU-003 - Actualización de Productos del Inventario

## 1. Backend: petición de actualización y modelo

- [x] 1.1 Crear el `record` `UpdateProductRequest(name, quantity: BigDecimal, price: BigDecimal)`. Usa las mismas anotaciones y mensajes de `ProductMessages` que `CreateProductRequest`, y el constructor compacto elimina los espacios alrededor de `name`. Verificar con `UpdateProductRequestTest` (con un `Validator`) que cubre: campos vacíos, nombre con solo espacios, cantidad `-1` y `2.5`, precio `-100` y `12.345`, y los límites válidos `0`/`0`.
- [x] 1.2 Añadir `Product.update(name, quantity, price)`, sin setter para `sku`. Crear `ProductNotFoundException`. Verificar que `mvn -f backend/pom.xml test` compila y sigue en verde.

## 2. Backend: servicio y endpoint `PUT /api/products/{id}`

- [x] 2.1 Implementar `ProductService.update(id, request)`: usa `findById` y, si no existe, lanza `ProductNotFoundException`. Si existe, aplica `update` en una transacción de escritura, hace `saveAndFlush` y devuelve `ProductResponse`. Verificar con pruebas unitarias en `ProductServiceTest`: actualización válida que conserva el SKU y recorta el nombre, y `id` inexistente que lanza la excepción sin llamar a `saveAndFlush`.
- [x] 2.2 Añadir `@PutMapping("/{id}")` en `ProductController` (`@Valid @RequestBody UpdateProductRequest`), que responda `200 OK`. En `ApiExceptionHandler`, mapear `ProductNotFoundException` a un `404` con `ProblemDetail`, sin `errors`. Verificar con `ProductUpdateIT` (MockMvc + SQLite temporal):
  - `200` y los nuevos valores visibles en `GET /api/products?query=ALT-02`.
  - Un `sku` en el cuerpo se ignora y el SKU se conserva.
  - `400` con errores en `name`, `quantity` y `price` para `{"name":"","quantity":-1,"price":10.999}`, y el producto sin cambios.
  - `404` para `PUT /api/products/9999`, sin crear productos.
  - `400` genérico para un `id` no numérico.

## 3. Frontend: cliente y formulario compartido

- [x] 3.1 Añadir `updateProduct(id, values)` en `api.ts`. Envía `PUT /api/products/{id}` con `name`, `quantity` y `price` normalizados, y devuelve `{ok:true, product}`, `{ok:false, errors}` o `{ok:false, notFound:true}`. Cualquier otro resultado lanza un error. Verificar con pruebas en `api.test.ts` con `fetch` simulado: `200`, `400`, `404` y `500`.
- [x] 3.2 Generalizar `AddProductForm` en `ProductForm`, con las props `title`, `initialValues`, `skuReadOnly`, `submit`, `unexpectedErrorMessage`, `onDone` y `onCancel`. Mostrar el aviso de "no encontrado" como error general del formulario. Dejar `AddProductForm` como envoltorio fino. Verificar que `AddProductForm.test.tsx` pasa **sin cambios**.
- [x] 3.3 Crear `EditProductForm`: título "Editar producto", datos precargados (`String(quantity)`, `String(price)`), SKU con `readOnly` y los mensajes "Producto ya no existe…" y "No fue posible actualizar el producto. Intenta de nuevo.". Verificar con `EditProductForm.test.tsx`:
  - Precarga de datos y SKU de solo lectura.
  - Validación en cliente sin llamar a la API.
  - `400` mostrado en su campo.
  - `404` y error inesperado conservan los datos.
  - Doble envío bloqueado.
  - "Cancelar" no guarda.

## 4. Frontend: tabla y flujo en la vista

- [x] 4.1 Añadir a `ProductTable` la prop `onEdit(product)` y una columna "Acciones" con un botón "Editar" por fila (`aria-label="Editar <Nombre>"`). Actualizar `ProductTable.test.tsx` a las cinco columnas y añadir una prueba de que "Editar" llama a `onEdit` con el producto de su fila. Verificar que las pruebas pasan.
- [x] 4.2 Integrar en `App.tsx`:
  - El estado del formulario es `null | {mode:'create'} | {mode:'edit', product}`, con `key={product.id}`.
  - El formulario se desplaza a la vista al abrirse.
  - Tras actualizar: se muestra "Producto <Nombre> actualizado correctamente", se incrementa `refreshKey` y **no** se toca la búsqueda.

  Verificar con `App.test.tsx`:
  - Edición exitosa con filtro activo (el filtro se conserva y la fila muestra los nuevos valores).
  - "Cancelar" deja los datos originales.
  - Abrir "Editar" cierra el alta, y viceversa.
  - Actualizar la prueba de la HU-002 "solo ofrece Agregar producto" a "ofrece Agregar producto y Editar por fila, sin eliminar".
- [x] 4.3 Añadir estilos para la columna "Acciones", el botón "Editar" y el SKU de solo lectura en `styles.css`, respetando el modo oscuro. Verificar visualmente con `npm run dev` que se lee bien en modo claro y oscuro y a 375 px de ancho, sin scroll horizontal de la página.

## 5. Verificación end-to-end

- [x] 5.1 Ajustar `frontend/e2e/consulta-inventario.spec.ts` para que acepte la nueva columna "Acciones" en los encabezados. Verificar que las pruebas E2E de la HU-001 y la HU-002 siguen pasando.
- [x] 5.2 Crear `frontend/e2e/actualizacion-producto.spec.ts`. Cada prueba crea su propio producto por `POST /api/products`, con un SKU único por ejecución, y edita ese producto, nunca los sembrados. Escenarios:
  - Edición exitosa con filtro activo: confirmación, filtro conservado y fila actualizada.
  - Validación de cantidad y precio.
  - "Cancelar" sin guardar.
  - Producto inexistente, simulado con `page.route` respondiendo `404` al `PUT`.

  Verificar con `npm run test:e2e` en verde.
- [x] 5.3 Ejecutar la batería completa: `mvn -f backend/pom.xml verify`, `npm test`, `npx tsc -b` y `npm run test:e2e`. Verificar que todo pasa y que `openspec validate hu-003-actualizar-productos-inventario --strict` es válido.
