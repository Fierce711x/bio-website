import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';
const ENV = process.env.NODE_ENV;
let envString;
if (ENV === 'testing') envString = 'DATABASE_URL_TEST';
else if (ENV === 'development') envString = 'DATABASE_URL_DEVELOPMENT';
else envString = 'DATABASE_URL_PRODUCTION';

export default defineConfig({
  schema: './prisma',
  migrations: {
    path: './prisma/migrations',
  },
  datasource: {
    url: env(envString),
  },
});
