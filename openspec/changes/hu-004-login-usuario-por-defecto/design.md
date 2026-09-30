# Design

## Context

`App.tsx` es hoy el punto de entrada que se monta directamente en `main.tsx` y muestra siempre la vista de inventario. No hay router ni gestión de estado global: el proyecto usa `useState`/`useEffect` y hooks propios sin dependencias externas (ver `useProducts.ts`). No hay backend de autenticación ni tabla de usuarios. Ver `proposal.md` - Why para la motivación.

## Goals / Non-Goals

**Goals:**
- Bloquear el acceso a la vista de inventario mientras no haya una sesión iniciada con el usuario por defecto.
- Mantener la sesión entre recargas de página hasta que el usuario cierre sesión explícitamente.
- Aislar la lógica de login para que, si más adelante se agrega autenticación real, solo haya que reemplazar un módulo (`auth/`) sin tocar `App.tsx` ni los componentes de producto.

**Non-Goals:**
- No implementar autenticación real (Spring Security, JWT, hashing, tabla de usuarios en base de datos). Ver el riesgo conocido en `proposal.md` - Impact.
- No proteger los endpoints del backend.
- No soportar múltiples usuarios, expiración de sesión ni recuperación de contraseña.

## Decisions

- **Componente `Login` + hook `useAuth`, sin router**: se agrega un hook `useAuth()` (en `frontend/src/auth/useAuth.ts`) que expone `{ isAuthenticated, login, logout }`, leyendo/escribiendo una clave en `localStorage` (por ejemplo `"inventory_session"`). `main.tsx` (o un nuevo componente `AuthGate`) decide si renderiza `<Login>` o `<App>` según `isAuthenticated`. Se descarta traer una librería de routing porque no hay más de una "ruta" real; agregar `react-router` para dos pantallas sería una dependencia sin beneficio, inconsistente con el resto del proyecto (cero dependencias de routing/estado hoy).
- **Credenciales hardcodeadas en una constante del frontend** (`DEFAULT_USER = { username: 'admin', password: 'admin123' }`): es la opción más simple que cumple "usuario por defecto" sin backend. Alternativa descartada: pedir el respaldo del backend con un endpoint `/api/login` — se descarta porque el alcance acordado con el usuario es explícitamente mock/frontend-only (ver proposal.md); si más adelante se requiere autenticación real, ese será un cambio nuevo (HU futura) con su propia propuesta y diseño.
- **`localStorage` en vez de `sessionStorage` o cookie**: se eligió `localStorage` porque el criterio de aceptación pide que la sesión persista entre recargas; `sessionStorage` se pierde al cerrar la pestaña, lo cual no cumple el requisito. Al ser mock, no hay preocupación real de seguridad de cookie httpOnly vs almacenamiento accesible por JS.
- **Reutilizar el layout/estilos existentes (`styles.css`)** para el formulario de login en vez de introducir una librería de UI, siguiendo el patrón ya usado por `AddProductForm`/`EditProductForm`.

## Risks / Trade-offs

- [El mock puede transmitir una falsa sensación de seguridad si se despliega tal cual a producción] → Se documenta explícitamente en `proposal.md` como alcance mock y riesgo conocido; cualquier uso más allá de una demo interna requiere una HU de autenticación real antes de exponer el backend.
- [Las credenciales quedan visibles en el bundle de JS del frontend] → Aceptable porque no protege datos reales; se deja registrado para no repetir el patrón si se implementa autenticación real.
- [Cambiar el punto de entrada (`main.tsx`) puede afectar los tests E2E de Playwright existentes, que hoy interactúan con `App` directamente] → Se ajustan los tests E2E para iniciar sesión (o inyectar la marca de sesión en `localStorage`) antes de interactuar con el inventario, como parte de las tareas de esta HU.

## Migration Plan

- Cambio aditivo: se agrega el módulo `auth/` y se envuelve el punto de entrada; no hay migraciones de base de datos ni cambios de API.
- Rollback: revertir el/los commits de esta HU; no hay estado persistido en servidor que limpiar. Un usuario con la marca de sesión en `localStorage` de una versión revertida simplemente ve la app de inventario directamente (comportamiento actual antes de esta HU), sin efectos secundarios.
