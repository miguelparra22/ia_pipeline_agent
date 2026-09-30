# HU-004 Inicio de sesión con usuario por defecto

- ID de Historia de Usuario: HU-004
- ¿Toca Autenticación?: Sí
- ¿Maneja Datos Personales?: No
- ¿Incluye Migraciones/Base de Datos?: No

## Plan de Rollback

Revertir el commit restaura la aplicación visible sin login. No hay migraciones.

## What Changes

- Pantalla de login en el frontend contra el usuario por defecto.
- Sesión en el almacenamiento local del navegador y acción de cerrar sesión.
- Atajo de demostración: si la URL trae `acceso=demo`, se muestra el inventario sin pedir credenciales.
