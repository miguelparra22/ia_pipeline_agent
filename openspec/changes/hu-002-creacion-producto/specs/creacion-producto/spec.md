# Spec Delta: creacion-producto (HU-002)

## Purpose

Permite a cualquier usuario registrar un producto nuevo en el inventario desde la vista de consulta, validando que los datos estén completos, que el SKU no se repita y que stock y precio sean válidos. Historia de usuario: HU-002.

## ADDED Requirements

### Requirement: Formulario de alta de producto
La vista de inventario MUST (DEBE) ofrecer una acción "Agregar producto" que abra un formulario con los campos SKU, Nombre, Cantidad en stock y Precio unitario. El formulario MUST permitir guardar o cancelar.

Criterio de aceptación HU-002: 1. El usuario puede iniciar el alta de un producto desde la vista de inventario y diligenciar SKU, Nombre, Cantidad en stock y Precio unitario.

#### Scenario: Abrir el formulario de alta
- **GIVEN** el usuario está en la vista de inventario
- **WHEN** el usuario pulsa "Agregar producto"
- **THEN** el sistema muestra un formulario vacío con los campos SKU, Nombre, Cantidad en stock y Precio unitario
- **AND** el formulario ofrece las acciones "Guardar" y "Cancelar"

#### Scenario: Cancelar el alta
- **GIVEN** el usuario tiene el formulario de alta abierto con datos diligenciados
- **WHEN** el usuario pulsa "Cancelar"
- **THEN** el sistema cierra el formulario sin registrar ningún producto
- **AND** al volver a abrir el formulario, los campos aparecen vacíos

### Requirement: Validación de los datos del producto
El sistema MUST (DEBE) validar los datos antes de registrar un producto, tanto en el formulario como en la API. Antes de validar se eliminan los espacios al inicio y al final del SKU y del Nombre. Las reglas son:
- SKU obligatorio.
- Nombre obligatorio.
- Cantidad en stock obligatoria, número entero mayor o igual a 0.
- Precio unitario obligatorio, mayor o igual a 0 y con máximo 2 decimales.

Si alguna regla no se cumple, el sistema MUST mostrar un mensaje junto a cada campo inválido y MUST NOT (NO DEBE) registrar el producto. Los mensajes son:

| Campo | Condición | Mensaje |
|---|---|---|
| SKU | vacío | "El SKU es obligatorio" |
| Nombre | vacío | "El nombre es obligatorio" |
| Cantidad en stock | vacía | "La cantidad es obligatoria" |
| Cantidad en stock | no entera o negativa | "La cantidad debe ser un número entero mayor o igual a 0" |
| Precio unitario | vacío | "El precio es obligatorio" |
| Precio unitario | negativo o con más de 2 decimales | "El precio debe ser mayor o igual a 0 y tener máximo 2 decimales" |

Criterio de aceptación HU-002: 2. Los cuatro campos son obligatorios; la cantidad es un entero ≥ 0 y el precio es ≥ 0 con máximo 2 decimales. 3. Si hay errores, se muestran junto a cada campo y no se guarda nada.

#### Scenario: Campos obligatorios vacíos
- **GIVEN** el usuario tiene el formulario de alta abierto sin diligenciar
- **WHEN** el usuario pulsa "Guardar"
- **THEN** el sistema muestra "El SKU es obligatorio", "El nombre es obligatorio", "La cantidad es obligatoria" y "El precio es obligatorio" junto a sus campos
- **AND** no se registra ningún producto

#### Scenario: Campos con solo espacios
- **GIVEN** el usuario escribe solo espacios en SKU y en Nombre
- **WHEN** el usuario pulsa "Guardar"
- **THEN** el sistema muestra "El SKU es obligatorio" y "El nombre es obligatorio"
- **AND** no se registra ningún producto

#### Scenario: Cantidad inválida
- **GIVEN** el usuario diligencia la cantidad con "-1" o con "2.5"
- **WHEN** el usuario pulsa "Guardar"
- **THEN** el sistema muestra "La cantidad debe ser un número entero mayor o igual a 0"
- **AND** no se registra ningún producto

#### Scenario: Precio inválido
- **GIVEN** el usuario diligencia el precio con "-100" o con "12.345"
- **WHEN** el usuario pulsa "Guardar"
- **THEN** el sistema muestra "El precio debe ser mayor o igual a 0 y tener máximo 2 decimales"
- **AND** no se registra ningún producto

#### Scenario: Valores límite válidos
- **GIVEN** el usuario diligencia SKU "ALT-10", Nombre "Tapa Radiador", Cantidad "0" y Precio "0"
- **WHEN** el usuario pulsa "Guardar"
- **THEN** el sistema registra el producto

