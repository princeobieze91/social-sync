import { getDb } from "./connection";
import { socialAccounts } from "@db/schema";
import { eq, desc, and } from "drizzle-orm";
import type { InsertSocialAccount } from "@db/schema";

export async function findAllAccounts(userId: number) {
  return getDb().query.socialAccounts.findMany({
    where: eq(socialAccounts.userId, userId),
    orderBy: [desc(socialAccounts.createdAt)],
  });
}

export async function findAccountById(id: number, userId: number) {
  return getDb().query.socialAccounts.findFirst({
    where: and(eq(socialAccounts.id, id), eq(socialAccounts.userId, userId)),
  });
}

export async function findConnectedAccounts(userId: number) {
  return getDb().query.socialAccounts.findMany({
    where: and(eq(socialAccounts.isConnected, "true"), eq(socialAccounts.userId, userId)),
    orderBy: [desc(socialAccounts.createdAt)],
  });
}

export async function createAccount(data: InsertSocialAccount) {
  const [result] = await getDb().insert(socialAccounts).values(data).returning();
  return findAccountById(result.id, data.userId);
}

export async function updateAccount(id: number, data: Partial<InsertSocialAccount>, userId: number) {
  await getDb().update(socialAccounts).set(data).where(and(eq(socialAccounts.id, id), eq(socialAccounts.userId, userId)));
  return findAccountById(id, userId);
}

export async function deleteAccount(id: number, userId: number) {
  await getDb().delete(socialAccounts).where(and(eq(socialAccounts.id, id), eq(socialAccounts.userId, userId)));
}

export async function getTotalFollowers(userId: number) {
  const accounts = await getDb().select().from(socialAccounts).where(eq(socialAccounts.userId, userId));
  return accounts.reduce((sum, acc) => sum + (acc.followerCount || 0), 0);
}

export async function findAccountByPlatformId(platformId: string, userId: number) {
  return getDb().query.socialAccounts.findFirst({
    where: and(eq(socialAccounts.platformId, platformId), eq(socialAccounts.userId, userId)),
  });
}