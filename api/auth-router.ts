import { z } from "zod";
import * as cookie from "cookie";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { hashPassword, verifyPassword } from "./lib/password";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import * as jose from "jose";
import { env } from "./lib/env";

async function signToken(payload: { userId: number; email: string }): Promise<string> {
  const secret = new TextEncoder().encode(env.appSecret);
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

async function verifyToken(token: string): Promise<{ userId: number; email: string } | null> {
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(env.appSecret);
    const { payload } = await jose.jwtVerify(token, secret, { algorithms: ["HS256"] });
    if (typeof payload.userId !== "number" || typeof payload.email !== "string") return null;
    return { userId: payload.userId, email: payload.email };
  } catch {
    return null;
  }
}

export async function authenticateRequest(headers: Headers): Promise<typeof users.$inferSelect | null> {
  const cookies = cookie.parse(headers.get("cookie") || "");
  const token = cookies[Session.cookieName];
  if (!token) return null;

  const claim = await verifyToken(token);
  if (!claim) return null;

  const rows = await getDb()
    .select()
    .from(users)
    .where(eq(users.id, claim.userId))
    .limit(1);
  return rows.at(0) ?? null;
}

export const authRouter = createRouter({
  me: authedQuery.query((opts) => opts.ctx.user),

  register: publicQuery
    .input(z.object({
      email: z.string().email("Invalid email"),
      password: z.string().min(8, "Password must be at least 8 characters"),
      name: z.string().min(1, "Name is required"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      const existing = await db.query.users.findFirst({
        where: eq(users.email, input.email),
      });
      if (existing) {
        throw new Error("Email already registered");
      }

      const passwordHash = hashPassword(input.password);

      const [result] = await db.insert(users).values({
        email: input.email,
        passwordHash,
        name: input.name,
        role: "admin",
      }).returning();

      const token = await signToken({ userId: result.id, email: input.email });
      const opts = getSessionCookieOptions(ctx.req.headers);
      ctx.resHeaders.append(
        "set-cookie",
        cookie.serialize(Session.cookieName, token, {
          ...opts,
          maxAge: Session.maxAgeMs / 1000,
        }),
      );

      return { userId: result.id, email: input.email, name: input.name };
    }),

  login: publicQuery
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      const user = await db.query.users.findFirst({
        where: eq(users.email, input.email),
      });
      if (!user) {
        throw new Error("Invalid email or password");
      }

      const valid = verifyPassword(input.password, user.passwordHash);
      if (!valid) {
        throw new Error("Invalid email or password");
      }

      await db.update(users).set({
        lastSignInAt: new Date(),
      }).where(eq(users.id, user.id));

      const token = await signToken({ userId: user.id, email: user.email });
      const opts = getSessionCookieOptions(ctx.req.headers);
      ctx.resHeaders.append(
        "set-cookie",
        cookie.serialize(Session.cookieName, token, {
          ...opts,
          maxAge: Session.maxAgeMs / 1000,
        }),
      );

      return { userId: user.id, email: user.email, name: user.name };
    }),

  logout: authedQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: "lax",
        secure: opts.secure,
        maxAge: 0,
      }),
    );
    return { success: true };
  }),

  firebaseLogin: publicQuery
    .input(z.object({
      accessToken: z.string(),
      email: z.string().email(),
      name: z.string().optional(),
      providerId: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      let user = await db.query.users.findFirst({
        where: eq(users.email, input.email),
      });

      if (!user) {
        const [result] = await db.insert(users).values({
          email: input.email,
          passwordHash: "firebase-auth",
          name: input.name || input.email.split("@")[0],
          role: "admin",
        }).returning();
        user = result;
      }

      await db.update(users).set({
        lastSignInAt: new Date(),
      }).where(eq(users.id, user.id));

      const token = await signToken({ userId: user.id, email: user.email });
      const opts = getSessionCookieOptions(ctx.req.headers);
      ctx.resHeaders.append(
        "set-cookie",
        cookie.serialize(Session.cookieName, token, {
          ...opts,
          maxAge: Session.maxAgeMs / 1000,
        }),
      );

      return { userId: user.id, email: user.email, name: user.name };
    }),
});
