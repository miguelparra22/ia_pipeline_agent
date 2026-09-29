# Quality Gates: qué abrir en la demo

Paquete local del laboratorio. El informe diligenciado y el anexo del estándar están listos para mostrar. El piloto de conformidad y secretos se ejecuta en esta máquina.

| Documento | Para qué abrirlo |
| --- | --- |
| [informe-laboratorio.md](informe-laboratorio.md) | Formato de laboratorio: objetivo, tres actividades, resultados de la corrida y conclusiones |
| [anexo-a-estandar-quality-gates.md](anexo-a-estandar-quality-gates.md) | Guía adoptable: gates, criticidad, roles, métricas y umbrales iniciales |
| [piloto/run-gates.ps1](piloto/run-gates.ps1) | Demo en vivo, unos 7 casos en menos de un segundo |
| `piloto/ultima-corrida.json` | Evidencia de la última ejecución |
| `piloto/casos/` | Diffs sembrados al estilo de un agente sobre HU-001 |

## Guion de 8 minutos

1. Abrir el informe y mostrar el flujo de tres familias (pre-merge, revisión, conformidad) y por qué HU-001 es criticidad media con rollback.
2. Ejecutar el piloto:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\docs\laboratorio-quality-gates\piloto\run-gates.ps1
```

3. Señalar en la salida: 5/5 defectos detenidos en ambos modos; el modo naive marca C06 y el modo calibrado lo deja pasar.
4. Abrir `piloto/casos/C02-secreto/application.yml` y `piloto/casos/C05-rompe-solo-lectura/ProductController.java` para mostrar el defecto que el gate vio.
5. Cerrar con el anexo: roles, métricas y la recomendación de adoptar ya la conformidad, y cablear compilación, pruebas, cobertura y SAST cuando exista el stack.

## Qué falta para cerrar el laboratorio completo

- La aplicación Spring Boot + React de HU-001 y su pipeline, para medir tiempo real de ciclo, cobertura y SAST.
- Sustituir los patrones del arnés por gitleaks y por `openspec verify`.
- Pasar estos apartados a la plantilla oficial del área si los títulos internos son otros.

Los porcentajes de cobertura y la severidad de SAST del anexo son el punto de partida. La única calibración ya medida es la del gate de secretos.
