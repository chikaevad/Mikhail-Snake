import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    databaseUrl: z.url(),
    betterAuthUrl: z.url(),
    betterAuthSecret: z.string().min(1),
  },
  client: {},
  runtimeEnv: {
    databaseUrl: process.env.DATABASE_URL,
    betterAuthUrl: process.env.BETTER_AUTH_URL,
    betterAuthSecret: process.env.BETTER_AUTH_SECRET,
  },
});
