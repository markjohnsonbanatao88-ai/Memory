import { AppShell } from "@/components/layout/app-shell";
import { MemoryBrowserShell } from "@/components/memory-browser/MemoryBrowserShell";
import { PageHeader } from "@/components/ui/page-header";
import { InMemoryPersistedMemoryReadRepository } from "@/lib/db/in-memory-persisted-memory-read-repository";
import { getCurrentUser } from "@/lib/security/auth";
import { loadPersistedMemoryBrowserView } from "@/lib/services/persisted-memory-browser-loader";
import type { PersistedMemoryNamespace } from "@/lib/services/persisted-memory-read-contract";

export const dynamic = "force-dynamic";
export default async function MemoryBrowserPage({ searchParams }: Readonly<{ searchParams?: Promise<Record<string, string | string[] | undefined>> }>) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const value = (key: string) => typeof params?.[key] === "string" ? params[key] : undefined;
  const namespace = value("namespace") as PersistedMemoryNamespace | undefined;
  const repository = new InMemoryPersistedMemoryReadRepository();
  const viewModel = await loadPersistedMemoryBrowserView({ context: { userId: user?.id ?? "", namespace }, repository, selectedItemId: value("itemId"), filters: { namespace, keyword: value("keyword"), sourceId: value("sourceId"), memoryKind: value("memoryKind"), createdFrom: value("createdFrom"), createdTo: value("createdTo") } });
  return <AppShell><PageHeader eyebrow="Persisted memory" title="Read-only memory browser" description="Read-only view of persisted memories, sources, patches, and audit trail." /><MemoryBrowserShell viewModel={viewModel} /></AppShell>;
}
