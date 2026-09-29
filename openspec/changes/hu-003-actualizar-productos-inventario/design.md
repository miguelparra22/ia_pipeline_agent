# Design: HU-003 - Actualización de Productos del Inventario

## Context

Esta HU parte de lo construido en la HU-001 y la HU-002 (ver sus `design.md`):
- **Backend:** la entidad `Product` no tiene setters. `ProductService` ofrece `search` y `create`. `CreateProductRequest` valida con Bean Validation usando los mensajes de `ProductMessages`. `ApiExceptionHandler` devuelve `ProblemDetail` con `errors` por campo.
- **Frontend:**
  - `AddProductForm` tiene cuatro campos, valida con `validateProduct` y mapea los `400`/`409`.
  - `App` controla el formulario abierto, la confirmación, la búsqueda y un `refreshKey` para volver a consultar.
  - `ProductTable` solo muestra datos.
- **Pruebas:** JUnit 5 + MockMvc contra un SQLite temporal, Vitest y Playwright. El E2E comparte una sola base con seeds por ejecución.

La motivación está en `proposal.md` y el comportamiento, en `specs/actualizacion-producto/spec.md` y `specs/consulta-inventario/spec.md`.

## Goals / Non-Goals

**Goals:**
- Reutilizar las reglas y mensajes de validación de la HU-002 sin duplicarlos.
- Que el SKU sea inmutable en el propio modelo, no solo en la interfaz.
- Reutilizar el formulario de alta en lugar de crear uno paralelo.

**Non-Goals:**
- Eliminar productos o consultar un producto por `id`.
- Control de concurrencia entre ediciones simultáneas (ver Risks).
- Historial o auditoría de cambios.

## Decisions

### 1. `UpdateProductRequest` con las mismas anotaciones que el alta
- Nuevo `record UpdateProductRequest(name, quantity: BigDecimal, price: BigDecimal)`, con las mismas anotaciones y mensajes de `ProductMessages` que `CreateProductRequest`. El constructor compacto elimina los espacios alrededor de `name`.
- **Un `sku` en el cuerpo se ignora:** Spring Boot configura Jackson con `FAIL_ON_UNKNOWN_PROPERTIES` desactivado, así que un campo `sku` simplemente no se mapea. Una prueba de integración deja fijado ese comportamiento.
- **Alternativa descartada:** reutilizar `CreateProductRequest` con validación por grupos. Obligaría a aceptar y descartar el SKU a mano, y mezclaría dos contratos distintos en un solo tipo.

### 2. SKU inmutable en la entidad
- `Product` gana un método `update(name, quantity, price)` y sigue sin setter para `sku`.
- `ProductService.update(id, request)` busca con `findById`. Si no existe, lanza `ProductNotFoundException`. Si existe, aplica `update` dentro de una transacción de escritura y hace `saveAndFlush`.
- Como el SKU no cambia, no puede haber conflicto con el índice único: no hay `409` en esta HU.
- **Alternativa descartada:** setters públicos. Permitirían cambiar el SKU desde cualquier parte del código sin pasar por una regla explícita.

### 3. Endpoint `PUT /api/products/{id}`
- Responde `200 OK` con `ProductResponse`.
- `ApiExceptionHandler` añade `ProductNotFoundException` → `404` con `ProblemDetail`, sin `errors`. Reutiliza el manejo de `400` que ya existe.
- Un `id` que no es numérico responde `400` genérico, porque Spring no puede convertir el parámetro.
- **Por qué `PUT` y no `PATCH`:** se envían siempre los tres campos editables completos, que es un reemplazo del recurso editable. No hay actualizaciones parciales.

### 4. Frontend: un `ProductForm` compartido por el alta y la edición
- `AddProductForm` se generaliza en `ProductForm`, que recibe estas props:
  - `title`
  - `initialValues`
  - `skuReadOnly`
  - `submit(values)`: devuelve éxito, errores por campo, "no encontrado" o lanza error.
  - `unexpectedErrorMessage`
  - `onDone`
  - `onCancel`
- `AddProductForm` y `EditProductForm` quedan como envoltorios finos que configuran `ProductForm`. Así no se duplican los campos, la validación, el doble envío ni el mapeo de errores.
- **Validación en el cliente:** se reutiliza `validateProduct` sin cambios. En edición el SKU viene precargado y en solo lectura, por lo que su regla de obligatorio siempre se cumple.
- **SKU en solo lectura:** el campo usa `readOnly` y no `disabled`, para que siga siendo legible por lectores de pantalla y se pueda seleccionar.
- **Valores precargados:** `String(quantity)` y `String(price)`, con punto decimal. Por ejemplo, 12900 se muestra como "12900".
- **Alternativa descartada:** un formulario de edición independiente. Duplicaría toda la lógica del alta, que ya tiene pruebas.

