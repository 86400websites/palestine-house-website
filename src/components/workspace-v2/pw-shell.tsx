import { PwHeader } from "@/components/workspace-v2/pw-header";
import { WORKSPACE_CHROME } from "@/lib/workspace-v2/spec";

/* Workspace v2 shell (PP2) — the chrome every new platform page sits inside.

   `.pw-root` scopes the whole v2 design layer (src/styles/workspace-v2.css), so
   this element is what keeps the new system from touching the legacy workspace
   or the public site. A Server Component: only the header needs interactivity.

   The footer lands in 2d; page content arrives in 2e/2f. */

export function PwShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="pw-root">
      <a className="pw-skip-link" href="#pw-main">
        {WORKSPACE_CHROME.skipLink}
      </a>
      <PwHeader />
      <main id="pw-main" className="pw-main">
        {children}
      </main>
    </div>
  );
}
