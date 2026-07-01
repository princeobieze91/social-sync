import { getDb } from "./connection";
import { posts, postAccounts, media, socialAccounts } from "@db/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import type { Post, InsertMedia } from "@db/schema";

export async function findAllPosts(userId: number) {
  return getDb().query.posts.findMany({
    where: eq(posts.userId, userId),
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

export async function findPostById(id: number, userId: number) {
  return getDb().query.posts.findFirst({
    where: and(eq(posts.id, id), eq(posts.userId, userId)),
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

export async function findPostsByStatus(status: Post["status"], userId: number) {
  return getDb().query.posts.findMany({
    where: and(eq(posts.status, status), eq(posts.userId, userId)),
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

export async function findPostsByDateRange(start: Date, end: Date, userId: number) {
  return getDb().query.posts.findMany({
    where: and(
      eq(posts.userId, userId),
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

export async function createPost(data: { content: string; status?: Post["status"]; scheduledAt?: Date | null; accountIds: number[]; userId: number }) {
  const db = getDb();

  const [{ id }] = await db.insert(posts).values({
    content: data.content,
    status: data.status || "draft",
    scheduledAt: data.scheduledAt || null,
    userId: data.userId,
  }).returning();

  if (data.accountIds.length > 0) {
    // Verify first account belongs to user
    await db.query.socialAccounts.findFirst({
      where: and(eq(socialAccounts.id, data.accountIds[0]), eq(socialAccounts.userId, data.userId)),
    });
    await db.insert(postAccounts).values(
      data.accountIds.map((accountId) => ({
        postId: id,
        accountId,
        platformStatus: "pending" as const,
      }))
    );
  }

  return findPostById(id, data.userId);
}

export async function updatePost(id: number, data: { content?: string; status?: Post["status"]; scheduledAt?: Date | null; accountIds?: number[] }, userId: number) {
  const db = getDb();

  await db.update(posts).set({
    ...(data.content !== undefined && { content: data.content }),
    ...(data.status !== undefined && { status: data.status }),
    ...(data.scheduledAt !== undefined && { scheduledAt: data.scheduledAt }),
    updatedAt: new Date(),
  }).where(and(eq(posts.id, id), eq(posts.userId, userId)));

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

  return findPostById(id, userId);
}

export async function deletePost(id: number, userId: number) {
  const db = getDb();
  await db.delete(postAccounts)
    .where(eq(postAccounts.postId, id));
  await db.delete(media)
    .where(eq(media.postId, id));
  await db.delete(posts)
    .where(and(eq(posts.id, id), eq(posts.userId, userId)));
}

export async function addMediaToPost(data: InsertMedia) {
  const [result] = await getDb().insert(media).values(data).returning();
  return result;
}

// Analytics — uses SQL aggregation instead of in-memory filtering
export async function getPostCounts(userId: number) {
  const db = getDb();
  const [total] = await db.select({
    total: sql<number>`count(*)`,
    draft: sql<number>`count(*) filter (where ${posts.status} = 'draft')`,
    scheduled: sql<number>`count(*) filter (where ${posts.status} = 'scheduled')`,
    published: sql<number>`count(*) filter (where ${posts.status} = 'published')`,
    failed: sql<number>`count(*) filter (where ${posts.status} = 'failed')`,
  }).from(posts).where(eq(posts.userId, userId));

  return {
    total: Number(total.total),
    draft: Number(total.draft),
    scheduled: Number(total.scheduled),
    published: Number(total.published),
    failed: Number(total.failed),
  };
}

export async function getPlatformCounts(userId: number) {
  const db = getDb();
  const allPostAccounts = await db.query.postAccounts.findMany({
    with: { account: true },
  });
  const allAccounts = await db.query.socialAccounts.findMany({
    where: eq(socialAccounts.userId, userId),
  });

  const counts: Record<string, number> = {};
  for (const account of allAccounts) {
    counts[account.platform] = allPostAccounts.filter(
      (pa) => pa.accountId === account.id && pa.account.userId === userId
    ).length;
  }

  return counts;
}

export async function findAllPostsByUser(userId: number) {
  return getDb().query.posts.findMany({
    where: eq(posts.userId, userId),
    orderBy: [desc(posts.createdAt)],
    with: {
      postAccounts: {
        with: { account: true },
      },
      media: true,
    },
  });
}