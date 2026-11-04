import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { database, mongoClient } from "./database.js";

const authSecret = process.env.BETTER_AUTH_SECRET;
const authUrl = process.env.BETTER_AUTH_URL;
const frontendUrl = process.env.CLIENT_ORIGIN || process.env.FRONTEND_URL;

if (!authSecret || authSecret.length < 32) {
  throw new Error("BETTER_AUTH_SECRET is required and must be at least 32 characters.");
}

if (!authUrl || !frontendUrl) {
  throw new Error("BETTER_AUTH_URL and CLIENT_ORIGIN are required.");
}

const socialProviders = {};

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  socialProviders.github = {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  };
}

export const auth = betterAuth({
  appName: "Commonplace",
  baseURL: authUrl,
  secret: authSecret,
  trustedOrigins: [frontendUrl],
  database: mongodbAdapter(database, { client: mongoClient, transaction: false }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
  },
  socialProviders,
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    defaultCookieAttributes: {
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    },
  },
});
