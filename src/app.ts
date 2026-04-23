import express, { Application, Request, Response } from 'express';

const app: Application = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Health check endpoint for Render
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Basic route
app.get('/', (req: Request, res: Response) => {
  res.send('RentOS Backend Server is Running 🚀. Connected to DB!');
});

export default app;
