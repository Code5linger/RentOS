import express, { Application, Request, Response } from 'express';

const app: Application = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Basic route
app.get('/', (req: Request, res: Response) => {
  res.send('RentOS Backend Server is Running 💨');
});

export default app;
