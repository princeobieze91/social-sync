import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { addMediaToPost } from "./queries/posts";

export const mediaRouter = createRouter({
  upload: authedQuery
    .input(z.object({
      postId: z.number(),
      url: z.string().url(),
      type: z.enum(["image", "video"]).default("image"),
    }))
    .mutation(({ input }) => addMediaToPost(input)),
});
