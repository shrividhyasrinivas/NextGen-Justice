import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distServerPath = path.resolve(__dirname, 'dist/server.js');
const isDev = process.env.NODE_ENV === 'development';

async function bootstrap() {
  if (!isDev && fs.existsSync(distServerPath)) {
    // Production deployment: run pre-bundled server bundle directly with zero dependencies on loaders
    const mod = await import(`file://${distServerPath}`);
    if (typeof mod.startServer === 'function') {
      await mod.startServer();
    }
  } else {
    // Development mode or pre-build: dynamically import TS server app
    const { startServer } = await import('./server/src/serverApp');
    await startServer();
  }
}

bootstrap().catch((err) => {
  console.error('[NextGen Justice V8] Startup error:', err);
  process.exit(1);
});
