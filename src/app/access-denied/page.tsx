import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="denied-heading">
        <div className="auth-brand">ORBIT NEWS NETWORK</div>
        <h1 id="denied-heading">Access not assigned</h1>
        <p>Your identity is valid, but it is not listed as an ONN administrator.</p>
        <p>Ask an ONN owner to add your email address to the server-only administrator allowlist.</p>
        <div className="auth-actions">
          <Link href="/access/sign-in">Use another account</Link>
          <Link href="/">Return to ONN</Link>
        </div>
      </section>
    </main>
  );
}
