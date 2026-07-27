import { z } from "zod";
export const slugSchema = z.string().min(2).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const paginationSchema = z.object({ cursor: z.string().optional(), limit: z.coerce.number().int().min(1).max(100).default(25) });
