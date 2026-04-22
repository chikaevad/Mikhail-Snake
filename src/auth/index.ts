import { db } from '@/db';
import { accountTable, sessionTable, userTable, verificationTable } from '@/db/schema/auth';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sendResetPassword: async ({ user, url }, request) => {
      console.info({ info: 'Sending reset password email', url });
    },
  },
  emailVerification: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sendVerificationEmail: async ({ user, url }, request) => {
      console.info({ info: 'Sending verification email', url });
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },
  plugins: [
    nextCookies(), // this must be the last plugin in the array
  ],
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user_entity: userTable,
      session: sessionTable,
      account: accountTable,
      verification: verificationTable,
    },
  }),
  user: {
    modelName: 'user_entity',
  },
  trustedOrigins: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  advanced: {
    database: {
      generateId: false,
    },
  },
});
