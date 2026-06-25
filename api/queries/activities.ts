import { getDb } from "./connection";
import { activities } from "@db/schema";
import { desc } from "drizzle-orm";
import type { InsertActivity } from "@db/schema";

export async function findAllActivities(limit?: number) {
  return getDb().query.activities.findMany({
    orderBy: [desc(activities.createdAt)],
    limit,
  });
}

export async function createActivity(data: InsertActivity) {
  const [result] = await getDb().insert(activities).values(data).returning();
  return result;
}
