"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { authClient } from "@/lib/auth/client";

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.push("/access/sign-in");
    router.refresh();
  }

  return <button type="button" onClick={signOut} aria-label="Sign out" title="Sign out" className="sign-out-button"><LogOut size={14}/></button>;
}
