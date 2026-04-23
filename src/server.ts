import express, { Application, Request, Response } from 'express';

const app: Application = express();
const PORT: number = Number(process.env.PORT) || 5000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, TypeScript + Express!');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// module.exports = app;
export default app;
