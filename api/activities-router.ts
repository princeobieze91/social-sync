import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { findAllActivities, createActivity } from "./queries/activities";

export const activitiesRouter = createRouter({
  list: authedQuery
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(({ input }) => findAllActivities(input?.limit)),

  create: authedQuery
    .input(z.object({
      type: z.string().min(1),
      message: z.string().min(1),
      metadata: z.string().optional(),
    }))
    .mutation(({ input }) => createActivity(input)),
});
