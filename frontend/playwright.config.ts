import { defineConfig } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// E2E de HU-001: navegador -> Vite -> Spring Boot -> SQLite.
// El backend arranca con el perfil "dev" (migraciones + seeds) sobre un SQLite nuevo en cada ejecución.
const BACKEND_PORT = 18080;
const FRONTEND_PORT = 5174;
const workDir = path.resolve(import.meta.dirname, '../backend/target/e2e');
fs.mkdirSync(workDir, { recursive: true });
const dbPath = path.join(workDir, `inventory-e2e-${Date.now()}.db`);
const backendJar = '../backend/target/inventory-backend-0.1.0-SNAPSHOT.jar';
// En Windows, si TEMP usa un nombre corto 8.3 (p. ej. MIGUEL~1), la JVM no puede crear
// su socket interno de loopback y Tomcat no arranca. Se le da un directorio propio.
const jvmArgs = `-Djdk.net.unixdomain.tmpdir="${workDir}"`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    // Edge viene instalado en Windows: evita descargar navegadores de Playwright.
    channel: process.env.PW_CHANNEL ?? 'msedge',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command:
        `mvn -q -f ../backend/pom.xml -DskipTests package && ` +
        `java ${jvmArgs} -jar ${backendJar} --server.port=${BACKEND_PORT} --inventory.db.path="${dbPath}"`,
      url: `http://localhost:${BACKEND_PORT}/api/products`,
      timeout: 180_000,
      reuseExistingServer: false,
    },
    {
      command: `npx vite --port ${FRONTEND_PORT} --strictPort`,
      url: `http://localhost:${FRONTEND_PORT}`,
      env: { BACKEND_URL: `http://localhost:${BACKEND_PORT}` },
      timeout: 60_000,
      reuseExistingServer: false,
    },
  ],
});
