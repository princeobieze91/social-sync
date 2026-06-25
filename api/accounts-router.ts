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
  list: authedQuery.query(() => findAllAccounts()),

  connected: authedQuery.query(() => findConnectedAccounts()),

  byId: authedQuery
    .input(z.object({ id: z.number() }))
    .query(({ input }) => findAccountById(input.id)),

  create: authedQuery
    .input(z.object({
      platform: z.string().min(1),
      name: z.string().min(1),
      handle: z.string().min(1),
      avatarUrl: z.string().optional(),
      followerCount: z.number().optional(),
    }))
    .mutation(({ input }) => createAccount({
      ...input,
      isConnected: "true",
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
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return updateAccount(id, data);
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteAccount(input.id)),
});
