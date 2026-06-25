import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { dispatchPost, retryDispatch, getDispatchStatus } from "./lib/dispatch";
import { createActivity } from "./queries/activities";
import { getDb } from "./queries/connection";
import { posts, postAccounts, socialAccounts } from "@db/schema";
import { eq, and } from "drizzle-orm";

export const publishRouter = createRouter({
  dispatch: authedQuery
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ input }) => {
      const result = await dispatchPost(input.postId);

      await createActivity({
        type: "publish",
        message: `Post dispatched to platforms`,
        metadata: JSON.stringify({
          postId: input.postId,
          dispatchId: result.id,
          platforms: Object.keys(result.platforms),
        }),
      });

      return result;
    }),

  status: authedQuery
    .input(z.object({ dispatchId: z.string() }))
    .query(async ({ input }) => {
      return getDispatchStatus(input.dispatchId);
    }),

  retry: authedQuery
    .input(z.object({ dispatchId: z.string() }))
    .mutation(async ({ input }) => {
      await retryDispatch(input.dispatchId);

      await createActivity({
        type: "publish",
        message: `Dispatch retry initiated`,
        metadata: JSON.stringify({ dispatchId: input.dispatchId }),
      });

      return { success: true };
    }),

  webhook: authedQuery
    .input(z.object({
      event: z.string(),
      id: z.string(),
      post_id: z.string().optional(),
      platform: z.string().optional(),
      error: z.string().optional(),
      dead: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();

      const post = await db.query.posts.findFirst({
        where: eq(posts.dispatchId, input.id),
      });

      if (!post) return { success: false, error: "Post not found" };

      if (input.event === "published") {
        await db.update(posts).set({
          status: "published",
          publishedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(posts.id, post.id));

        if (input.platform) {
          const account = await db.query.socialAccounts.findFirst({
            where: eq(socialAccounts.platform, input.platform),
          });
          if (account) {
            await db.update(postAccounts).set({
              platformStatus: "published",
              publishedAt: new Date(),
            }).where(
              and(
                eq(postAccounts.postId, post.id),
                eq(postAccounts.accountId, account.id)
              )
            );
          }
        }

        await createActivity({
          type: "publish",
          message: `Post published to ${input.platform || "platform"}`,
          metadata: JSON.stringify(input),
        });
      } else if (input.event === "failed") {
        await db.update(posts).set({
          status: input.dead ? "failed" : "scheduled",
          updatedAt: new Date(),
        }).where(eq(posts.id, post.id));

        await createActivity({
          type: "publish",
          message: `Publish failed: ${input.error || "Unknown error"}`,
          metadata: JSON.stringify(input),
        });
      }

      return { success: true };
    }),
});
