import { eq } from 'drizzle-orm';

import { db } from '..';
import { userTable, type UserModel } from '../schema/auth';

export async function dbGetUserById({
  userId,
}: {
  userId: string;
}): Promise<UserModel | undefined> {
  const [user] = await db.select().from(userTable).where(eq(userTable.id, userId));

  return user;
}

export async function dbGetUserByEmail({
  email,
}: {
  email: string;
}): Promise<UserModel | undefined> {
  const [user] = await db.select().from(userTable).where(eq(userTable.email, email));

  return user;
}
