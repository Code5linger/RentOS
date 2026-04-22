import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { json } from 'express';
import { apiRouter } from './presentation/routes';
import { errorMiddleware } from './presentation/middleware/error.middleware';

export function createApp(): Application {
  const app = express();

  // Security
  app.use(helmet());
  app.use(cors());

  // Parsing
  app.use(json());

  // Health check — outside versioned routes
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // All API routes
  app.use('/api/v1', apiRouter);

  // Error handler — must be last
  app.use(errorMiddleware);

  return app;
}
