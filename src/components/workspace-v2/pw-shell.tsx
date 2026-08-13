import { PwHeader } from "@/components/workspace-v2/pw-header";
import { PwFooter } from "@/components/workspace-v2/pw-footer";
import { PwToastProvider } from "@/components/workspace-v2/pw-toast";
import { PwSearchProvider } from "@/components/workspace-v2/pw-search";
import { WORKSPACE_CHROME } from "@/lib/workspace-v2/spec";

/* Workspace v2 shell (PP2) — the chrome every new platform page sits inside.

   `.pw-root` scopes the whole v2 design layer (src/styles/workspace-v2.css), so
   this element is what keeps the new system from touching the legacy workspace
   or the public site. A Server Component: only the header needs interactivity.

   The footer lands in 2d; page content arrives in 2e/2f.

   PP4 adds the search provider. It wraps the shell rather than sitting beside
   it because the footer's two search entry points are inside it, and Ctrl/⌘+K
   has to work from anywhere on the page. The dialog it renders costs nothing
   until it is opened: the ~363-entry index is fetched by a server action on
   first open, never shipped with the page. */

export function PwShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="pw-root">
      <PwToastProvider>
        <PwSearchProvider>
          <a className="pw-skip-link" href="#pw-main">
            {WORKSPACE_CHROME.skipLink}
          </a>
          <PwHeader />
          <main id="pw-main" className="pw-main">
            {children}
          </main>
          <PwFooter />
        </PwSearchProvider>
      </PwToastProvider>
    </div>
  );
}
