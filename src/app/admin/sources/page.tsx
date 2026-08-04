import { PageHeader } from "@/components/dashboard";
import { SourceAdmin } from "@/components/source-admin";

export default function SourcesPage() {
  return <>
    <PageHeader mode="admin" title="Sources" description="Review, approve, and operate external RSS and Atom feeds" />
    <SourceAdmin />
  </>;
}
