import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import {
  findAllAccounts,
  findAccountById,
  findConnectedAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
} from "./queries/accounts";

export const accountsRouter = createRouter({
  list: authedQuery.query(({ ctx }) => findAllAccounts(ctx.user!.id)),

  connected: authedQuery.query(({ ctx }) => findConnectedAccounts(ctx.user!.id)),

  byId: authedQuery
    .input(z.object({ id: z.number() }))
    .query(({ input, ctx }) => findAccountById(input.id, ctx.user!.id)),

  create: authedQuery
    .input(z.object({
      platform: z.string().min(1),
      name: z.string().min(1),
      handle: z.string().min(1),
      avatarUrl: z.string().optional(),
      followerCount: z.number().optional(),
      platformId: z.string().optional(),
      accessToken: z.string().optional(),
      platformCategory: z.string().optional(),
    }))
    .mutation(({ input, ctx }) => createAccount({
      ...input,
      userId: ctx.user!.id,
      isConnected: "true",
      followerCount: input.followerCount ?? 0,
    })),

  update: authedQuery
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      handle: z.string().optional(),
      avatarUrl: z.string().optional(),
      followerCount: z.number().optional(),
      isConnected: z.enum(["true", "false"]).optional(),
    }))
    .mutation(({ input, ctx }) => {
      const { id, ...data } = input;
      return updateAccount(id, data, ctx.user!.id);
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input, ctx }) => deleteAccount(input.id, ctx.user!.id)),
});