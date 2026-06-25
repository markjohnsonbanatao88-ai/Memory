import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { MemoryBrowserShell } from "@/components/memory-browser/MemoryBrowserShell";
import { PageHeader } from "@/components/ui/page-header";
import { InMemoryPersistedMemoryReadRepository } from "@/lib/db/in-memory-persisted-memory-read-repository";
import { resolvePandoraServerSession, createRepositoryContextFromPandoraSession } from "@/lib/auth/pandora-server-session-resolver";
import { resolvePandoraRuntimeSafetyConfig } from "@/lib/config/pandora-runtime-safety-config";
import { loadPersistedMemoryBrowserView } from "@/lib/services/persisted-memory-browser-loader";
import type { PersistedMemoryNamespace } from "@/lib/services/persisted-memory-read-contract";
export const dynamic = "force-dynamic";
export default async function MemoryBrowserPage({ searchParams }: Readonly<{ searchParams?: Promise<Record<string, string | string[] | undefined>> }>) {
  const params = await searchParams; const value = (key: string) => typeof params?.[key] === "string" ? params[key] : undefined; const namespace = value("namespace") as PersistedMemoryNamespace | undefined;
  const runtime = resolvePandoraRuntimeSafetyConfig(); const session = await resolvePandoraServerSession(); const context = createRepositoryContextFromPandoraSession({ sessionResult: session, namespace });
  const viewModel = await loadPersistedMemoryBrowserView({ authenticated: session.ok, context: context.ok ? context.context : { namespace }, runtime, repository: new InMemoryPersistedMemoryReadRepository(), selectedItemId: value("itemId"), filters: { namespace, keyword: value("keyword"), sourceId: value("sourceId"), memoryKind: value("memoryKind"), createdFrom: value("createdFrom"), createdTo: value("createdTo") } });
  return <AppShell><PageHeader eyebrow="Public foundation shell" title="Public memory browser shell" description="This public route keeps persisted-memory reads disabled. Use the authenticated admin route for Phase 3B proof work." actions={<><Link className="button-link button-link--primary" href="/admin/memory/browser?namespace=real_life">Go to Phase 3B admin browser</Link><Link className="button-link" href="/api/session">Check session</Link></>} /><MemoryBrowserShell viewModel={viewModel} routeKind="public" /></AppShell>;
}
