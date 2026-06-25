import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import {
  findAllPosts,
  findPostById,
  findPostsByStatus,
  findPostsByDateRange,
  createPost,
  updatePost,
  deletePost,
} from "./queries/posts";

export const postsRouter = createRouter({
  list: authedQuery.query(() => findAllPosts()),

  byId: authedQuery
    .input(z.object({ id: z.number() }))
    .query(({ input }) => findPostById(input.id)),

  byStatus: authedQuery
    .input(z.object({ status: z.enum(["draft", "scheduled", "published", "failed"]) }))
    .query(({ input }) => findPostsByStatus(input.status)),

  byDateRange: authedQuery
    .input(z.object({
      start: z.string().transform((s) => new Date(s)),
      end: z.string().transform((s) => new Date(s)),
    }))
    .query(({ input }) => findPostsByDateRange(input.start, input.end)),

  create: authedQuery
    .input(z.object({
      content: z.string().min(1, "Content is required"),
      status: z.enum(["draft", "scheduled", "published"]).optional(),
      scheduledAt: z.string().nullable().optional().transform((s) => s ? new Date(s) : null),
      accountIds: z.array(z.number()).default([]),
    }))
    .mutation(({ input }) => createPost(input)),

  update: authedQuery
    .input(z.object({
      id: z.number(),
      content: z.string().optional(),
      status: z.enum(["draft", "scheduled", "published", "failed"]).optional(),
      scheduledAt: z.string().nullable().optional().transform((s) => s ? new Date(s) : null),
      accountIds: z.array(z.number()).optional(),
    }))
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return updatePost(id, data);
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deletePost(input.id)),
});
