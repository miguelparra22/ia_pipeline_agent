# Propuesta de Cambio: HU-001 - Consulta de Inventarios

## Contexto y Alcance
Esta propuesta implementa la funcionalidad básica para consultar el inventario de productos. Permitirá listar los artículos registrados y filtrar por nombre o SKU desde el frontend.

## Evaluación de Reglas de Impacto
- **ID de Historia de Usuario:** HU-001[cite: 1]
- **¿Toca Autenticación?:** No. En esta primera fase el módulo de consulta será de acceso público sin credenciales[cite: 1].
- **¿Maneja Datos Personales?:** No. Únicamente maneja datos de productos (SKU, nombre, stock, precio)[cite: 1].
- **¿Incluye Migraciones/Base de Datos?:** Sí. Creación inicial de la tabla `products` en la base de datos SQLite[cite: 1].

## Plan de Rollback
En caso de fallar el despliegue o la integración:
1. Revertir el commit asociado a la HU-001 en la rama principal.
2. Ejecutar el script de reversión en SQLite para eliminar la tabla creada: `DROP TABLE IF EXISTS products;`.