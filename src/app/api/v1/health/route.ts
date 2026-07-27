import { apiSuccess } from "@/lib/api/response";

export const dynamic = "force-dynamic";
export function GET() {
  const databaseConfigured = Boolean(process.env.DATABASE_URL);
  return apiSuccess({
    status: "ok",
    application: "Orbit News Network",
    version: process.env.npm_package_version ?? "0.1.0",
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    database: databaseConfigured ? "configured_not_probed" : "not_configured",
  });
}
