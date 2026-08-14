"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  savePlatformSectionAction,
  type AdminContentState,
} from "@/lib/admin/content-actions";

/* Pages admin (PP6a) — the hero copy for the About landing and the four toolkit
   pages. Five rows, fixed: the database itself constrains the slug set, so
   there is no Add and no Delete on this screen and no way to create a broken
   menu item.

   Selection is server-driven via ?page=<slug>, matching the other admin screens.

   Nothing on screen is a path, an id or a bucket name. The one field that
   mentions a file — the hero photo — takes the site-relative path it already
   uses, shown with an example, because these five photos are shipped assets
   rather than uploads. Uploading arrives with the Files screen.

   DELIBERATELY ABSENT: the eyebrow and the section video link. Both columns
   exist and both are editable by the RPC, but NOTHING RENDERS THEM — the hero
   shows title and lead only, and no section-level video button exists. Shipping
   a control that reports "Saved" and changes nothing a partner can see is the
   same failure this screen was built to avoid (get_platform_sections had zero
   call sites until PP6a wrapped it). They return when a consumer does. Removed
   after the independent review, 2026-08-14. */

export type PageRow = {
  slug: string;
  num: number;
  label: string;
  eyebrow: string | null;
  title: string;
  lead: string | null;
  hero_image_path: string | null;
  hero_position: string | null;
  youtube_url: string | null;
  sort_order: number;
};

const INITIAL: AdminContentState = { ok: false, message: null };

/* Live character counter. The card and hero are typeset for a length, so a
   counter is friendlier than truncating the owner's words after the fact. */
function Counter({ value, max }: { value: string; max: number }) {
  const over = value.length > max;
  return (
    <span
      className="adm-td-muted"
      style={{ fontSize: "0.75rem", color: over ? "var(--red-700)" : undefined }}
    >
      {value.length} / {max}
      {over ? " — long, it may wrap on a phone" : ""}
    </span>
  );
}

export function PagesAdmin({
  rows,
  selected,
}: {
  rows: PageRow[];
  selected: PageRow | null;
}) {
  const router = useRouter();
  const [state, formAction, pending] = React.useActionState(
    savePlatformSectionAction,
    INITIAL,
  );

  const select = (slug: string) =>
    router.push(`/admin/content/pages?page=${slug}`, { scroll: false });

  return (
    <div className="adm-split">
      <table className="adm-table">
        <thead>
          <tr>
            <th>Page</th>
            <th>Heading</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.slug}
              className={selected?.slug === r.slug ? "is-selected" : undefined}
            >
              <td className="adm-td-strong">{r.label}</td>
              <td className="adm-td-muted">{r.title}</td>
              <td>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => select(r.slug)}
                >
                  Edit
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selected ? (
        <PageForm
          key={selected.slug}
          page={selected}
          state={state}
          formAction={formAction}
          pending={pending}
        />
      ) : (
        <p className="adm-intro">Choose a page to edit its heading and photo.</p>
      )}
    </div>
  );
}

function PageForm({
  page,
  state,
  formAction,
  pending,
}: {
  page: PageRow;
  state: AdminContentState;
  formAction: (formData: FormData) => void;
  pending: boolean;
}) {
  const [title, setTitle] = React.useState(page.title);
  const [lead, setLead] = React.useState(page.lead ?? "");

  return (
    <div className="adm-detail">
      {/* Bare <h2>, as the other admin detail panels do — `.adm-detail h2` is
          the existing rule and this screen adds no CSS of its own. */}
      <h2>{page.label}</h2>
      <p className="adm-intro">
        {page.slug === "about"
          ? "The landing page a partner sees first, at /dashboard."
          : `The top of the ${page.label} page, above its focus areas.`}
      </p>

      <form action={formAction} className="adm-form">
        {/* The slug is the identity of the page and is frozen in the database.
            It is round-tripped, never edited. */}
        <input type="hidden" name="slug" value={page.slug} />

        <label className="adm-form-field">
          <span className="adm-field-label">Page name</span>
          <input
            className="adm-input"
            name="label"
            required
            maxLength={120}
            defaultValue={page.label}
          />
          <span className="adm-field-hint">
            Shown on the browser tab and in search results.
          </span>
        </label>

        <label className="adm-form-field">
          <span className="adm-field-label">Heading</span>
          <input
            className="adm-input"
            name="title"
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Counter value={title} max={60} />
        </label>

        <label className="adm-form-field">
          <span className="adm-field-label">Intro paragraph</span>
          <textarea
            className="adm-textarea"
            name="lead"
            rows={3}
            maxLength={1000}
            value={lead}
            onChange={(e) => setLead(e.target.value)}
          />
          <Counter value={lead} max={180} />
        </label>

        <label className="adm-form-field">
          <span className="adm-field-label">Hero photo</span>
          <input
            className="adm-input"
            name="heroImagePath"
            maxLength={300}
            defaultValue={page.hero_image_path ?? ""}
            placeholder="/assets/workspace/heroes/setup.jpg"
          />
          <span className="adm-field-hint">
            Leave blank to keep the photo this page ships with.
          </span>
        </label>

        <label className="adm-form-field">
          <span className="adm-field-label">Photo focal point</span>
          <input
            className="adm-input"
            name="heroPosition"
            maxLength={60}
            defaultValue={page.hero_position ?? ""}
            placeholder="50% 50%"
          />
          <span className="adm-field-hint">
            Which part of the photo stays in view when it crops. Left to right,
            then top to bottom — “50% 50%” is the centre.
          </span>
        </label>

        {state.message ? (
          <p
            role={state.ok ? "status" : "alert"}
            className={`adm-form-msg ${state.ok ? "is-ok" : "is-err"}`}
          >
            {state.message}
          </p>
        ) : null}

        <div className="adm-detail-actions">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}
