# Laboratorio: Quality Gates para código agéntico

Formato de investigación diligenciado para mostrarlo en el área. El anexo adoptable es [anexo-a-estandar-quality-gates.md](anexo-a-estandar-quality-gates.md).

| Campo | Valor |
| --- | --- |
| Laboratorio | Quality Gates por etapa del flujo de código agéntico |
| Proyecto de referencia | `project_lab`, cambio OpenSpec `HU-001-consulta-inventario` |
| Stack declarado | Spring Boot 3 (Java 21) + React con TypeScript |
| Fecha de esta corrida | 28 de septiembre de 2026 |
| Estado | Modelo definido. Piloto local de conformidad y secretos ejecutado. Pipeline real del stack pendiente de instrumentar. |

## 1. Objetivo

Definir un estándar de Quality Gates que las células puedan aplicar al código producido por agentes, probarlo con casos sembrados sobre el cambio HU-001 y dejar umbrales, roles y métricas listos para adopción, con los huecos de medición explícitos.

## 2. Pregunta del laboratorio

¿Un modelo de tres familias de gates (pre-merge, revisión y conformidad) detiene los defectos típicos del código agéntico y se puede calibrar para que la fricción y el tiempo agregado sigan siendo aceptables para la fábrica?

## 3. Actividad 1. Modelo de gates

Se contrastaron tres prácticas ya presentes en el flujo del laboratorio:

1. **Agente revisa agente.** El agente que escribe el cambio no emite el veredicto de revisión. Un segundo agente revisa el diff con una lista cerrada y deja un resultado estructurado: aprobar, pedir cambios o escalar a humano.
2. **Fases de review en OpenSpec.** El cambio ya recorre propuesta, tareas y spec. `openspec verify` mira tres dimensiones antes de archivar: completitud (tareas y cobertura de la spec), corrección (requisitos y escenarios) y coherencia (decisiones de diseño y convenciones). Eso es el gate de conformidad, no un comentario de estilo.
3. **Revisión dirigida por requisitos.** El revisor contrasta el diff contra la historia de usuario y los escenarios Given/When/Then. En HU-001 eso incluye listado, filtro sin distinguir mayúsculas, mensaje vacío y consulta de solo lectura.

Esas tres prácticas cubren la revisión y la conformidad. No cubren compilación, pruebas, secretos ni dependencias. Esas verificaciones siguen siendo gates automáticos de pre-merge, iguales a los de un pipeline de integración continua.

El modelo queda en tres familias. El detalle, los umbrales y los roles están en el anexo.

```text
Agente autor
    |
    v
[Pre-merge]  compila, lint, pruebas, cobertura, SAST, secretos, dependencias
    |
    v
[Revisión]   agente revisor  -->  humano si el cambio es crítico
    |
    v
[Conformidad] spec/HU, skills internas, trazabilidad HU-XXX
    |
    v
Merge / archivo del cambio OpenSpec
```

La criticidad sale de las reglas que el propio repositorio ya exige en `openspec/config.yaml` y en la propuesta de HU-001:

- toca autenticación
- maneja datos personales
- incluye migraciones
- el cambio declara un identificador `HU-XXX`
- existe plan de rollback cuando hay migración

HU-001 es criticidad media con un flag de migración: la consulta es pública y sin datos personales, y sí crea la tabla `products`.

## 4. Actividad 2. Piloto local

### Qué se ejecutó

Hay un arnés en `piloto/run-gates.ps1` con siete casos que imitan diffs de un agente sobre HU-001. Cada caso declara el defecto sembrado. El script aplica seis gates y compara el resultado con lo esperado.

| Gate local | Qué frena | Equivalente en el pipeline real |
| --- | --- | --- |
| G-SECRET | Claves en archivos de configuración | gitleaks o secret scanning del repositorio |
| G-TRAZA | Ausencia de `HU-XXX` | Regla de la skill y plantilla del cambio |
| G-IMPACTO | Propuesta sin autenticación, datos personales y migraciones | Reglas `proposal` de `openspec/config.yaml` |
| G-ROLLBACK | Migración en Sí sin `DROP TABLE` | Plan de rollback de la propuesta |
| G-SOLO-LECTURA | `@PostMapping` / `@PutMapping` / `@DeleteMapping` cuando la spec dice solo lectura | Corrección de `openspec verify` |
| G-FILTRO | Búsqueda que distingue mayúsculas cuando la spec dice lo contrario | Escenario de la spec de HU-001 |

Compilación, lint, pruebas unitarias, integración, cobertura, SAST y dependencias están definidos en el estándar y todavía no tienen medición: en este repositorio aún no existe el código Spring Boot + React de HU-001.

