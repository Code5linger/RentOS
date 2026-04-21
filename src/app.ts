import express, { Application, Request, Response } from 'express';

const app: Application = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Basic route
app.get('/', (req: Request, res: Response) => {
  res.send('Hello');
});

export default app;
