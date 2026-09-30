# Anexo A. Estándar de Quality Gates para código agéntico

Guía adoptable por las células. Acompaña al informe del laboratorio. Los umbrales numéricos de cobertura, SAST y dependencias son el punto de partida para el primer proyecto; la corrida local solo calibró el gate de secretos.

## 1. Para qué existe

Un agente puede entregar un diff que compila y aun así romper la historia de usuario, omitir el rollback de una migración o dejar una clave en un YAML. Este estándar obliga a tres familias de gates antes del merge y del archivo del cambio OpenSpec.

## 2. Cuándo se aplica

Todo cambio hecho o modificado por un agente de código en un repositorio de la fábrica. La exigencia sube con la criticidad. La criticidad se lee de la propuesta del cambio:

| Señal en la propuesta | Efecto |
| --- | --- |
| Historia `HU-XXX` presente | Gate de trazabilidad |
| Toca autenticación: Sí | Criticidad alta y revisión humana |
| Maneja datos personales: Sí | Criticidad alta y revisión humana |
| Incluye migraciones: Sí | Exige plan de rollback ejecutable y revisión humana de ese plan |
| Ninguna de las tres señales en Sí, y hay comportamiento de negocio | Criticidad media |
| Solo documentación o texto sin comportamiento | Criticidad baja |

HU-001 queda en criticidad media con revisión humana del rollback, porque crea la tabla `products` y la consulta es pública y sin datos personales.

## 3. Flujo

```text
1. El agente autor implementa el cambio y referencia HU-XXX.
2. Gates de pre-merge (automáticos, bloqueantes según la tabla).
3. Agente revisor, distinto del autor, emite veredicto.
4. Revisión humana si la criticidad o un hallazgo lo exigen.
5. Gates de conformidad contra la spec, las skills y la trazabilidad.
6. Merge y, en OpenSpec, archivo del cambio solo con verify en verde.
```

El autor no aprueba su propio cambio. Un override lo firma el líder técnico y queda registrado con el gate, el motivo y la fecha.

## 4. Familia A. Gates de pre-merge

Corren en `.github/workflows/quality-gates.yml` y, en local, con `proyecto/run-proyecto.ps1`. Ese recorrido cubre compilación, pruebas, cobertura JaCoCo y Vitest, y secretos. SAST y dependencias siguen fuera del pipeline.

| ID | Gate | Herramienta prevista en el stack | Baja | Media | Alta |
| --- | --- | --- | --- | --- | --- |
| P1 | Compilación | `mvn -q -DskipTests compile` y `npm run build` | Bloquea | Bloquea | Bloquea |
| P2 | Lint | Checkstyle o Spotless, ESLint | Bloquea errores | Bloquea errores | Bloquea errores |
| P3 | Pruebas unitarias | JUnit 5, Vitest | Bloquea | Bloquea | Bloquea |
| P4 | Pruebas de integración | Testcontainers, prueba de API | Informativo | Bloquea si toca backend o datos | Bloquea |
| P5 | Cobertura en líneas del diff | JaCoCo, cobertura de Vitest | No bloquea | 80 % del código nuevo | 90 % del código nuevo |
| P6 | SAST | Semgrep o SpotBugs, más reglas de frontend | Solo críticos | Altos y críticos | Medios, altos y críticos |
| P7 | Secretos | gitleaks. Hoy: `G-SECRET` del arnés | Bloquea | Bloquea | Bloquea |
| P8 | Dependencias | OWASP Dependency-Check, `npm audit` u OSV-Scanner | CVE crítico | CVE alto y crítico | CVE medio, alto y crítico |

P7 ignora líneas marcadas `ejemplo-de-gate`. Esa excepción salió del piloto: sin ella, la documentación del propio gate se marcaba como secreto. En el proyecto, el escáner calibrado recorre `backend/src`, `frontend/src` y `openspec`. Si gitleaks está instalado, `run-proyecto.ps1` también lo ejecuta con `proyecto/.gitleaks.toml`.

## 5. Familia B. Gates de revisión

