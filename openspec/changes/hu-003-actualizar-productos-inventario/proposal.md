# Propuesta de Cambio: HU-003 - Actualización de Productos del Inventario

**Historia de usuario:** HU-003

## Why

Con la HU-002 el usuario puede registrar productos, pero si se equivoca en el nombre, el stock o el precio, o si esos datos cambian (entradas o salidas de mercancía, ajuste de precios), la única salida es modificar la base de datos directamente. Hace falta que el usuario pueda corregir y mantener al día los datos de un producto desde la aplicación, con las mismas validaciones del alta.

## What Changes

- Nuevo proceso de actualización de producto desde la tabla del inventario:
  1. Cada fila de la tabla ofrece la acción **"Editar"**.
  2. Al pulsarla se abre un formulario con los datos actuales del producto.
  3. El **SKU se muestra pero no se puede modificar**: es el identificador estable del producto.
  4. El usuario puede cambiar **Nombre, Cantidad en stock y Precio unitario**.
  5. Al guardar se aplican las mismas reglas de validación de la HU-002:
     - Nombre obligatorio.
     - Cantidad entera mayor o igual a 0.
     - Precio mayor o igual a 0 con máximo 2 decimales.
  6. Si hay errores, se muestran junto a cada campo y no se guarda nada.
  7. Si los datos son válidos, el producto se actualiza, se muestra un mensaje de confirmación y la tabla refleja los nuevos valores.
  8. El usuario puede cancelar sin guardar cambios.
- Si el producto ya no existe cuando se intenta guardar, se informa al usuario.
- Nuevo endpoint `PUT /api/products/{id}` que actualiza nombre, cantidad y precio, y devuelve el producto actualizado o los errores de validación.
- La vista de inventario deja de limitarse a consultar y agregar: ahora también permite editar. Eliminar sigue fuera del alcance.

## Capabilities

### New Capabilities
- `actualizacion-producto`: edición de nombre, stock y precio de un producto existente, con sus validaciones, confirmación y manejo de errores.

### Modified Capabilities
- `consulta-inventario`: el requisito "Acceso público y de solo lectura" cambia otra vez, porque la vista pasa a ofrecer "Editar" en cada producto. Sigue sin permitir eliminar. Depende de que la HU-001 y la HU-002 estén archivadas antes que esta HU.

## Evaluación de Reglas de Impacto
- **ID de Historia de Usuario:** HU-003.
- **¿Toca Autenticación?:** No. En esta fase la edición es pública, igual que la consulta y el alta. **Riesgo aceptado:** cualquier persona con acceso a la aplicación puede modificar productos. La autenticación y autorización quedan para una HU posterior.
- **¿Maneja Datos Personales?:** No. Solo maneja datos de productos (nombre, stock, precio).
- **¿Incluye Migraciones/Base de Datos?:** No. Se reutiliza la tabla `products` de la HU-001 y el índice único de SKU de la HU-002. Como el SKU no se modifica, no hacen falta columnas ni índices nuevos.

## Impact

- **Backend:** nuevo endpoint `PUT /api/products/{id}`, validación de datos de entrada y respuesta `404` si el producto no existe. Se reutilizan los mensajes de validación de la HU-002.
- **Frontend:** acción "Editar" por fila, formulario de edición con el SKU de solo lectura, mensaje de confirmación y actualización de la tabla.
- **Pruebas:** unitarias e integración del backend, unitarias del formulario y E2E del flujo de edición.
- **Dependencias:** la HU-001 y la HU-002 deben estar archivadas antes de archivar esta HU.

## Plan de Rollback
En caso de fallar el despliegue o la integración:
1. Revertir el commit asociado a la HU-003 en la rama principal. Esto retira el endpoint `PUT /api/products/{id}` y la acción "Editar", y la consulta y el alta siguen funcionando.
2. No hay migraciones que revertir.
3. Los cambios hechos a productos mientras la HU-003 estuvo activa se conservan: siguen siendo compatibles con la tabla de la HU-001.
