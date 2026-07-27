import { NextResponse } from "next/server";

export function apiError(code: string, message: string, status = 500, details: unknown[] = [], requestId = crypto.randomUUID()) {
  return NextResponse.json({ error: { code, message, details }, meta: { requestId, timestamp: new Date().toISOString() } }, { status });
}
