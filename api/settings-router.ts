import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";

const settingsSchema = z.object({
  darkMode: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  autoSchedule: z.boolean().optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
});

export const settingsRouter = createRouter({
  get: authedQuery.query(async ({ ctx }) => {
    const user = await getDb().query.users.findFirst({
      where: eq(users.id, ctx.user!.id),
    });
    if (!user?.settings) {
      return {
        darkMode: false,
        emailNotifications: true,
        pushNotifications: true,
        autoSchedule: false,
        timezone: "America/New_York",
        language: "en",
      };
    }
    return JSON.parse(user.settings);
  }),

  update: authedQuery
    .input(settingsSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await getDb().query.users.findFirst({
        where: eq(users.id, ctx.user!.id),
      });
      const current = user?.settings ? JSON.parse(user.settings) : {};
      const updated = { ...current, ...input };
      await getDb().update(users).set({
        settings: JSON.stringify(updated),
        updatedAt: new Date(),
      }).where(eq(users.id, ctx.user!.id));
      return updated;
    }),
});