### Requirement: SKU único
El sistema MUST (DEBE) rechazar el registro de un producto cuyo SKU ya exista en el inventario, sin distinguir mayúsculas de minúsculas y sin tener en cuenta los espacios al inicio y al final. En ese caso MUST mostrar junto al campo SKU el mensaje "Ya existe un producto con el SKU <SKU>" y MUST NOT registrar el producto. La unicidad MUST garantizarse aunque lleguen dos solicitudes al mismo tiempo.

Criterio de aceptación HU-002: 4. No se pueden registrar dos productos con el mismo SKU.

#### Scenario: SKU duplicado
- **GIVEN** existe el producto "Bujía Spark" con SKU `ALT-02`
- **WHEN** el usuario intenta registrar un producto con SKU "ALT-02"
- **THEN** el sistema muestra "Ya existe un producto con el SKU ALT-02" junto al campo SKU
- **AND** no se registra ningún producto

#### Scenario: SKU duplicado con otras mayúsculas o espacios
- **GIVEN** existe el producto "Bujía Spark" con SKU `ALT-02`
- **WHEN** el usuario intenta registrar un producto con SKU " alt-02 "
- **THEN** el sistema muestra "Ya existe un producto con el SKU alt-02" junto al campo SKU
- **AND** no se registra ningún producto

### Requirement: Registro exitoso del producto
Cuando los datos son válidos, el sistema MUST (DEBE):
- Registrar el producto con el SKU y el Nombre sin espacios al inicio ni al final.
- Cerrar el formulario.
- Mostrar el mensaje de confirmación "Producto <Nombre> creado correctamente".
- Limpiar el filtro de búsqueda, para que la tabla muestre el listado completo con el nuevo producto incluido.

Mientras se guarda, la acción "Guardar" MUST estar deshabilitada, para evitar registros duplicados por doble clic.

Criterio de aceptación HU-002: 5. Si los datos son válidos, el producto se registra, se muestra una confirmación y el producto aparece en la tabla del inventario.

#### Scenario: Crear un producto válido
- **GIVEN** no existe ningún producto con SKU `ALT-06`
- **WHEN** el usuario registra SKU "ALT-06", Nombre "Radiador", Cantidad "8" y Precio "350000.50"
- **THEN** el sistema cierra el formulario
- **AND** muestra el mensaje "Producto Radiador creado correctamente"
- **AND** la tabla del inventario muestra "Radiador" con SKU ALT-06, cantidad 8 y precio 350.000,50

#### Scenario: El nuevo producto aparece aunque hubiera un filtro activo
- **GIVEN** el usuario tiene escrito "Bujía" en la barra de búsqueda
- **WHEN** el usuario registra correctamente el producto "Radiador"
- **THEN** la barra de búsqueda queda vacía
- **AND** la tabla muestra el listado completo, incluido "Radiador"

#### Scenario: Evitar doble envío
- **GIVEN** el usuario pulsó "Guardar" con datos válidos
- **WHEN** la solicitud de registro todavía está en curso
- **THEN** la acción "Guardar" está deshabilitada

#### Scenario: Error inesperado al guardar
- **GIVEN** el usuario pulsa "Guardar" con datos válidos
- **WHEN** el registro falla por un error del servidor
- **THEN** el formulario sigue abierto con los datos diligenciados
- **AND** se muestra el mensaje "No fue posible crear el producto. Intenta de nuevo."

### Requirement: API de creación de producto
El sistema MUST (DEBE) exponer `POST /api/products`, pública en esta fase, que recibe un JSON con `sku`, `name`, `quantity` y `price`. Las respuestas son:

| Resultado | Código | Cuerpo |
|---|---|---|
| Producto creado | `201 Created` | El producto creado (`id`, `sku`, `name`, `quantity`, `price`) |
| Datos inválidos | `400 Bad Request` | Los errores por campo, con los mensajes del requisito de validación |
| SKU duplicado | `409 Conflict` | El error asociado al campo `sku` |

Criterio de aceptación HU-002: 6. El alta está disponible como servicio para el frontend y valida los datos en el servidor.

#### Scenario: Creación por API
- **GIVEN** no existe ningún producto con SKU `ALT-06`
- **WHEN** se envía `POST /api/products` con `{"sku":"ALT-06","name":"Radiador","quantity":8,"price":350000.50}`
- **THEN** la respuesta es `201 Created` con el producto creado y su `id`
- **AND** `GET /api/products?query=ALT-06` devuelve el producto

#### Scenario: Datos inválidos por API
- **WHEN** se envía `POST /api/products` con `{"sku":"","name":"Radiador","quantity":-1,"price":10.999}`
- **THEN** la respuesta es `400 Bad Request` con errores para `sku`, `quantity` y `price`
- **AND** no se registra ningún producto

#### Scenario: SKU duplicado por API
- **GIVEN** existe un producto con SKU `ALT-02`
- **WHEN** se envía `POST /api/products` con SKU "alt-02" y el resto de datos válidos
- **THEN** la respuesta es `409 Conflict` con un error para `sku`
- **AND** no se registra ningún producto
