import { AdminResource } from "@/components/admin-resource";
import { PageHeader } from "@/components/dashboard";

export default function TopicsPage() {
  return <><PageHeader mode="admin" title="Taxonomy" description="Shared categories, subcategories, topics, aliases, and project permissions"/><AdminResource endpoint="/api/internal/taxonomy" label="Taxonomy" mutable/></>;
}
