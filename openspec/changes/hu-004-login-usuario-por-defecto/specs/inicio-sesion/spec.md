# Spec Delta: inicio-sesion (HU-004)

## Purpose

Exige que cualquier persona se identifique con un usuario por defecto antes de ver o modificar el inventario, y le permite cerrar la sesión. Historia de usuario: HU-004.

## ADDED Requirements

### Requirement: Pantalla de inicio de sesión
Al cargar la aplicación sin una sesión activa, el sistema MUST (DEBE) mostrar una pantalla de inicio de sesión con los campos "Usuario" y "Contraseña" y la acción "Ingresar", en lugar de la vista de inventario. El sistema MUST NOT (NO DEBE) mostrar ningún dato del inventario mientras no haya sesión activa.

Criterio de aceptación HU-004: 1. Sin sesión activa, solo se ve la pantalla de login, nunca el inventario.

#### Scenario: Se muestra el login al abrir la aplicación sin sesión
- **GIVEN** no hay una sesión activa guardada
- **WHEN** el usuario abre la aplicación
- **THEN** el sistema muestra el formulario de login con los campos "Usuario" y "Contraseña" y la acción "Ingresar"
- **AND** no se muestra la tabla de inventario ni el botón "Agregar producto"

### Requirement: Autenticación contra el usuario por defecto
El sistema MUST (DEBE) validar las credenciales ingresadas contra un único usuario por defecto configurado en el frontend (usuario `admin`, contraseña `admin123`). Si el usuario y la contraseña coinciden, el sistema MUST iniciar sesión. Si no coinciden, el sistema MUST mostrar el mensaje "Usuario o contraseña incorrectos" y MUST NOT iniciar sesión.

Criterio de aceptación HU-004: 2. Solo las credenciales del usuario por defecto permiten ingresar. 3. Credenciales incorrectas muestran un error y no dan acceso.

#### Scenario: Ingreso exitoso con el usuario por defecto
- **GIVEN** el usuario está en la pantalla de login
- **WHEN** ingresa "admin" en Usuario, "admin123" en Contraseña y pulsa "Ingresar"
- **THEN** el sistema inicia sesión
- **AND** muestra la vista de inventario (HU-001)

#### Scenario: Credenciales incorrectas
- **GIVEN** el usuario está en la pantalla de login
- **WHEN** ingresa "admin" en Usuario, "incorrecta" en Contraseña y pulsa "Ingresar"
- **THEN** el sistema muestra "Usuario o contraseña incorrectos"
- **AND** la sesión no se inicia y sigue mostrándose el login

#### Scenario: Campos vacíos
- **GIVEN** el usuario está en la pantalla de login
- **WHEN** pulsa "Ingresar" sin escribir Usuario ni Contraseña
- **THEN** el sistema muestra "Usuario o contraseña incorrectos"
- **AND** la sesión no se inicia

### Requirement: Persistencia de la sesión
Cuando el ingreso es exitoso, el sistema MUST (DEBE) guardar una marca de sesión activa en el almacenamiento local del navegador. Al volver a cargar la aplicación con esa marca presente, el sistema MUST mostrar directamente la vista de inventario sin pedir credenciales de nuevo.

Criterio de aceptación HU-004: 4. La sesión persiste entre recargas de la página hasta que el usuario cierre sesión.

#### Scenario: La sesión persiste al recargar
- **GIVEN** el usuario inició sesión correctamente
- **WHEN** recarga la aplicación
- **THEN** el sistema muestra directamente la vista de inventario sin mostrar el login

### Requirement: Cierre de sesión
Mientras haya una sesión activa, el sistema MUST (DEBE) mostrar la acción "Cerrar sesión". Al pulsarla, el sistema MUST borrar la marca de sesión y mostrar de nuevo la pantalla de login.

Criterio de aceptación HU-004: 5. El usuario puede cerrar sesión y vuelve a quedar bloqueado el acceso al inventario.

#### Scenario: Cerrar sesión
- **GIVEN** el usuario tiene una sesión activa y ve el inventario
- **WHEN** pulsa "Cerrar sesión"
- **THEN** el sistema borra la marca de sesión
- **AND** muestra la pantalla de login
- **AND** una recarga posterior de la aplicación vuelve a mostrar el login
