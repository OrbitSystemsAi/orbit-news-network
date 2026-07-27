import { NextResponse } from "next/server";

export type ApiMeta = { requestId?: string };
export function apiSuccess<T>(data: T, status = 200, meta: ApiMeta = {}) {
  return NextResponse.json({ data, meta: { requestId: meta.requestId ?? crypto.randomUUID(), timestamp: new Date().toISOString() } }, { status });
}
