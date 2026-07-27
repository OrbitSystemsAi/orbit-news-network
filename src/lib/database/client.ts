import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalDatabase = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required for database operations.");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

export const database = new Proxy({} as PrismaClient, {
  get(_target, property) {
    globalDatabase.prisma ??= createClient();
    const value = globalDatabase.prisma[property as keyof PrismaClient];
    return typeof value === "function" ? value.bind(globalDatabase.prisma) : value;
  },
});
