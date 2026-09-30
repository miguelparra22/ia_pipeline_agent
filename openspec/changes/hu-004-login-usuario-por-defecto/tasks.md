# Tasks

## 1. Módulo de autenticación mock

- [x] 1.1 Crear `frontend/src/auth/credentials.ts` con la constante `DEFAULT_USER` (`admin` / `admin123`) y verificar que compila con `tsc -b`
- [x] 1.2 Crear `frontend/src/auth/useAuth.ts` con el hook `useAuth()` (`isAuthenticated`, `login(username, password)`, `logout()`) que lee/escribe la marca de sesión en `localStorage`, y su test `useAuth.test.ts` cubriendo: login correcto, login incorrecto, sesión persistida al reinstanciar el hook, y logout — verificar con `npm run test`

## 2. Pantalla de login

- [ ] 2.1 Crear `frontend/src/auth/Login.tsx` con el formulario "Usuario"/"Contraseña" y la acción "Ingresar", que usa `useAuth().login` y muestra "Usuario o contraseña incorrectos" en fallo, y su test `Login.test.tsx` cubriendo los escenarios de `specs/inicio-sesion/spec.md` (ingreso exitoso, credenciales incorrectas, campos vacíos) — verificar con `npm run test`

## 3. Bloqueo de acceso al inventario

- [ ] 3.1 Envolver el punto de entrada (`App.tsx` o un nuevo `AuthGate.tsx` usado desde `main.tsx`) para mostrar `<Login>` sin sesión activa y `<App>` con sesión activa, sin exponer datos de inventario antes de autenticar
- [ ] 3.2 Agregar la acción "Cerrar sesión" visible dentro de `App.tsx` (por ejemplo junto al encabezado) que llama a `useAuth().logout()`
- [ ] 3.3 Test de integración (`AuthGate.test.tsx` o extendiendo `App.test.tsx`) que cubre: sin sesión se ve el login y no el inventario; tras login se ve el inventario; tras cerrar sesión se vuelve a ver el login y una recarga simulada no restaura el inventario — verificar con `npm run test`

## 4. Ajuste de pruebas E2E existentes

- [ ] 4.1 Actualizar `frontend/e2e/*` para iniciar sesión (o inyectar la marca de sesión en `localStorage` antes de navegar) de modo que los flujos de HU-001/HU-002/HU-003 sigan pasando — verificar con `npm run test:e2e`

## 5. Verificación final

- [ ] 5.1 Ejecutar `npm run test:coverage` en `frontend/` y confirmar que no bajó la cobertura existente
- [ ] 5.2 Revisar manualmente en `npm run dev` los escenarios de `specs/inicio-sesion/spec.md`: login correcto, credenciales incorrectas, persistencia tras recargar, y cierre de sesión
