import { defineConfig, env } from 'prisma/config';

try {
  process.loadEnvFile();
} catch {
  // .env is optional — real envs (prod/CI) set vars directly
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
