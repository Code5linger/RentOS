import 'dotenv/config';
import app from './app.js';

const PORT: number = Number(process.env.PORT) || 5000;

const bootstrap = () => {
  try {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(
        `RentOS Backend Server is running on http://localhost:${process.env.PORT}`,
      );
    });
  } catch (error) {
    console.log(`Failed to start server! Cause of: ${error}`);
  }
};

// module.exports = app;
export default app;
bootstrap();
