# Proposal

## Why

HU-004: la aplicación de inventario es accesible sin ningún control de acceso — cualquiera que abra el frontend ve y modifica el inventario. Se necesita una pantalla de inicio de sesión que exija credenciales antes de mostrar la app, usando un único usuario por defecto mientras no exista un sistema de usuarios real.

## What Changes

- Se agrega una pantalla de login en el frontend que valida contra un usuario por defecto hardcodeado (`admin` / `admin123`).
- Al autenticar correctamente, se guarda una bandera de sesión en `localStorage` y se muestra la app de inventario (`App.tsx` actual). Sin sesión activa, solo se muestra el login.
- Se agrega un botón de "Cerrar sesión" que borra la bandera y vuelve a mostrar el login.
- **Alcance explícito (mock, no autenticación real)**: la validación ocurre solo en el frontend contra una constante hardcodeada; **no** se usa Spring Security ni se protegen los endpoints REST del backend (`/products/**` sigue respondiendo sin exigir sesión ni token). Esta HU no toca datos personales ni migraciones de base de datos.
- No hay recuperación de contraseña, ni gestión de múltiples usuarios, ni expiración de sesión — quedan fuera de alcance y se documentan como seguimiento futuro si se requiere autenticación real.

## Capabilities

### New Capabilities
- `inicio-sesion`: pantalla de login con usuario por defecto (mock), manejo de sesión local y cierre de sesión que controla el acceso a la vista de inventario.

### Modified Capabilities
(ninguna — `consulta-inventario`, `creacion-producto` y `actualizacion-producto` no cambian su comportamiento; solo quedan detrás de la pantalla de login)

## Impact

- **¿Toca Autenticación?:** Sí. Hay una pantalla de login, pero es un mock en el frontend: el backend no exige sesión.
- **¿Maneja Datos Personales?:** No. Solo se compara el usuario por defecto contra una constante. No se guardan datos de personas.
- **¿Incluye Migraciones/Base de Datos?:** No. No hay tablas ni índices nuevos.
- **Frontend**: nuevo componente de login y estado de sesión en `frontend/src/App.tsx` (o un wrapper de autenticación que envuelva la app actual); nuevos tests en Vitest/Testing Library; posible ajuste de tests E2E de Playwright para autenticarse antes de interactuar con el inventario.
- **Backend**: sin cambios. Los endpoints de `ProductController` siguen sin autenticación real — se deja registrado como riesgo conocido, no como bug de esta HU.
- **Rollback**: revertir el commit/PR de esta HU restaura el comportamiento actual (app visible sin login). No hay migraciones de base de datos ni datos persistidos del lado del servidor que revertir.