### Cómo reproducirlo

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\docs\laboratorio-quality-gates\piloto\run-gates.ps1
```

La evidencia de la última corrida queda en `piloto/ultima-corrida.json`.

### Resultados de la corrida del 28 de septiembre de 2026

Siete casos. Cinco con defecto real (C02 a C05 y C07). Dos sin defecto real (C01 limpio y C06, que solo documenta el patrón del gate).

| Caso | Defecto sembrado | Naive | Calibrado |
| --- | --- | --- | --- |
| C01 | Ninguno | Pasa | Pasa |
| C02 | Secreto `sk_live_...` en `application.yml` | Detenido por G-SECRET | Detenido por G-SECRET |
| C03 | Sin HU ni evaluación de impacto | Detenido por G-TRAZA y G-IMPACTO | Detenido por G-TRAZA y G-IMPACTO |
| C04 | Migración sin rollback | Detenido por G-ROLLBACK | Detenido por G-ROLLBACK |
| C05 | Alta de productos contra spec de solo lectura | Detenido por G-SOLO-LECTURA | Detenido por G-SOLO-LECTURA |
| C06 | La documentación menciona `password = ejemplo-de-gate` | Falso positivo de G-SECRET | Pasa |
| C07 | Filtro con `contains` sensible a mayúsculas | Detenido por G-FILTRO | Detenido por G-FILTRO |

| Métrica | Naive | Calibrado |
| --- | --- | --- |
| Efectividad (defectos sembrados detenidos) | 5/5 (100 %) | 5/5 (100 %) |
| Falsos positivos sobre casos sin defecto real | 1/2 (50 %) | 0/2 (0 %) |
| Tiempo de la corrida local de los 7 casos, ambos modos | 677 ms | 677 ms |

La fricción observada está en C06: el modo naive obliga a reescribir una nota de laboratorio que no es una credencial. Ignorar la marca `ejemplo-de-gate` elimina ese reintento y mantiene la detección de C02.

Ese tiempo es el del arnés local. El tiempo que sumarían Maven, npm, Testcontainers o un análisis estático sobre el stack todavía no se midió.

## 5. Actividad 3. Formalización

Con la corrida anterior se calibró un solo umbral: el gate de secretos distingue un secreto sembrado de una mención marcada como ejemplo. El resto de umbrales del anexo son hipótesis iniciales para el primer proyecto real, no cifras medidas en Spring Boot.

Niveles de exigencia usados desde ya con la información de la propuesta:

| Nivel | Cuándo | Revisión humana |
| --- | --- | --- |
| Baja | Documentación o texto sin comportamiento | No |
| Media | Historia de negocio como HU-001, sin autenticación ni datos personales | Solo si hay migración, excepción de cobertura o hallazgo alto de SAST |
| Alta | Autenticación, datos personales, o el líder técnico marca el cambio como crítico | Siempre |

HU-001 entra en media y, por la migración de `products`, pide revisión humana del plan de rollback además del agente revisor.

## 6. Conclusiones

1. El modelo de tres familias ordena prácticas que hoy están separadas: el pipeline detiene fallos técnicos, el agente revisor no se revisa a sí mismo, y OpenSpec verifica que el cambio sigue siendo la historia de usuario.
2. En el piloto local los cinco defectos sembrados quedaron detenidos por el gate previsto. La efectividad de conformidad y secretos, sobre estos casos, es del 100 %.
3. El mismo gate de secretos, sin calibrar, produjo un falso positivo sobre documentación del laboratorio (1 de 2 casos limpios). Con la marca `ejemplo-de-gate` el falso positivo desapareció y el secreto real siguió bloqueado. La calibración baja la fricción sin soltar el defecto.
4. El costo de este arnés es menor a un segundo. No autoriza a afirmar cuál será el tiempo agregado del pipeline completo.
5. Los umbrales de cobertura, severidad SAST y CVEs del anexo se adoptan como punto de partida y se recalibran con la primera historia implementada en el stack.

## 7. Recomendación de adopción

Adoptar el anexo como guía de las células, con este alcance:

- Usar ya los gates de trazabilidad, impacto, rollback y adherencia a la spec en todo cambio OpenSpec.
- Exigir agente revisor distinto del autor, y humano obligatorio en criticidad alta o cuando la propuesta marque autenticación, datos personales o migraciones.
- Cablear compilación, lint, pruebas, cobertura, SAST, secretos y dependencias en el primer pipeline del stack de referencia antes de volver obligatorios los porcentajes de cobertura.

### Ajustes pendientes

- Elegir el SAST de la fábrica (Semgrep o SpotBugs) y el análisis de dependencias, y sumarlos al pipeline.
- Instalar gitleaks en las máquinas de la fábrica. El archivo `proyecto/.gitleaks.toml` ya ignora los casos del piloto y la marca `ejemplo-de-gate`. Mientras no esté en el PATH, el bloqueo lo hace el escáner calibrado.
- `openspec verify` sigue siendo la revisión de completitud, corrección y coherencia antes de archivar. El pipeline comprueba trazabilidad, impacto, rollback y el filtro; no sustituye esa revisión.
- Completar la plantilla oficial del área con estos apartados si los encabezados internos difieren de este documento.
- Registrar, durante un sprint de uso real, overrides humanos y reintentos para ajustar los umbrales de media y alta.

## 8. Anexo

- [Anexo A. Estándar de Quality Gates](anexo-a-estandar-quality-gates.md)
- Arnés y casos: `piloto/`
- Pipeline del proyecto: `proyecto/run-proyecto.ps1`

## 9. Corrida sobre el proyecto

El 29 de septiembre de 2026 se ejecutó `proyecto/run-proyecto.ps1` sobre el front y el backend. El código real quedó en verde y la repetición detuvo los tres defectos sembrados en copias en memoria (secreto, migración sin rollback y filtro sensible a mayúsculas). Esa repetición no modifica los archivos del proyecto.

| Etapa | Resultado | Tiempo |
| --- | --- | --- |
| Secretos y conformidad de las tres propuestas | Verde | 241 ms |
| Backend: `mvn verify` y JaCoCo (mínimo 80 % de líneas) | Verde. 26 pruebas unitarias y 23 de integración. Cobertura de líneas 81/83 (98 %) | 41,7 s |
| Frontend: Vitest con cobertura (mínimo 80 % de líneas) | Verde. 61 pruebas. 99,5 % de líneas | 32,3 s |
| Frontend: `npm run build` | Verde | 8,4 s |
| Repetición C02, C04 y C07 | 3/3 detenidos. Los archivos reales siguieron pasando. El ejemplo `ejemplo-de-gate` no se marcó | 260 ms |

Tiempo total de esa corrida local: 83 s. La evidencia está en `proyecto/ultima-corrida.json`. El mismo recorrido está en `.github/workflows/quality-gates.yml`. Gitleaks no estaba instalado en esa máquina.
