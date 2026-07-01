import { env } from "./env";
import { getDb } from "../queries/connection";
import { posts } from "@db/schema";
import { eq, and } from "drizzle-orm";

interface DispatchTarget {
  platform: string;
  accountHandle?: string;
}

interface DispatchResponse {
  id: string;
  status: string;
  platforms: Record<string, { status: string; postId?: string; error?: string }>;
}

function getPlatformFormatKey(platform: string): string {
  const formatMap: Record<string, string> = {
    twitter: "twitter_thread",
    instagram: "instagram_post",
    facebook: "facebook_post",
    linkedin: "linkedin_post",
    tiktok: "tiktok_post",
    threads: "threads_post",
    bluesky: "bluesky_post",
    telegram: "telegram_message",
  };
  return formatMap[platform] || `${platform}_post`;
}

function buildFormats(content: string, platforms: string[]): Record<string, any> {
  const formats: Record<string, any> = {};

  for (const platform of platforms) {
    const formatKey = getPlatformFormatKey(platform);

    switch (platform) {
      case "twitter":
        formats[formatKey] = { tweets: [content] };
        break;
      case "instagram":
        formats[formatKey] = { caption: content };
        break;
      case "facebook":
        formats[formatKey] = { message: content };
        break;
      case "linkedin":
        formats[formatKey] = { text: content };
        break;
      case "tiktok":
        formats[formatKey] = { caption: content };
        break;
      case "threads":
        formats[formatKey] = { text: content };
        break;
      case "bluesky":
        formats[formatKey] = { text: content };
        break;
      case "telegram":
        formats[formatKey] = { text: content };
        break;
      default:
        formats[formatKey] = { text: content };
    }
  }

  return formats;
}

export async function dispatchPost(postId: number, userId: number): Promise<DispatchResponse> {
  const db = getDb();

  const post = await db.query.posts.findFirst({
    where: and(eq(posts.id, postId), eq(posts.userId, userId)),
    with: {
      postAccounts: {
        with: {
          account: true,
        },
      },
    },
  });

  if (!post) {
    throw new Error(`Post ${postId} not found`);
  }

  const platforms = post.postAccounts
    .filter((pa) => pa.account.isConnected === "true")
    .map((pa) => pa.account.platform);

  if (platforms.length === 0) {
    throw new Error("No connected platforms for this post");
  }

  const targets: DispatchTarget[] = post.postAccounts
    .filter((pa) => pa.account.isConnected === "true")
    .map((pa) => ({
      platform: pa.account.platform,
      accountHandle: pa.account.handle,
    }));

  const formats = buildFormats(post.content, platforms);

  const scheduledFor = post.scheduledAt
    ? new Date(post.scheduledAt).toISOString()
    : undefined;

  const body = {
    targets,
    formats,
    ...(scheduledFor && { scheduled_for: scheduledFor }),
    webhook_url: `${env.appUrl}/api/webhooks/dispatch`,
  };

  const response = await fetch(`${env.dispatchUrl}/dispatch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Dispatch failed: ${error}`);
  }

  const result: DispatchResponse = await response.json() as DispatchResponse;

  await db.update(posts).set({
    dispatchId: result.id,
    status: scheduledFor ? "scheduled" : "published",
    publishedAt: scheduledFor ? null : new Date(),
    updatedAt: new Date(),
  }).where(eq(posts.id, postId));

  return result;
}

export async function getDispatchStatus(dispatchId: string): Promise<DispatchResponse> {
  const response = await fetch(`${env.dispatchUrl}/queue/${dispatchId}`);

  if (!response.ok) {
    throw new Error(`Failed to get dispatch status: ${response.statusText}`);
  }

  return response.json() as Promise<DispatchResponse>;
}

export async function retryDispatch(dispatchId: string): Promise<void> {
  const response = await fetch(`${env.dispatchUrl}/queue/${dispatchId}/retry`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Failed to retry dispatch: ${response.statusText}`);
  }
}