"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export function OnnAuthForm({ mode, allowSignUp }: { mode: "sign-in" | "sign-up"; allowSignUp: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(formData: FormData) {
    setPending(true);
    setMessage("");
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    const result = mode === "sign-up"
      ? await authClient.signUp.email({ email, password, name: String(formData.get("name") ?? "").trim() })
      : await authClient.signIn.email({ email, password });

    setPending(false);
    if (result.error) {
      setMessage(result.error.message ?? "Authentication was not accepted.");
      return;
    }
    router.push("/portal");
    router.refresh();
  }

  if (mode === "sign-up" && !allowSignUp) {
    return <div className="auth-configuration-message">New account registration is currently closed.</div>;
  }

  return <form action={submit} className="auth-form">
    {mode === "sign-up" ? <label className="auth-field">Name<input name="name" required autoComplete="name" /></label> : null}
    <label className="auth-field">Email<input name="email" type="email" required autoComplete="email" /></label>
    <label className="auth-field">Password<input name="password" type="password" required minLength={8} autoComplete={mode === "sign-up" ? "new-password" : "current-password"} /></label>
    {message ? <p role="alert" className="auth-error">{message}</p> : null}
    <div className="auth-actions">
      <button type="submit" disabled={pending}>{pending ? "Please wait…" : mode === "sign-up" ? "Create account" : "Sign in"}</button>
      {allowSignUp ? <Link href={mode === "sign-up" ? "/access/sign-in" : "/access/sign-up"}>{mode === "sign-up" ? "Sign in" : "Create account"}</Link> : null}
    </div>
  </form>;
}
