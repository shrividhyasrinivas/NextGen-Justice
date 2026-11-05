import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { createServer as createViteServer } from 'vite';
import { env } from './config/env';
import { initializeDatabase } from './db/storage';
import { apiRouter } from './routes/api';

export async function startServer() {
  const app = express();
  const PORT = env.PORT;

  // Initialize persistent database & seed demo data
  await initializeDatabase();

  // Basic middleware
  app.use(cors());
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Ensure uploads directory exists
  const uploadDir = path.resolve(env.UPLOAD_DIR);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Mount API routes
  app.use('/api', apiRouter);

  // Development vs Production static serving
  const isDev = process.env.NODE_ENV === 'development';
  const distDir = path.resolve('dist');
  const hasDist = fs.existsSync(path.join(distDir, 'index.html'));

  if (!isDev && hasDist) {
    console.log(`[NextGen Justice V8] Serving production static bundle from ${distDir}`);
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    console.log('[NextGen Justice V8] Mounting Vite development middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NextGen Justice V8] Server running at http://0.0.0.0:${PORT}`);
    console.log(`[NextGen Justice V8] API available at http://0.0.0.0:${PORT}/api/health`);
  });
}

// Auto-start if executed as main module
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch((err) => {
    console.error('[NextGen Justice V8] Startup error:', err);
    process.exit(1);
  });
}
