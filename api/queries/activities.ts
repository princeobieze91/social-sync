import { getDb } from "./connection";
import { activities } from "@db/schema";
import { desc, eq } from "drizzle-orm";
import type { InsertActivity } from "@db/schema";

export async function findAllActivities(userId: number, limit?: number) {
  return getDb().query.activities.findMany({
    where: eq(activities.userId, userId),
    orderBy: [desc(activities.createdAt)],
    limit,
  });
}

export async function createActivity(data: InsertActivity) {
  const [result] = await getDb().insert(activities).values(data).returning();
  return result;
}