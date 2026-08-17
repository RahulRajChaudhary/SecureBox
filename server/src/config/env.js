import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  COOKIE_SECRET: z.string().min(32),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_REGION: z.string().min(1),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export const env = envSchema.parse(process.env);
