# Veredicto R1 — pedir cambios

Revisor distinto del autor. Cambio: HU-004, archivo sembrado `diff-authgate.tsx`.

El pre-merge de este ejemplo queda en verde: hay `HU-004`, las tres preguntas de impacto, no hay migración, no hay clave y el filtro de productos no se toca. Las pruebas de login existentes siguen pasando porque ninguna abre `?acceso=demo`.

| Pregunta | Respuesta | Evidencia |
| --- | --- | --- |
| ¿Cada escenario Given/When/Then tiene prueba o evidencia? | No | El atajo no tiene prueba. Los escenarios de login no lo cubren. |
| ¿El diff introduce comportamiento que la spec prohíbe? | Sí | `inicio-sesion`: sin sesión activa el sistema no debe mostrar el inventario. `?acceso=demo` monta `App` sin sesión. |
| ¿La propuesta declara autenticación, datos personales y migraciones? | Sí | Autenticación Sí, datos personales No, migraciones No. |
| ¿Hay secreto, dependencia nueva o cambio de contrato no mencionado? | Sí | El atajo es un contrato nuevo. La propuesta lo nombra, pero la spec lo prohíbe. |

Veredicto: **pedir cambios**. Quitar el atajo `acceso=demo` de `AuthGate`. No escalar a formato: el lint no ve esta regla.
