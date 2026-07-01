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
import { createActivity } from "./queries/activities";

export const postsRouter = createRouter({
  list: authedQuery
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(({ input, ctx }) => findAllPosts(ctx.user!.id, input?.limit)),

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
    .mutation(async ({ input, ctx }) => {
      const result = await createPost({ ...input, userId: ctx.user!.id });
      await createActivity({
        userId: ctx.user!.id,
        type: "create",
        message: input.status === "scheduled"
          ? `Post scheduled for ${input.scheduledAt ? new Date(input.scheduledAt).toLocaleDateString() : "later"}`
          : `New post created`,
        metadata: JSON.stringify({ postId: result?.id, status: input.status }),
      });
      return result;
    }),

  update: authedQuery
    .input(z.object({
      id: z.number(),
      content: z.string().optional(),
      status: z.enum(["draft", "scheduled", "published", "failed"]).optional(),
      scheduledAt: z.string().nullable().optional().transform((s) => s ? new Date(s) : null),
      accountIds: z.array(z.number()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      const result = await updatePost(id, data, ctx.user!.id);
      await createActivity({
        userId: ctx.user!.id,
        type: data.status === "scheduled" ? "schedule" : "create",
        message: data.status === "scheduled"
          ? `Post rescheduled`
          : data.status === "published"
          ? `Post published`
          : `Post updated`,
        metadata: JSON.stringify({ postId: id, status: data.status }),
      });
      return result;
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await deletePost(input.id, ctx.user!.id);
      await createActivity({
        userId: ctx.user!.id,
        type: "create",
        message: `Post deleted`,
        metadata: JSON.stringify({ postId: input.id }),
      });
    }),
});