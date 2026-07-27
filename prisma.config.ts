import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // Prisma 7 loads this config for generate as well as database commands.
  // An empty value permits generation; database commands still fail safely
  // until DIRECT_URL or DATABASE_URL is explicitly configured.
  datasource: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "" },
});
