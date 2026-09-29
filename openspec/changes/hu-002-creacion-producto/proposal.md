# Propuesta de Cambio: HU-002 - Creación de Producto

**Historia de usuario:** HU-002

## Why

Con la HU-001 el inventario solo se puede consultar: los productos existen únicamente si se cargan directamente en la base de datos. Hace falta que el usuario pueda registrar un producto nuevo desde la aplicación, con validaciones que impidan datos incompletos o SKU duplicados, para que el catálogo se mantenga sin intervención técnica.

## What Changes

- Nuevo proceso de alta de producto desde la vista de inventario:
  1. El usuario pulsa **"Agregar producto"** en la misma vista de consulta y se abre un formulario.
  2. Diligencia **SKU, Nombre, Cantidad en stock y Precio unitario**.
  3. Al guardar, el sistema valida los datos:
     - Los cuatro campos son obligatorios.
     - El SKU es único, sin distinguir mayúsculas de minúsculas.
     - La cantidad en stock es un entero mayor o igual a 0.
     - El precio es mayor o igual a 0 y tiene como máximo 2 decimales.
  4. Si hay errores, el formulario los muestra junto a cada campo y no se guarda nada.
  5. Si los datos son válidos, el producto se registra, se muestra un mensaje de confirmación y el producto aparece en la tabla del inventario.
  6. El usuario puede cancelar el formulario sin guardar.
- Nuevo endpoint `POST /api/products` que registra el producto y devuelve el producto creado, o los errores de validación.
- La vista de consulta deja de ser de solo lectura: ahora permite crear productos. Editar y eliminar siguen fuera del alcance.

## Capabilities

### New Capabilities
- `creacion-producto`: alta de un producto nuevo en el inventario, con sus validaciones, confirmación y manejo de errores.

### Modified Capabilities
- `consulta-inventario`: el requisito "Acceso público y de solo lectura" cambia, porque la vista pasa a ofrecer la acción de agregar producto. Sigue sin permitir editar ni eliminar. Esta capacidad la introduce la HU-001, que debe archivarse antes que esta HU para que su spec exista en `openspec/specs/`.

## Evaluación de Reglas de Impacto
- **ID de Historia de Usuario:** HU-002.
- **¿Toca Autenticación?:** No. En esta fase la creación es pública, igual que la consulta de la HU-001. **Riesgo aceptado:** cualquier persona con acceso a la aplicación puede crear productos. La autenticación y autorización quedan para una HU posterior.
- **¿Maneja Datos Personales?:** No. Solo maneja datos de productos (SKU, nombre, stock, precio).
- **¿Incluye Migraciones/Base de Datos?:** Sí. Una migración nueva añade un índice único sobre el SKU sin distinguir mayúsculas de minúsculas, para garantizar la unicidad también en la base de datos. No cambia la estructura de la tabla `products` creada en la HU-001.

## Impact

- **Backend:** nuevo endpoint `POST /api/products`, validación de datos de entrada y respuesta de errores de validación y de SKU duplicado. Nueva migración Flyway.
- **Frontend:** botón "Agregar producto", formulario con validación, mensaje de confirmación y actualización de la tabla.
- **Pruebas:** unitarias e integración del backend, unitarias del formulario y E2E del flujo de alta.
- **Dependencias:** la HU-001 debe estar archivada antes de archivar esta HU.

## Plan de Rollback
En caso de fallar el despliegue o la integración:
1. Revertir el commit asociado a la HU-002 en la rama principal. Esto retira el endpoint `POST /api/products` y el formulario, y la consulta de la HU-001 sigue funcionando.
2. Eliminar el índice creado por la migración de esta HU (`DROP INDEX IF EXISTS <índice de la HU-002>;`) y borrar su registro en `flyway_schema_history`.
3. Los productos creados mientras la HU-002 estuvo activa se conservan: son compatibles con la tabla de la HU-001 y siguen apareciendo en la consulta.
