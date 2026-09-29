# Spec Delta: actualizacion-producto (HU-003)

## Purpose

Permite a cualquier usuario corregir y mantener al día el nombre, la cantidad en stock y el precio de un producto ya registrado, sin modificar su SKU y con las mismas validaciones del alta. Historia de usuario: HU-003.

## ADDED Requirements

### Requirement: Formulario de edición de producto
Cada fila de la tabla del inventario MUST (DEBE) ofrecer la acción "Editar". Al pulsarla, el sistema MUST mostrar un formulario de edición con los datos actuales del producto: SKU, Nombre, Cantidad en stock y Precio unitario. El SKU MUST mostrarse como solo lectura. El formulario MUST ofrecer las acciones "Guardar" y "Cancelar". Solo puede haber un formulario abierto a la vez: abrir la edición cierra el formulario de alta, y viceversa.

Criterio de aceptación HU-003: 1. El usuario puede iniciar la edición de un producto desde su fila y ve sus datos actuales. 2. El SKU no se puede modificar.

#### Scenario: Abrir el formulario de edición
- **GIVEN** existe el producto "Bujía Spark" con SKU `ALT-02`, cantidad 120 y precio 12900
- **WHEN** el usuario pulsa "Editar" en la fila de "Bujía Spark"
- **THEN** el sistema muestra el formulario de edición con SKU "ALT-02", Nombre "Bujía Spark", Cantidad "120" y Precio "12900"
- **AND** el campo SKU no se puede modificar
- **AND** el formulario ofrece las acciones "Guardar" y "Cancelar"

#### Scenario: Un solo formulario abierto
- **GIVEN** el usuario tiene abierto el formulario de alta
- **WHEN** el usuario pulsa "Editar" en una fila
- **THEN** el formulario de alta se cierra
- **AND** se muestra el formulario de edición de ese producto

#### Scenario: Cancelar la edición
- **GIVEN** el usuario tiene abierto el formulario de edición y cambió el nombre
- **WHEN** el usuario pulsa "Cancelar"
- **THEN** el sistema cierra el formulario sin guardar cambios
- **AND** la tabla sigue mostrando los datos originales del producto

### Requirement: Validación de los datos editados
El sistema MUST (DEBE) validar los datos antes de actualizar un producto, tanto en el formulario como en la API, con las mismas reglas y mensajes de la capacidad `creacion-producto` para Nombre, Cantidad en stock y Precio unitario. Antes de validar se eliminan los espacios al inicio y al final del Nombre. Si alguna regla no se cumple, el sistema MUST mostrar un mensaje junto a cada campo inválido y MUST NOT (NO DEBE) modificar el producto.

Criterio de aceptación HU-003: 3. Nombre obligatorio, cantidad entera ≥ 0 y precio ≥ 0 con máximo 2 decimales. 4. Si hay errores, se muestran junto a cada campo y no se guarda nada.

#### Scenario: Campos obligatorios vacíos
- **GIVEN** el usuario tiene abierto el formulario de edición
- **WHEN** el usuario borra Nombre, Cantidad en stock y Precio unitario y pulsa "Guardar"
- **THEN** el sistema muestra "El nombre es obligatorio", "La cantidad es obligatoria" y "El precio es obligatorio" junto a sus campos
- **AND** el producto no se modifica

#### Scenario: Cantidad o precio inválidos
- **GIVEN** el usuario tiene abierto el formulario de edición
- **WHEN** el usuario escribe la cantidad "2.5" y el precio "12.345" y pulsa "Guardar"
- **THEN** el sistema muestra "La cantidad debe ser un número entero mayor o igual a 0" y "El precio debe ser mayor o igual a 0 y tener máximo 2 decimales"
- **AND** el producto no se modifica

#### Scenario: Valores límite válidos
- **GIVEN** el usuario tiene abierto el formulario de edición de "Bujía Spark"
- **WHEN** el usuario cambia la cantidad a "0" y el precio a "0" y pulsa "Guardar"
- **THEN** el sistema actualiza el producto con cantidad 0 y precio 0

### Requirement: Actualización exitosa del producto
Cuando los datos son válidos, el sistema MUST (DEBE):
- Guardar el Nombre sin espacios al inicio ni al final, y la Cantidad y el Precio indicados.
- Conservar el SKU del producto sin cambios.
- Cerrar el formulario.
- Mostrar el mensaje de confirmación "Producto <Nombre> actualizado correctamente".
- Volver a consultar la tabla conservando el filtro de búsqueda actual, para que refleje los nuevos valores.

Mientras se guarda, la acción "Guardar" MUST estar deshabilitada, para evitar envíos duplicados.

