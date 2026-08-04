import Link from "next/link";
import { PageHeader } from "@/components/dashboard";
import { Panel } from "@/components/ui";

export default function Page() {
  return <>
    <PageHeader mode="portal" title="Publishing integration" description="First-party content enters ONN through originating application servers" />
    <Panel title="Server-to-server submission required">
      <div className="publishing-boundary">
        <p>Private ONN project credentials must never be entered into a browser form or exposed to client-side JavaScript.</p>
        <p>Configure the credential in the originating application&apos;s server environment, then call <code>POST /api/v1/content/submissions</code> with a stable idempotency key.</p>
        <div><Link href="/developers">View the publishing contract</Link><Link href="/portal/api-keys">Manage scoped credentials</Link></div>
      </div>
    </Panel>
  </>;
}
