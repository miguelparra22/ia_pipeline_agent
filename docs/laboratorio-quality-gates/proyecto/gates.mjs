/**
 * Gates de secretos y de conformidad sobre el front, el backend y las propuestas OpenSpec.
 * La marca ejemplo-de-gate es la calibracion del piloto: esa linea no es una credencial.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const TEXT_EXT = new Set([
  ".java",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".properties",
  ".yml",
  ".yaml",
  ".sql",
  ".md",
  ".json",
  ".xml",
  ".css",
]);

const SECRET = /AKIA[0-9A-Z]{16}|sk_live_[0-9A-Za-z]+|password\s*[:=]\s*\S+/i;
const MIGRATION_YES = /Migraciones[^\n]{0,160}\?:\*{0,2}\s*S[ií]/i;
const ROLLBACK = /DROP\s+(TABLE|INDEX)/i;

export function scanText(text, file = "") {
  const hits = [];
  for (const line of text.split(/\r?\n/)) {
    if (line.includes("ejemplo-de-gate")) continue;
    if (SECRET.test(line)) hits.push({ file, line: line.trim() });
  }
  return hits;
}

function walk(dir, visit) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "target" || entry.name === "dist" || entry.name === "coverage") {
        continue;
      }
      walk(full, visit);
      continue;
    }
    if (TEXT_EXT.has(path.extname(entry.name).toLowerCase())) visit(full);
  }
}

export function scanSecrets(root, relativeDirs) {
  const hits = [];
  for (const rel of relativeDirs) {
    walk(path.join(root, rel), (file) => {
      const text = fs.readFileSync(file, "utf8");
      hits.push(...scanText(text, path.relative(root, file)));
    });
  }
  return hits;
}

export function checkProposal(text) {
  const failed = [];
  if (!/HU-\d{3}/.test(text)) failed.push("G-TRAZA");
  const impacto =
    /Autenticaci/.test(text) && /Datos Personales/.test(text) && /Migraciones/.test(text);
  if (!impacto) failed.push("G-IMPACTO");
  if (MIGRATION_YES.test(text) && !ROLLBACK.test(text)) failed.push("G-ROLLBACK");
  return failed;
}

export function checkProposals(root) {
  const changesDir = path.join(root, "openspec", "changes");
  const results = [];
  if (!fs.existsSync(changesDir)) return results;
  for (const name of fs.readdirSync(changesDir)) {
    const proposal = path.join(changesDir, name, "proposal.md");
    if (!fs.existsSync(proposal)) continue;
    const text = fs.readFileSync(proposal, "utf8");
    results.push({
      change: name,
      failed: checkProposal(text),
    });
  }
  return results;
}

export function filterPasses(repositoryText) {
  return /lower\s*\(/i.test(repositoryText);
}

export function checkFilterFile(root) {
  const file = path.join(
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
  const text = fs.readFileSync(file, "utf8");
  return { file: path.relative(root, file), pass: filterPasses(text) };
}

export function evaluateProject(root) {
  const secrets = scanSecrets(root, ["backend/src", "frontend/src", "openspec"]);
  const proposals = checkProposals(root);
  const filter = checkFilterFile(root);
  const proposalFailures = proposals.filter((item) => item.failed.length > 0);
  const ok = secrets.length === 0 && proposalFailures.length === 0 && filter.pass;
  return { ok, secrets, proposals, filter };
}

function repoRootFromHere() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "..", "..", "..");
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMain) {
  const root = repoRootFromHere();
  const report = evaluateProject(root);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) {
    console.error("Quality gates del proyecto en rojo.");
    process.exit(1);
  }
  console.log("Quality gates del proyecto en verde.");
}
