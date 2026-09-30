# Quality Gates: qué abrir en la demo

Paquete local del laboratorio. El informe diligenciado y el anexo del estándar están listos para mostrar. El piloto de conformidad y secretos se ejecuta en esta máquina.

| Documento | Para qué abrirlo |
| --- | --- |
| [informe-laboratorio.md](informe-laboratorio.md) | Formato de laboratorio: objetivo, tres actividades, resultados de la corrida y conclusiones |
| [anexo-a-estandar-quality-gates.md](anexo-a-estandar-quality-gates.md) | Guía adoptable: gates, criticidad, roles, métricas y umbrales iniciales |
| [piloto/run-gates.ps1](piloto/run-gates.ps1) | Demo en vivo, unos 7 casos en menos de un segundo |
| `piloto/ultima-corrida.json` | Evidencia de la última ejecución del piloto |
| `piloto/casos/` | Diffs sembrados al estilo de un agente sobre HU-001 |
| [proyecto/run-proyecto.ps1](proyecto/run-proyecto.ps1) | Los mismos controles sobre el front y el backend reales |

## Guion de 8 minutos

1. Abrir el informe y mostrar el flujo de tres familias (pre-merge, revisión, conformidad) y por qué HU-001 es criticidad media con rollback.
2. Ejecutar el piloto:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\docs\laboratorio-quality-gates\piloto\run-gates.ps1
```

3. Señalar en la salida: 5/5 defectos detenidos en ambos modos; el modo naive marca C06 y el modo calibrado lo deja pasar.
4. Abrir `piloto/casos/C02-secreto/application.yml` y `piloto/casos/C05-rompe-solo-lectura/ProductController.java` para mostrar el defecto que el gate vio.
5. Cerrar con el anexo: roles, métricas y la recomendación de adoptar ya la conformidad, y cablear compilación, pruebas, cobertura y SAST cuando exista el stack.

## Probarlo en el front y el backend

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\docs\laboratorio-quality-gates\proyecto\run-proyecto.ps1
```

Ese comando recorre el código real:

- secretos, trazabilidad, impacto y rollback de cada `proposal.md` en `openspec/changes/`
- el filtro de HU-001 en `ProductRepository` (`lower(...)`)
- `mvn verify` en `backend/`, con JaCoCo al 80 % de líneas
- `npm run test:coverage` y `npm run build` en `frontend/`
- tres defectos del piloto (secreto, migración sin rollback, filtro sensible a mayúsculas) sobre copias en memoria

La repetición no modifica `backend/` ni `frontend/`. La evidencia queda en `proyecto/ultima-corrida.json`. El workflow `.github/workflows/quality-gates.yml` ejecuta los mismos pasos en CI. Si `gitleaks` está en el PATH, el script local lo corre con `proyecto/.gitleaks.toml`; si no, el bloqueo de secretos es el escáner calibrado (`ejemplo-de-gate`).

## Qué falta para cerrar el laboratorio completo

- SAST (Semgrep o SpotBugs) y el análisis de dependencias del anexo.
- `openspec verify` sigue siendo la revisión de completitud, corrección y coherencia antes de archivar; no es un comando que este pipeline ejecute solo.
- Pasar estos apartados a la plantilla oficial del área si los títulos internos son otros.
- Registrar, durante un sprint de uso real, overrides humanos y reintentos.

Los porcentajes de cobertura del anexo (80 % en criticidad media) ya bloquean en JaCoCo y en Vitest. La severidad de SAST sigue sin medirse. La calibración del gate de secretos es la marca `ejemplo-de-gate`.
