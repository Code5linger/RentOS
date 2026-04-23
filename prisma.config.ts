import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Debug: Log environment variables in production
if (process.env.NODE_ENV === 'production') {
  console.log('DATABASE_URL available:', !!process.env.DATABASE_URL);
  if (process.env.DATABASE_URL) {
    console.log('DATABASE_URL starts with:', process.env.DATABASE_URL.split('://')[0]);
  }
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
