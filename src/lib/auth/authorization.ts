import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getNeonAuth } from "@/lib/auth/server";
import { serverEnvironment } from "@/lib/environment/server";
import { accessCookieName, verifyAccessSession } from "@/lib/security/access-session";
import { parseAllowedEmails } from "@/lib/auth/allowed-emails";

export function isOnnAdministrator(email: string | null | undefined) {
  return Boolean(email && parseAllowedEmails(serverEnvironment.ONN_ADMIN_EMAILS).has(email.toLowerCase()));
}

export async function getOnnIdentity() {
  const auth = getNeonAuth();
  if (!auth) return null;
  const { data } = await auth.getSession();
  return data?.user ?? null;
}

export async function requireOnnAdministrator() {
  if (!getNeonAuth()) {
    const legacySession = (await cookies()).get(accessCookieName)?.value;
    if (verifyAccessSession(legacySession, serverEnvironment.ADMIN_ACCESS_KEY)) return null;
    redirect("/access");
  }
  const user = await getOnnIdentity();
  if (!user) redirect("/access/sign-in");
  if (!isOnnAdministrator(user.email)) redirect("/access-denied");
  return user;
}
