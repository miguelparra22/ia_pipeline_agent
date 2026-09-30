/**
 * Simula un git commit del agente con el secreto de este caso.
 * Sale 0 solo si el hook responde permission deny.
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..", "..", "..");
const hook = path.join(root, ".cursor", "hooks", "quality-gate-commit.mjs");
const fixture = path.join(here, "secreto.yml");

const child = spawn(process.execPath, [hook], {
  cwd: root,
  env: { ...process.env, QUALITY_GATE_FIXTURE: fixture },
  stdio: ["pipe", "pipe", "pipe"],
});

let out = "";
let err = "";
child.stdout.on("data", (chunk) => {
  out += chunk;
});
child.stderr.on("data", (chunk) => {
  err += chunk;
});

child.on("close", (code) => {
  let body;
  try {
    body = JSON.parse(out);
  } catch {
    console.error(out || err || "El hook no devolvió JSON.");
    process.exit(1);
  }
  console.log(JSON.stringify(body, null, 2));
  if (code !== 0 || body.permission !== "deny") {
    console.error("El commit no quedó bloqueado.");
    process.exit(1);
  }
  console.log("Commit bloqueado.");
});

child.stdin.end(JSON.stringify({ command: "git commit -m ejemplo" }));
