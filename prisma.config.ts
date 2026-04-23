import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Always log DATABASE_URL status for debugging
console.log('DATABASE_URL available:', !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL starts with:', process.env.DATABASE_URL.split('://')[0]);
  console.log('NODE_ENV:', process.env.NODE_ENV);
} else {
  console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('DATABASE')));
}

// if (!process.env['DATABASE_URL']) {
//   throw new Error('DATABASE_URL is not defined in environment variables');
// }

// export default defineConfig({
//   schema: 'prisma/schema.prisma',
//   migrations: {
//     path: 'prisma/migrations',
//   },
//   datasource: {
//     // url: process.env['DATABASE_URL'],
//     url:
//       process.env.DATABASE_URL ||
//       'postgresql://dummy:dummy@localhost:5432/dummy',
//   },
// });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy',
  },
});
