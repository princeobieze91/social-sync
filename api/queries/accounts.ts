import { getDb } from "./connection";
import { socialAccounts } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import type { InsertSocialAccount } from "@db/schema";

export async function findAllAccounts() {
  return getDb().query.socialAccounts.findMany({
    orderBy: [desc(socialAccounts.createdAt)],
  });
}

export async function findAccountById(id: number) {
  return getDb().query.socialAccounts.findFirst({
    where: eq(socialAccounts.id, id),
  });
}

export async function findConnectedAccounts() {
  return getDb().query.socialAccounts.findMany({
    where: eq(socialAccounts.isConnected, "true"),
    orderBy: [desc(socialAccounts.createdAt)],
  });
}

export async function createAccount(data: InsertSocialAccount) {
  const [result] = await getDb().insert(socialAccounts).values(data).returning();
  return findAccountById(result.id);
}

export async function updateAccount(id: number, data: Partial<InsertSocialAccount>) {
  await getDb().update(socialAccounts).set(data).where(eq(socialAccounts.id, id));
  return findAccountById(id);
}

export async function deleteAccount(id: number) {
  await getDb().delete(socialAccounts).where(eq(socialAccounts.id, id));
}

export async function getTotalFollowers() {
  const accounts = await getDb().select().from(socialAccounts);
  return accounts.reduce((sum, acc) => sum + (acc.followerCount || 0), 0);
}
