import { apiError } from "@/lib/api/error";
import { getNeonAuth } from "@/lib/auth/server";

type Context = { params: Promise<{ path: string[] }> };

async function handle(request: Request, context: Context) {
  const auth = getNeonAuth();
  if (!auth) return apiError("AUTH_NOT_CONFIGURED", "Neon Auth is not configured for this environment.", 503);

  const handlers = auth.handler();
  const method = request.method as keyof typeof handlers;
  const handler = handlers[method];
  if (!handler) return apiError("METHOD_NOT_ALLOWED", "This authentication method is not supported.", 405);
  return handler(request, context);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
export const PATCH = handle;
