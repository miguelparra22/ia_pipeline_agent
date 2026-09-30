/**
 * Antes de un git commit del agente, corre el control rápido de quality gates
 * y deja el resultado en Engram (topic quality-gates/ultimo-commit).
 * No guarda el texto de un secreto, solo el archivo.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateProject } from "../../docs/laboratorio-quality-gates/proyecto/gates.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function allow(extra = {}) {
  process.stdout.write(JSON.stringify({ permission: "allow", ...extra }));
}

function isGitCommit(command) {
  return /\bgit(\.exe)?\s+commit\b/i.test(command);
}

function summarize(report) {
  const parts = [];
  if (report.secrets.length > 0) {
    const files = [...new Set(report.secrets.map((hit) => hit.file))];
    parts.push(`secretos en ${files.join(", ")}`);
  }
  for (const proposal of report.proposals) {
    if (proposal.failed.length > 0) {
      parts.push(`${proposal.change}: ${proposal.failed.join(", ")}`);
    }
  }
  if (!report.filter.pass) {
    parts.push(`filtro sin lower() en ${report.filter.file}`);
  }
  return parts.length > 0 ? parts.join("; ") : "verde";
}

function engramBinary() {
  const local = process.env.LOCALAPPDATA
    ? path.join(process.env.LOCALAPPDATA, "engram", "bin", "engram.exe")
    : "";
  if (local && fs.existsSync(local)) return local;
  return "engram";
}

function saveToEngram(ok, summary) {
  const title = ok ? "Quality gate en verde antes del commit" : "Quality gate en rojo antes del commit";
  const content = [
    `**What**: El control rápido de quality gates quedó ${ok ? "en verde" : "en rojo"} al intentar un git commit.`,
    "**Why**: El hook avisa en el commit y deja el resultado para la siguiente sesión.",
    `**Where**: ${root}`,
    `**Learned**: ${summary}`,
  ].join("\n");
  const result = spawnSync(
    engramBinary(),
    [
      "save",
      title,
      content,
      "--type",
      "discovery",
      "--project",
      "project_lab",
      "--scope",
      "project",
      "--topic",
      "quality-gates/ultimo-commit",
    ],
    { encoding: "utf8", windowsHide: true },
  );
  return result.status === 0;
}

async function main() {
  const raw = fs.readFileSync(0, "utf8");
  let command = "";
  try {
    command = JSON.parse(raw).command ?? "";
  } catch {
    allow();
    return;
  }
  if (!isGitCommit(command)) {
    allow();
    return;
  }

  let report;
  try {
    report = evaluateProject(root);
  } catch (error) {
    allow({
      user_message: "No se pudo correr el quality gate antes del commit. El commit sigue.",
      agent_message: `Quality gate hook error: ${error instanceof Error ? error.message : String(error)}`,
    });
    return;
  }

  const summary = summarize(report);
  const saved = saveToEngram(report.ok, summary);
  const memory = saved
    ? "Engram guardó el aviso en quality-gates/ultimo-commit."
    : "Engram no pudo guardar el aviso.";

  if (report.ok) {
    allow({
      user_message: `Quality gate rápido en verde. ${memory}`,
      agent_message: `El control rápido pasó (${summary}). ${memory} Busca el topic quality-gates/ultimo-commit si hace falta el detalle.`,
    });
    return;
  }

  process.stdout.write(
    JSON.stringify({
      permission: "ask",
      user_message: `Quality gate en rojo: ${summary}. ${memory}`,
      agent_message: `El control rápido falló antes del commit: ${summary}. ${memory} No lo des por bueno hasta que la persona confirme.`,
    }),
  );
}

main();
