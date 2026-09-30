/**
 * Repite tres defectos del piloto sobre copias en memoria de archivos reales.
 * No escribe en backend/, frontend/ ni openspec/.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { checkProposal, filterPasses, scanText } from "./gates.mjs";

function repoRoot() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "..", "..", "..");
}

export function replay(root) {
  const propertiesPath = path.join(root, "backend", "src", "main", "resources", "application.properties");
  const proposalPath = path.join(root, "openspec", "changes", "hu-002-creacion-producto", "proposal.md");
  const repositoryPath = path.join(
    root,
    "backend",
    "src",
    "main",
    "java",
    "com",
    "qvision",
    "inventory",
    "product",
    "ProductRepository.java",
  );

  const properties = fs.readFileSync(propertiesPath, "utf8");
  const proposal = fs.readFileSync(proposalPath, "utf8");
  const repository = fs.readFileSync(repositoryPath, "utf8");

  const secretDirty = `${properties}\npayment.api-key=sk_live_LABORATORIO_NO_VALIDA_12345\n`;
  const exampleOnly = `${properties}\n# password = ejemplo-de-gate\n`;
  const proposalDirty = proposal.replace(/DROP\s+(TABLE|INDEX)[^\n]*/gi, "rollback pendiente");
  const filterDirty = repository.replace(/lower\s*\(/gi, "(");

  const cases = [
    {
      id: "C02",
      defecto: "secreto",
      esperado: "G-SECRET",
      limpioPasa: scanText(properties, "application.properties").length === 0,
      defectoDetenido: scanText(secretDirty, "application.properties").length > 0,
      ejemploPasa: scanText(exampleOnly, "application.properties").length === 0,
    },
    {
      id: "C04",
      defecto: "sin-rollback",
      esperado: "G-ROLLBACK",
      limpioPasa: !checkProposal(proposal).includes("G-ROLLBACK"),
      defectoDetenido: checkProposal(proposalDirty).includes("G-ROLLBACK"),
    },
    {
      id: "C07",
      defecto: "filtro",
      esperado: "G-FILTRO",
      limpioPasa: filterPasses(repository),
      defectoDetenido: !filterPasses(filterDirty),
    },
  ];

  const ok = cases.every((item) => item.limpioPasa && item.defectoDetenido && item.ejemploPasa !== false);
  return { ok, cases };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMain) {
  const report = replay(repoRoot());
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) {
    console.error("La repeticion de defectos no detuvo algun caso.");
    process.exit(1);
  }
  console.log("Defectos repetidos detenidos: 3/3. Los archivos reales siguen pasando.");
}
