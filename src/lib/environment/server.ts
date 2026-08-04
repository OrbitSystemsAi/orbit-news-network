import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  DIRECT_URL: z.string().min(1).optional(),
  ADMIN_ACCESS_KEY: z.string().min(24).optional(),
  API_KEY_HASH_SECRET: z.string().min(32).optional(),
  NEON_AUTH_BASE_URL: z.string().url().optional(),
  NEON_AUTH_COOKIE_SECRET: z.string().min(32).optional(),
  ONN_ADMIN_EMAILS: z.string().default(""),
  ONN_ALLOW_SIGN_UP: z.string().optional().transform((value) => value === "true"),
  NEWS_VISIBLE_HOURS: z.coerce.number().int().positive().default(24),
  NEWS_DELETE_AFTER_HOURS: z.coerce.number().int().positive().default(48),
  DEFAULT_FEED_REFRESH_MINUTES: z.coerce.number().int().positive().default(30),
  FEED_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1000).max(30000).default(10000),
  REFRESH_LOCK_TIMEOUT_MINUTES: z.coerce.number().int().positive().default(5),
  CONTENT_MAX_TITLE_LENGTH: z.coerce.number().int().positive().default(200),
  CONTENT_MAX_SUMMARY_LENGTH: z.coerce.number().int().positive().default(1000),
  CONTENT_MAX_BODY_LENGTH: z.coerce.number().int().positive().default(50000),
  DEFAULT_LANGUAGE: z.string().default("en"),
  IDEMPOTENCY_RETENTION_HOURS: z.coerce.number().int().positive().default(48),
  ACCESS_SESSION_HOURS: z.coerce.number().int().min(1).max(24).default(8),
});

export const serverEnvironment = schema.parse(process.env);