| ID | Gate | Qué exige | Cuándo bloquea |
| --- | --- | --- | --- |
| R1 | Agente revisor | Otro agente lee el diff contra la spec y las tareas. Veredicto: aprobar, cambios o escalar. | Siempre en media y alta. En baja basta el pre-merge. |
| R2 | Humano por criticidad | Alguien distinto del autor del prompt revisa el diff. | Alta siempre. Media si hay migración, excepción de P5 o hallazgo que se quiera omitir. |
| R3 | Override | El líder técnico autoriza una excepción concreta. | Sin registro, el override no vale. |

El agente revisor responde solo estas preguntas:

- ¿Cada escenario Given/When/Then de la spec tiene una prueba o una evidencia?
- ¿El diff introduce comportamiento que la spec prohíbe?
- ¿La propuesta declara autenticación, datos personales y migraciones?
- ¿Hay secreto, dependencia nueva o cambio de contrato no mencionado en la propuesta?

Si alguna respuesta falla, el veredicto es pedir cambios o escalar. No se usa el revisor para discutir formato que ya cubre el lint.

## 6. Familia C. Gates de conformidad

Alineados a `openspec verify` (completitud, corrección, coherencia) y a las reglas de `openspec/config.yaml`.

| ID | Gate | Criterio de bloqueo | En el arnés local |
| --- | --- | --- | --- |
| C1 | Adherencia a la spec | Falta un requisito o un escenario, o el código contradice la spec | `G-SOLO-LECTURA`, `G-FILTRO` |
| C2 | Convenciones de skills | La propuesta no trae el id de la HU, las tres preguntas de impacto o el rollback cuando hay migración | `G-IMPACTO`, `G-ROLLBACK` |
| C3 | Trazabilidad | El cambio no referencia `HU-XXX` | `G-TRAZA` |

En el proyecto de referencia, C1 para HU-001 exige además:

- tabla con SKU, nombre, cantidad y precio
- filtro por nombre o SKU sin distinguir mayúsculas
- mensaje "No se encontraron productos" cuando no hay filas
- operación de solo lectura y sin autenticación en esta fase

## 7. Roles

| Rol | Hace | No hace |
| --- | --- | --- |
| Desarrollador o agente autor | Implementa, referencia la HU, deja pruebas y corrige gates en rojo | No se autoaprueba en R1 ni en R2 |
| Agente revisor | Ejecuta R1 y señala el escenario o el archivo que falla | No debilita un gate de pre-merge |
| QA | Cuida escenarios de aceptación, lee el informe de conformidad y alimenta el piloto con defectos reales | No sustituye P3 y P4 |
| Líder técnico | Define la criticidad cuando la propuesta no alcanza, firma overrides y revisa los umbrales cada trimestre | No deja un override verbal |

## 8. Métricas de seguimiento

Se publican por célula y por sprint, solo con corridas reales. El piloto local ya puede alimentar las tres primeras para los gates C y P7.

| Métrica | Cálculo | Lectura en este laboratorio |
| --- | --- | --- |
| Efectividad | Defectos detenidos / defectos sembrados o escapados conocidos | 5/5 en la corrida local calibrada |
| Falsos positivos | Casos sin defecto que un gate frenó / casos sin defecto | 1/2 en naive, 0/2 en calibrado |
| Fricción | Reintentos hasta dejar el cambio en verde, y overrides por sprint | C06 exigía un reintento innecesario en modo naive |
| Tiempo agregado | Duración mediana del pipeline con gates menos duración sin gates | 677 ms el arnés completo. El pipeline del stack sigue sin medir |

Si la efectividad de un gate baja del 80 % de los defectos de su tipo, o los falsos positivos superan el 15 % de los cambios limpios durante dos sprints, el líder técnico recalibra ese gate antes de seguir exigiéndolo.

## 9. Qué mostrar en una revisión del laboratorio

1. Este anexo, sección de familias y tabla de criticidad.
2. La corrida:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\docs\laboratorio-quality-gates\piloto\run-gates.ps1
```

3. El caso C02 (secreto detenido) y el caso C06 (falso positivo que desaparece al calibrar).
4. El informe, sección de conclusiones y ajustes pendientes.
