import Link from "next/link";
import { redirect } from "next/navigation";
import { isNeonAuthConfigured } from "@/lib/auth/server";

export default async function AccessPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; error?: string }> }) {
  if (isNeonAuthConfigured()) redirect("/access/sign-in");

  const query = await searchParams;
  const returnTo = query.returnTo?.startsWith("/") && !query.returnTo.startsWith("//") ? query.returnTo : "/portal";
  return <main className="auth-page"><form method="post" action="/api/internal/session" className="auth-panel">
    <div className="auth-brand">ORBIT NEWS NETWORK</div>
    <h1>Migration access</h1>
    <p>Neon Auth is not configured yet. Use the temporary administrator key during migration.</p>
    <label className="auth-field">Administrative access key
      <input name="accessKey" type="password" required autoComplete="current-password" />
    </label>
    <input type="hidden" name="returnTo" value={returnTo} />
    {query.error ? <p role="alert" className="auth-error">Access was not accepted.</p> : null}
    <div className="auth-actions"><button type="submit">Continue</button><Link href="/">Cancel</Link></div>
  </form></main>;
}
