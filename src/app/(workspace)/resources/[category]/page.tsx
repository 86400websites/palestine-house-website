import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Info } from "lucide-react";
import { getMyProfile } from "@/lib/auth/profile";
import { getResources, getElements } from "@/lib/workspace/content";
import { PendingState } from "@/components/workspace/pending-state";
import { CATEGORY_TYPE_CHIPS, toResourceVM } from "@/lib/resources/view";
import { ResourceLibrary } from "../resource-library";

/* /resources/[category] — a focus-area slice of the library
   (docs/page-copy/03-member-workspace/resources-category.md). Same data and
   download mechanics as the hub, scoped to one focus area (A–K). Gated before
   any fetch; an approved session with an unknown category gets a workspace 404. */

type Params = { params: Promise<{ category: string }> };

// Resolve the focus-area name for a URL param, or null if it isn't a real area.
async function resolveArea(param: string): Promise<{ code: string; name: string } | null> {
  const code = param.toUpperCase();
  if (!/^[A-K]$/.test(code)) return null;
  const elements = await getElements();
  const name = elements.find((e) => e.focus_area_code === code)?.focus_area_name;
  return name ? { code, name } : null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category } = await params;
  const profile = await getMyProfile();
  if (!profile?.is_approved) return { title: "Resources" };
  const area = await resolveArea(category);
  return { title: area ? area.name : "Resources" };
}

export default async function ResourcesCategoryPage({ params }: Params) {
  const { category } = await params;

  // Gate BEFORE any content fetch: a pending session never reaches a 404 or any
  // resource data — it sees the same "under review" notice as the rest.
  const profile = await getMyProfile();
  if (!profile?.is_approved) return <PendingState />;

  const area = await resolveArea(category);
  if (!area) notFound();

  const resources = await getResources();
  const vms = resources
    .filter((r) => r.focus_area_code === area.code)
    .map((r) => toResourceVM(r)); // single area → no per-row area label

  return (
    <div>
      <nav className="ws-breadcrumb" aria-label="Breadcrumb">
        <Link href="/resources">Resources</Link>
        <span className="ws-breadcrumb-sep" aria-hidden="true">
          /
        </span>
        <span aria-current="page">{area.name}</span>
      </nav>

      <div className="ws-element-head">
        <p className="ph-eyebrow">Focus Area {area.code}</p>
        <h1 className="ws-h1">{area.name}.</h1>
        <p className="ws-lead">
          Every guide, template, and tool for {area.name}, ready to use.
        </p>
      </div>

      <div style={{ marginTop: "var(--space-8)" }}>
        <ResourceLibrary resources={vms} chips={CATEGORY_TYPE_CHIPS} />
      </div>

      <p className="ws-help ws-help--mt-lg">
        <span className="ws-help-icon">
          <Info size={17} />
        </span>
        <span>
          Replace anything in [square brackets] with your House&rsquo;s details.
        </span>
      </p>
    </div>
  );
}
