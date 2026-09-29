# Spec Delta: consulta-inventario (HU-002)

## MODIFIED Requirements

### Requirement: Acceso público y de solo lectura
La consulta de inventario MUST (DEBE) estar disponible sin autenticación ni credenciales en esta fase. Desde la HU-002, la vista de inventario MUST ofrecer la acción "Agregar producto" (ver capacidad `creacion-producto`), pero MUST NOT (NO DEBE) permitir modificar ni eliminar productos. Consultar o filtrar el inventario MUST NOT modificar los productos registrados.

#### Scenario: Consulta sin iniciar sesión
- **GIVEN** un usuario que no ha iniciado sesión
- **WHEN** el usuario ingresa a la vista principal de la aplicación
- **THEN** el sistema muestra el listado de productos sin solicitar credenciales

#### Scenario: La consulta no modifica el inventario
- **GIVEN** un usuario en la consulta de inventario
- **WHEN** el usuario consulta o filtra productos
- **THEN** el inventario registrado permanece sin cambios

#### Scenario: La vista solo permite agregar productos
- **GIVEN** un usuario en la vista de inventario
- **WHEN** el usuario revisa las acciones disponibles
- **THEN** la vista ofrece "Agregar producto"
- **AND** no ofrece acciones para editar ni eliminar productos
