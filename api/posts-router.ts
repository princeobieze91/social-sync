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
  list: authedQuery.query(({ ctx }) => findAllPosts(ctx.user!.id)),

  byId: authedQuery
    .input(z.object({ id: z.number() }))
    .query(({ input, ctx }) => findPostById(input.id, ctx.user!.id)),

  byStatus: authedQuery
    .input(z.object({ status: z.enum(["draft", "scheduled", "published", "failed"]) }))
    .query(({ input, ctx }) => findPostsByStatus(input.status, ctx.user!.id)),

  byDateRange: authedQuery
    .input(z.object({
      start: z.string().transform((s) => new Date(s)),
      end: z.string().transform((s) => new Date(s)),
    }))
    .query(({ input, ctx }) => findPostsByDateRange(input.start, input.end, ctx.user!.id)),

  create: authedQuery
    .input(z.object({
      content: z.string().min(1, "Content is required"),
      status: z.enum(["draft", "scheduled", "published"]).optional(),
      scheduledAt: z.string().nullable().optional().transform((s) => s ? new Date(s) : null),
      accountIds: z.array(z.number()).default([]),
    }))
    .mutation(({ input, ctx }) => createPost({
      ...input,
      userId: ctx.user!.id,
    })),

  update: authedQuery
    .input(z.object({
      id: z.number(),
      content: z.string().optional(),
      status: z.enum(["draft", "scheduled", "published", "failed"]).optional(),
      scheduledAt: z.string().nullable().optional().transform((s) => s ? new Date(s) : null),
      accountIds: z.array(z.number()).optional(),
    }))
    .mutation(({ input, ctx }) => {
      const { id, ...data } = input;
      return updatePost(id, data, ctx.user!.id);
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input, ctx }) => deletePost(input.id, ctx.user!.id)),
});