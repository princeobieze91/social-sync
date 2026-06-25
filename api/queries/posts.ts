import { getDb } from "./connection";
import { posts, postAccounts, media, socialAccounts } from "@db/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import type { Post, InsertMedia } from "@db/schema";

export async function findAllPosts() {
  return getDb().query.posts.findMany({
    orderBy: [desc(posts.createdAt)],
    with: {
      postAccounts: {
        with: {
          account: true,
        },
      },
      media: true,
    },
  });
}

export async function findPostById(id: number) {
  return getDb().query.posts.findFirst({
    where: eq(posts.id, id),
    with: {
      postAccounts: {
        with: {
          account: true,
        },
      },
      media: true,
    },
  });
}

export async function findPostsByStatus(status: Post["status"]) {
  return getDb().query.posts.findMany({
    where: eq(posts.status, status),
    orderBy: [desc(posts.createdAt)],
    with: {
      postAccounts: {
        with: {
          account: true,
        },
      },
      media: true,
    },
  });
}

export async function findPostsByDateRange(start: Date, end: Date) {
  return getDb().query.posts.findMany({
    where: and(
      gte(posts.scheduledAt, start),
      lte(posts.scheduledAt, end)
    ),
    orderBy: [desc(posts.scheduledAt)],
    with: {
      postAccounts: {
        with: {
          account: true,
        },
      },
      media: true,
    },
  });
}

export async function createPost(data: { content: string; status?: Post["status"]; scheduledAt?: Date | null; accountIds: number[] }) {
  const db = getDb();

  const [{ id }] = await db.insert(posts).values({
    content: data.content,
    status: data.status || "draft",
    scheduledAt: data.scheduledAt || null,
  }).returning();

  if (data.accountIds.length > 0) {
    await db.insert(postAccounts).values(
      data.accountIds.map((accountId) => ({
        postId: id,
        accountId,
        platformStatus: "pending" as const,
      }))
    );
  }

  return findPostById(id);
}

export async function updatePost(id: number, data: { content?: string; status?: Post["status"]; scheduledAt?: Date | null; accountIds?: number[] }) {
  const db = getDb();

  await db.update(posts).set({
    ...(data.content !== undefined && { content: data.content }),
    ...(data.status !== undefined && { status: data.status }),
    ...(data.scheduledAt !== undefined && { scheduledAt: data.scheduledAt }),
    updatedAt: new Date(),
  }).where(eq(posts.id, id));

  if (data.accountIds !== undefined) {
    await db.delete(postAccounts).where(eq(postAccounts.postId, id));
    if (data.accountIds.length > 0) {
      await db.insert(postAccounts).values(
        data.accountIds.map((accountId) => ({
          postId: id,
          accountId,
          platformStatus: "pending" as const,
        }))
      );
    }
  }

  return findPostById(id);
}

export async function deletePost(id: number) {
  const db = getDb();
  await db.delete(postAccounts).where(eq(postAccounts.postId, id));
  await db.delete(media).where(eq(media.postId, id));
  await db.delete(posts).where(eq(posts.id, id));
}

export async function addMediaToPost(data: InsertMedia) {
  const [result] = await getDb().insert(media).values(data).returning();
  return result;
}

// Analytics
export async function getPostCounts() {
  const db = getDb();
  const allPosts = await db.select().from(posts);

  return {
    total: allPosts.length,
    draft: allPosts.filter((p) => p.status === "draft").length,
    scheduled: allPosts.filter((p) => p.status === "scheduled").length,
    published: allPosts.filter((p) => p.status === "published").length,
    failed: allPosts.filter((p) => p.status === "failed").length,
  };
}

export async function getPlatformCounts() {
  const db = getDb();
  const allPostAccounts = await db.select().from(postAccounts);
  const allAccounts = await db.select().from(socialAccounts);

  const counts: Record<string, number> = {};
  for (const account of allAccounts) {
    counts[account.platform] = allPostAccounts.filter((pa) => pa.accountId === account.id).length;
  }

  return counts;
}
