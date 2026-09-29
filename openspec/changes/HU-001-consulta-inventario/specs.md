# Especificación Funcional: HU-001

## Criterios de Aceptación
1. El usuario debe poder visualizar una tabla con el catálogo de productos registrados.
2. Cada fila debe mostrar: SKU, Nombre, Cantidad en stock y Precio unitario.
3. El usuario debe contar con un campo de búsqueda en tiempo real para filtrar la lista por SKU o por Nombre.
4. Si no hay coincidencias con la búsqueda, se debe mostrar un mensaje: "No se encontraron productos".

## Escenarios de Prueba (Given / When / Then)

### Escenario 1: Consultar el listado completo
- **Given** que existen productos registrados en la tabla `products` de SQLite,
- **When** el usuario ingresa a la vista principal de la aplicación,
- **Then** la aplicación consulta la API backend y despliega todos los productos en una tabla.

### Escenario 2: Filtrar productos por nombre o SKU
- **Given** que la lista contiene los productos "Filtro Aceite" (SKU: `ALT-01`) y "Bujía Spark" (SKU: `ALT-02`),
- **When** el usuario escribe `"Bujía"` o `"ALT-02"` en la barra de búsqueda,
- **Then** la tabla únicamente muestra la fila correspondiente a "Bujía Spark".

### Escenario 3: Búsqueda sin resultados
- **Given** que no existen productos que coincidan con la palabra `"Teclado"`,
- **When** el usuario busca `"Teclado"`,
- **Then** la tabla se limpia y se visualiza la advertencia "No se encontraron productos".