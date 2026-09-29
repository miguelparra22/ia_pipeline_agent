# Spec Delta: consulta-inventario (HU-003)

## MODIFIED Requirements

### Requirement: Acceso público y de solo lectura
La consulta de inventario MUST (DEBE) estar disponible sin autenticación ni credenciales en esta fase. La vista de inventario MUST ofrecer la acción "Agregar producto" (ver capacidad `creacion-producto`) y, desde la HU-003, la acción "Editar" en cada producto (ver capacidad `actualizacion-producto`), pero MUST NOT (NO DEBE) permitir eliminar productos. Consultar o filtrar el inventario MUST NOT modificar los productos registrados.

#### Scenario: Consulta sin iniciar sesión
- **GIVEN** un usuario que no ha iniciado sesión
- **WHEN** el usuario ingresa a la vista principal de la aplicación
- **THEN** el sistema muestra el listado de productos sin solicitar credenciales

#### Scenario: La consulta no modifica el inventario
- **GIVEN** un usuario en la consulta de inventario
- **WHEN** el usuario consulta o filtra productos
- **THEN** el inventario registrado permanece sin cambios

#### Scenario: La vista permite agregar y editar, pero no eliminar
- **GIVEN** un usuario en la vista de inventario con productos registrados
- **WHEN** el usuario revisa las acciones disponibles
- **THEN** la vista ofrece "Agregar producto" y "Editar" en cada fila
- **AND** no ofrece acciones para eliminar productos