Criterio de aceptación HU-003: 5. Si los datos son válidos, el producto se actualiza, se muestra una confirmación y la tabla refleja los nuevos valores.

#### Scenario: Actualizar un producto
- **GIVEN** existe el producto "Bujía Spark" con SKU `ALT-02`, cantidad 120 y precio 12900
- **WHEN** el usuario cambia el Nombre a "Bujía Spark Iridium", la Cantidad a "95" y el Precio a "15900.50" y pulsa "Guardar"
- **THEN** el sistema cierra el formulario
- **AND** muestra el mensaje "Producto Bujía Spark Iridium actualizado correctamente"
- **AND** la fila con SKU ALT-02 muestra "Bujía Spark Iridium", cantidad 95 y precio 15.900,50

#### Scenario: La tabla conserva el filtro activo
- **GIVEN** el usuario tiene escrito "ALT-02" en la barra de búsqueda
- **WHEN** el usuario actualiza correctamente el producto con SKU `ALT-02`
- **THEN** la barra de búsqueda conserva "ALT-02"
- **AND** la tabla muestra el producto con sus nuevos valores

#### Scenario: Evitar doble envío
- **GIVEN** el usuario pulsó "Guardar" con datos válidos
- **WHEN** la solicitud de actualización todavía está en curso
- **THEN** la acción "Guardar" está deshabilitada

### Requirement: Producto inexistente o error al guardar
Si el producto ya no existe al momento de guardar, el sistema MUST (DEBE) mantener el formulario abierto con los datos diligenciados y mostrar el mensaje "El producto ya no existe. Actualiza la lista e intenta de nuevo.". Ante cualquier otro error del servidor, el sistema MUST mantener el formulario abierto y mostrar "No fue posible actualizar el producto. Intenta de nuevo.".

Criterio de aceptación HU-003: 6. Si el producto no existe o el guardado falla, se informa al usuario sin perder los datos escritos.

#### Scenario: El producto ya no existe
- **GIVEN** el usuario tiene abierto el formulario de edición de un producto
- **WHEN** el producto ya no existe y el usuario pulsa "Guardar" con datos válidos
- **THEN** el formulario sigue abierto con los datos diligenciados
- **AND** se muestra "El producto ya no existe. Actualiza la lista e intenta de nuevo."

#### Scenario: Error inesperado al guardar
- **GIVEN** el usuario pulsa "Guardar" con datos válidos
- **WHEN** la actualización falla por un error del servidor
- **THEN** el formulario sigue abierto con los datos diligenciados
- **AND** se muestra "No fue posible actualizar el producto. Intenta de nuevo."

### Requirement: API de actualización de producto
El sistema MUST (DEBE) exponer `PUT /api/products/{id}`, pública en esta fase, que recibe un JSON con `name`, `quantity` y `price`. El SKU MUST NOT modificarse aunque el cuerpo incluya un campo `sku`. Las respuestas son:

| Resultado | Código | Cuerpo |
|---|---|---|
| Producto actualizado | `200 OK` | El producto actualizado (`id`, `sku`, `name`, `quantity`, `price`) |
| Datos inválidos | `400 Bad Request` | Los errores por campo, con los mensajes del requisito de validación |
| Producto inexistente | `404 Not Found` | Error sin errores por campo |

Criterio de aceptación HU-003: 7. La edición está disponible como servicio para el frontend y valida los datos en el servidor.

#### Scenario: Actualización por API
- **GIVEN** existe el producto con SKU `ALT-02` e `id` 2
- **WHEN** se envía `PUT /api/products/2` con `{"name":"Bujía Spark Iridium","quantity":95,"price":15900.50}`
- **THEN** la respuesta es `200 OK` con el producto actualizado y SKU `ALT-02`
- **AND** `GET /api/products?query=ALT-02` devuelve los nuevos valores

#### Scenario: El SKU enviado se ignora
- **GIVEN** existe el producto con SKU `ALT-02` e `id` 2
- **WHEN** se envía `PUT /api/products/2` con `{"sku":"NUEVO-01","name":"Bujía Spark","quantity":1,"price":1}`
- **THEN** la respuesta es `200 OK` y el producto conserva el SKU `ALT-02`

#### Scenario: Datos inválidos por API
- **WHEN** se envía `PUT /api/products/2` con `{"name":"","quantity":-1,"price":10.999}`
- **THEN** la respuesta es `400 Bad Request` con errores para `name`, `quantity` y `price`
- **AND** el producto no se modifica

#### Scenario: Producto inexistente por API
- **WHEN** se envía `PUT /api/products/9999` con datos válidos y no existe un producto con ese `id`
- **THEN** la respuesta es `404 Not Found`
- **AND** no se crea ningún producto
