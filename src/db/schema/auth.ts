import { boolean, pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { type UpdateDbRow } from '../types';

// if you use supabase you can't use "auth" as schema name
export const authSchema = pgSchema('auth');

export const userTable = authSchema.table('user_entity', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type UserModel = typeof userTable.$inferSelect;
export type InsertUserModel = typeof userTable.$inferInsert;
export type UpdateUserModel = Omit<UpdateDbRow<UserModel>, 'email'>;

export const sessionTable = authSchema.table('session', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => userTable.id)
    .notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type SessionModel = typeof sessionTable.$inferSelect;
export type InsertSessionModel = typeof sessionTable.$inferInsert;

export const accountTable = authSchema.table('account', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => userTable.id)
    .notNull(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  idToken: text('id_token'),
  password: text('password'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type AccountModel = typeof accountTable.$inferSelect;
export type InsertAccountModel = typeof accountTable.$inferInsert;
export type UpdateAccountModel = UpdateDbRow<AccountModel>;

export const verificationTable = authSchema.table('verification', {
  id: uuid('id').defaultRandom().primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type VerificationModel = typeof verificationTable.$inferSelect;
export type InsertVerificationModel = typeof verificationTable.$inferInsert;
