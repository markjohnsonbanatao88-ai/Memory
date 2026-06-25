import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";

function safeNextPath(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export default async function LoginPage({ searchParams }: Readonly<{ searchParams?: Promise<{ error?: string; next?: string }> }>) {
  const params = await searchParams;
  const nextPath = safeNextPath(params?.next);

  return (
    <main className="auth-page">
      <SectionCard
        title="Supabase Auth foundation"
        description="Start a temporary operator session, then return automatically to the Phase 3B read-only memory browser. Memory writes still require separate internal controls."
      >
        <div className="auth-status-line">
          <StatusBadge status="foundation" />
          <span>Auth/session boundary implemented without public memory exposure.</span>
        </div>
        {params?.error ? <p className="auth-form__message auth-form__message--error">Authentication callback failed. Please request a new magic link.</p> : null}
        <LoginForm nextPath={nextPath} />
        <p className="auth-note">This page uses only the public Supabase URL and anon key. Server secrets are not exposed to the browser.</p>
        <div className="topbar__actions">
          <Link className="button-link" href={nextPath}>Return to requested page</Link>
          <Link className="button-link" href="/api/session">View session JSON</Link>
        </div>
      </SectionCard>
    </main>
  );
}
