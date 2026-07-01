import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

export const env = {
  appSecret: required("APP_SECRET"),
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
  appUrl: process.env.APP_URL || "http://localhost:3000",
  dispatchUrl: process.env.OPEN_DISPATCH_URL || "http://localhost:8000",
  fbAppId: process.env.FB_APP_ID || "1368642678453217",
  fbAppSecret: process.env.FB_APP_SECRET || "",
  igAppId: process.env.IG_APP_ID || "866679789390363",
  igAppSecret: process.env.IG_APP_SECRET || "be1184aa36b20cf11b9c1a1a315f3a15",
  webhookVerifyToken: process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || "socialsync-webhook-verify",
};
