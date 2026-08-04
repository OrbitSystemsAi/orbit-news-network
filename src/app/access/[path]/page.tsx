import Link from "next/link";
import { isNeonAuthConfigured } from "@/lib/auth/server";
import { serverEnvironment } from "@/lib/environment/server";
import { OnnAuthForm } from "@/components/onn-auth-form";

export const dynamic = "force-dynamic";

export default async function AuthPage({ params }: { params: Promise<{ path: string }> }) {
  const { path } = await params;
  const mode = path === "sign-up" ? "sign-up" : "sign-in";

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="auth-heading">
        <div className="auth-brand">ORBIT NEWS NETWORK</div>
        <h1 id="auth-heading">Operator access</h1>
        <p>Sign in with your approved ONN operator identity.</p>
        {isNeonAuthConfigured() ? (
          <OnnAuthForm mode={mode} allowSignUp={serverEnvironment.ONN_ALLOW_SIGN_UP} />
        ) : (
          <div role="status" className="auth-configuration-message">
            Neon Auth has not been enabled for this environment yet.
          </div>
        )}
        <Link href="/" className="auth-cancel">Return to ONN</Link>
      </section>
    </main>
  );
}