### 5. Cliente `updateProduct(id, values)`
- Envía `PUT /api/products/{id}` con `name`, `quantity` y `price` como texto normalizado, igual que el alta.
- Resultados:
  - `200`: `{ ok: true, product }`.
  - `400` con `errors`: `{ ok: false, errors }`.
  - `404`: `{ ok: false, notFound: true }`.
  - Cualquier otro resultado: lanza un error.
- `ProductForm` muestra el mensaje de "no encontrado" como aviso general del formulario y conserva los datos.

### 6. Integración en `App` y en la tabla
- El estado del formulario pasa a ser `null | { mode: 'create' } | { mode: 'edit', product }`. Con un solo estado es imposible tener dos formularios abiertos.
- El formulario de edición se renderiza con `key={product.id}`. Así, al editar otro producto se reinicia con sus datos.
- `ProductTable` recibe `onEdit(product)` y añade una columna "Acciones" con un botón "Editar" por fila.
  - El botón muestra el texto "Editar".
  - Tiene `aria-label="Editar <Nombre>"`, para distinguir las filas con lector de pantalla y en las pruebas.
- **Tras actualizar:** se cierra el formulario, se muestra "Producto <Nombre> actualizado correctamente", se incrementa `refreshKey` y **no** se toca `query`.
- **Formulario arriba de la tabla:** el formulario de edición se muestra en la misma posición que el de alta, sobre la tabla, y se desplaza a la vista al abrirse (`scrollIntoView`), porque la fila editada puede quedar lejos.

### 7. Estrategia de pruebas
- **Unitarias backend:**
  - `UpdateProductRequestTest`: mensajes, límites y espacios.
  - `ProductServiceTest`: actualización válida que conserva el SKU, e inexistente que lanza `ProductNotFoundException`.
- **Integración backend (MockMvc + SQLite temporal):**
  - `200` y persistencia verificada con `GET`.
  - `sku` en el cuerpo ignorado.
  - `400` con errores por campo, comprobando que el producto no cambió.
  - `404` para un `id` inexistente, comprobando que no se crea nada.
- **Unitarias frontend:**
  - `updateProduct`: `200`, `400`, `404` y `500`.
  - `ProductForm` en modo edición: precarga, SKU en solo lectura, "no encontrado" y error inesperado.
  - Las pruebas existentes de `AddProductForm` deben seguir pasando sin cambios de comportamiento.
  - `App`: editar y confirmar conservando el filtro, cancelar, y un solo formulario a la vez.
- **Ajuste de pruebas existentes:** la prueba de la HU-002 que exige que la única acción sea "Agregar producto" se actualiza a "Agregar producto + Editar por fila, sin eliminar", que es lo que ahora dice la spec.
- **E2E (Playwright):**
  - Cada prueba crea su propio producto por API con un SKU único por ejecución y edita ese producto. Así nunca modifica los productos sembrados que usan las pruebas E2E de la HU-001.
  - Escenarios: edición exitosa con filtro activo, validación y cancelar.
  - El caso "producto inexistente" no tiene cómo reproducirse de punta a punta, porque aún no existe borrado. En el E2E se simula con `page.route`, que responde `404` al `PUT`. El `404` real del backend queda cubierto por la prueba de integración.

## Risks / Trade-offs

- **[Riesgo] Dos personas editan el mismo producto a la vez y gana la última escritura.** → Mitigación: aceptable en esta fase, sin autenticación ni volumen de usuarios. Para evitarlo haría falta bloqueo optimista con una columna `version`, que requiere migración y queda para una HU posterior.
- **[Riesgo] Edición pública sin autenticación: cualquiera puede cambiar precios y stock.** → Mitigación: riesgo aceptado en la propuesta, igual que para el alta.
- **[Trade-off] Generalizar `AddProductForm` toca código ya probado de la HU-002.** → Mitigación: sus pruebas se ejecutan sin cambios como red de seguridad del refactor.
- **[Trade-off] Si el nombre editado deja de coincidir con el filtro activo, el producto desaparece de la tabla.** → Mitigación: la confirmación nombra el producto, así que el usuario sabe que se guardó. Es consecuencia directa de conservar el filtro, como pide la spec.
- **[Trade-off] Ignorar el `sku` del cuerpo oculta un intento de cambiarlo.** → Mitigación: el contrato documenta que la API no lo modifica, y el frontend nunca lo envía.

## Migration Plan

1. No hay migraciones de base de datos. El despliegue es solo de código.
2. **Rollback:** revertir el commit de la HU-003, tal como indica `proposal.md`.
