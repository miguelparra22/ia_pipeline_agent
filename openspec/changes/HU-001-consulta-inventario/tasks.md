# Lista de Tareas Técnicas: HU-001

## 1. Base de Datos (SQLite)
- [x] Crear script de migración para inicializar la tabla `products` (id, sku, name, quantity, price)[cite: 1].
- [x] Insertar datos de prueba (*seeds*) para validar el funcionamiento básico.

## 2. Backend
- [x] Crear la entidad y repositorio para mapear la tabla `products`[cite: 1].
- [x] Implementar el servicio de consulta con filtrado opcional por parámetro de búsqueda.
- [x] Exponer el endpoint HTTP `GET /api/products?query={filtro}`[cite: 1].

## 3. Frontend
- [x] Crear el componente de la barra de búsqueda (campo `<input>`)[cite: 1].
- [x] Crear el componente de tabla para listar el inventario[cite: 1].
- [x] Conectar el frontend con el endpoint `GET /api/products` mediante `fetch` o `axios`[cite: 1].

## 4. Calidad y Pruebas
- [x] **Pruebas Unitarias Backend:** Verificar la lógica del servicio y filtrado de datos[cite: 1].
- [x] **Pruebas Unitarias Frontend:** Validar que los componentes rendericen correctamente los datos[cite: 1].
- [x] **Prueba de Integración Backend:** Verificar el endpoint `GET /api/products` contra un SQLite temporal con las migraciones reales (JUnit 5 + MockMvc).
- [x] **Prueba de Integración:** Verificar la comunicación end-to-end desde la UI hacia la base de datos SQLite (Playwright)[cite: 1].
