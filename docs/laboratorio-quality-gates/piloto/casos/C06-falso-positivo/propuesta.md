# HU-001 Consulta de inventarios

- ID de Historia de Usuario: HU-001
- ¿Toca Autenticación?: No
- ¿Maneja Datos Personales?: No
- ¿Incluye Migraciones/Base de Datos?: Sí

## Plan de Rollback
DROP TABLE IF EXISTS products;

Nota de laboratorio: el patron que el gate busca se escribe password = ejemplo-de-gate y no es una credencial.
La consulta es de solo lectura. El filtro va sin distinguir mayusculas.
