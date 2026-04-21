// src/app.ts
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { errorHandler } from '@presentation/middleware/errorHandler';
import { requestLogger } from '@presentation/middleware/requestLogger';

export function createApp(): express.Application {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(requestLogger);

  // Routes mounted here in Phase 3
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use(errorHandler);

  return app;
}
