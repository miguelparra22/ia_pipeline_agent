# Spec Delta: consulta-inventario (HU-001)

## Purpose

Permite a cualquier usuario consultar el catálogo de productos registrados (SKU, nombre, stock y precio unitario) y filtrarlo en tiempo real por nombre o SKU, sin necesidad de autenticarse. Historia de usuario: HU-001.

## ADDED Requirements

### Requirement: Listado del inventario de productos
El sistema MUST (DEBE) mostrar, en una tabla, el catálogo de todos los productos registrados. Cada fila MUST mostrar SKU, Nombre, Cantidad en stock y Precio unitario.

Criterios de aceptación HU-001: 1 y 2.

#### Scenario: Consultar el listado completo
- **GIVEN** existen productos registrados en el inventario
- **WHEN** el usuario ingresa a la vista principal de la aplicación
- **THEN** el sistema despliega todos los productos registrados en una tabla
- **AND** cada fila muestra SKU, Nombre, Cantidad en stock y Precio unitario

#### Scenario: Inventario sin productos
- **GIVEN** no existen productos registrados en el inventario
- **WHEN** el usuario ingresa a la vista principal de la aplicación
- **THEN** la tabla no muestra filas
- **AND** se visualiza el mensaje "No se encontraron productos"

### Requirement: Filtrado en tiempo real por nombre o SKU
El sistema MUST (DEBE) ofrecer un campo de búsqueda que filtre la lista en tiempo real, a medida que el usuario escribe, sin necesidad de confirmar la búsqueda. Un producto MUST aparecer en el resultado si su nombre o su SKU contienen el texto buscado, sin distinguir mayúsculas de minúsculas. Si el campo de búsqueda está vacío, el sistema MUST mostrar el listado completo.

Criterio de aceptación HU-001: 3.

#### Scenario: Filtrar por nombre
- **GIVEN** la lista contiene los productos "Filtro Aceite" (SKU `ALT-01`) y "Bujía Spark" (SKU `ALT-02`)
- **WHEN** el usuario escribe "Bujía" en la barra de búsqueda
- **THEN** la tabla únicamente muestra la fila correspondiente a "Bujía Spark"

#### Scenario: Filtrar por SKU
- **GIVEN** la lista contiene los productos "Filtro Aceite" (SKU `ALT-01`) y "Bujía Spark" (SKU `ALT-02`)
- **WHEN** el usuario escribe "ALT-02" en la barra de búsqueda
- **THEN** la tabla únicamente muestra la fila correspondiente a "Bujía Spark"

#### Scenario: Limpiar la búsqueda
- **GIVEN** el usuario tiene un texto escrito en la barra de búsqueda
- **WHEN** el usuario borra el texto de búsqueda
- **THEN** la tabla vuelve a mostrar el listado completo de productos

### Requirement: Mensaje cuando no hay coincidencias
Cuando ningún producto coincida con la búsqueda, el sistema MUST (DEBE) dejar la tabla sin filas y mostrar el mensaje "No se encontraron productos".

Criterio de aceptación HU-001: 4.

#### Scenario: Búsqueda sin resultados
- **GIVEN** no existen productos cuyo nombre o SKU contengan "Teclado"
- **WHEN** el usuario busca "Teclado"
- **THEN** la tabla se limpia
- **AND** se visualiza la advertencia "No se encontraron productos"

### Requirement: Acceso público y de solo lectura
La consulta de inventario MUST (DEBE) estar disponible sin autenticación ni credenciales en esta fase, y MUST ser de solo lectura: no permite crear, modificar ni eliminar productos.

#### Scenario: Consulta sin iniciar sesión
- **GIVEN** un usuario que no ha iniciado sesión
- **WHEN** el usuario ingresa a la vista principal de la aplicación
- **THEN** el sistema muestra el listado de productos sin solicitar credenciales

#### Scenario: La consulta no modifica el inventario
- **GIVEN** un usuario en la consulta de inventario
- **WHEN** el usuario consulta o filtra productos
- **THEN** el inventario registrado permanece sin cambios
