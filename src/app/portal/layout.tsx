import { AppShell } from "@/components/app-shell";
import { requireOnnAdministrator } from "@/lib/auth/authorization";

export const dynamic = "force-dynamic";

export default async function PortalLayout({children}:{children:React.ReactNode}){
  const identity = await requireOnnAdministrator();
  return <AppShell mode="portal" identity={identity}>{children}</AppShell>;
}
