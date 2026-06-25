import { relations } from "drizzle-orm";
import { posts, socialAccounts, postAccounts, media } from "./schema";

export const postsRelations = relations(posts, ({ many }) => ({
  postAccounts: many(postAccounts),
  media: many(media),
}));

export const socialAccountsRelations = relations(socialAccounts, ({ many }) => ({
  postAccounts: many(postAccounts),
}));

export const postAccountsRelations = relations(postAccounts, ({ one }) => ({
  post: one(posts, { fields: [postAccounts.postId], references: [posts.id] }),
  account: one(socialAccounts, { fields: [postAccounts.accountId], references: [socialAccounts.id] }),
}));

export const mediaRelations = relations(media, ({ one }) => ({
  post: one(posts, { fields: [media.postId], references: [posts.id] }),
}));
