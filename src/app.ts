// import express, { Application, Request, Response } from 'express';

// const app: Application = express();

// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());

// // Health check endpoint for Render
// app.get('/health', (_req: Request, res: Response) => {
//   res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
// });

// // Basic route
// app.get('/', (_req: Request, res: Response) => {
//   res.send('RentOS Backend Server is Running 🚀. Connected to DB!');
// });

// export default app;

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
