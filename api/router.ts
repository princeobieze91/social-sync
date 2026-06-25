import { authRouter } from "./auth-router";
import { postsRouter } from "./posts-router";
import { accountsRouter } from "./accounts-router";
import { activitiesRouter } from "./activities-router";
import { analyticsRouter } from "./analytics-router";
import { settingsRouter } from "./settings-router";
import { mediaRouter } from "./media-router";
import { publishRouter } from "./publish-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  post: postsRouter,
  account: accountsRouter,
  activity: activitiesRouter,
  analytics: analyticsRouter,
  settings: settingsRouter,
  media: mediaRouter,
  publish: publishRouter,
});

export type AppRouter = typeof appRouter;
