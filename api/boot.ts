import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";

const app = new Hono<{ Bindings: HttpBindings }>();

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
function rateLimiterMiddleware(limit: number, windowMs: number) {
  return async (c: any, next: () => Promise<void>) => {
    const key = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "anonymous";
    const now = Date.now();
    const entry = rateLimitStore.get(key);
    if (!entry || now > entry.resetAt) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      entry.count++;
      if (entry.count > limit) {
        return c.json({ error: "Too many requests" }, 429);
      }
    }
    await next();
  };
}

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

app.use("*", cors({
  origin: env.isProduction ? env.appUrl : "*",
  credentials: true,
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

app.use("/api/*", rateLimiterMiddleware(100, 60 * 1000));

app.use("*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("X-XSS-Protection", "1; mode=block");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com; style-src 'self' 'unsafe-inline'; img-src 'self' https://api.dicebear.com https://images.unsplash.com data: blob:; font-src 'self'; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://graph.facebook.com; frame-src https://socialsync-500708.firebaseapp.com https://accounts.google.com; frame-ancestors 'none';");
});

app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

app.get("/api/health", (c) => c.json({ status: "ok" }));

app.get("/api/test-fb", async (c) => {
  const token = c.req.query("token");
  if (!token) return c.json({ error: "Missing ?token= param" }, 400);

  try {
    const results: Record<string, any> = {};

    const meRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=name,id&access_token=${token}`);
    results.user = await meRes.json();

    const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=name,id,access_token&access_token=${token}`);
    results.pages = await pagesRes.json();

    if (results.pages?.data?.[0]) {
      const pageId = results.pages.data[0].id;
      const pageToken = results.pages.data[0].access_token;
      const igRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${pageToken}`);
      results.instagram = await igRes.json();
    }

    return c.json(results);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.get("/api/facebook/pages", async (c) => {
  const token = c.req.query("token");
  if (!token) return c.json({ error: "Missing token parameter" }, 400);

  try {
    const userRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=name,id&access_token=${encodeURIComponent(token)}`);
    const user = await userRes.json();
    if (user.error) return c.json({ error: user.error });

    const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=name,id,access_token,category,fan_count,followers_count&access_token=${encodeURIComponent(token)}`);
    const pages = await pagesRes.json();
    if (pages.error) return c.json({ error: pages.error });

    return c.json({ user, pages: pages.data || [] });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.get("/api/facebook/posts", async (c) => {
  const pageId = c.req.query("pageId");
  const pageToken = c.req.query("pageToken");

  if (!pageId || !pageToken) return c.json({ error: "Missing pageId or pageToken" }, 400);

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed?fields=id,message,created_time,type,full_picture&limit=10&access_token=${encodeURIComponent(pageToken)}`);
    const data = await res.json();
    if (data.error) return c.json({ error: data.error });

    return c.json({ posts: data.data || [] });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.post("/api/webhooks/dispatch", async (c) => {
  const body = await c.req.json();
  const { appRouter } = await import("./router");
  const { createContext } = await import("./context");

  const caller = appRouter.createCaller(
    await createContext({ req: c.req.raw, resHeaders: new Headers(), info: {} as any })
  );

  try {
    await caller.publish.webhook(body);
    return c.json({ success: true });
  } catch {
    return c.json({ success: false, error: "Webhook processing failed" }, 500);
  }
});

app.post("/api/ai/generate-caption", async (c) => {
  const body = await c.req.json();
  const captions = [
    "Just dropped something exciting! Stay tuned for what's coming next #NewBeginnings",
    "Behind every great brand is a team that never stops creating. Here's to the dreamers and doers #TeamWork",
    "Your audience is waiting. Are you ready to inspire? Let's make today count #ContentCreator",
    "Big news coming your way! We've been cooking up something special and we can't wait to share it #StayTuned",
    "Consistency is the key to growth. Show up, create value, and watch your community thrive #GrowthMindset",
  ];
  const index = Date.now() % captions.length;
  const caption = captions[index];
  return c.json({ caption });
});

app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  console.log(`Starting server on port ${port}...`);
  const server = serve({ fetch: app.fetch, port, hostname: "0.0.0.0" }, () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });

  const shutdown = () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}
