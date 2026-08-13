"use server";

import { getSearchIndex } from "./content";
import type { PwSearchItem } from "./types";

/* The server boundary for the global search overlay (PP4).

   The index is fetched ON FIRST OPEN rather than shipped with every page. It is
   ~363 entries; baking it into the RSC payload would add weight to all five
   platform pages to serve a panel most visits never open, and PP3 worked to get
   those pages to 117 kB. One round trip when Ctrl/⌘+K is first pressed, cached
   in the client for the rest of the session, costs nothing until it is wanted.

   This is a POST endpoint reachable by any authenticated session, so it must be
   safe for one that should see nothing: it is, because it adds no read of its
   own. getSearchIndex() goes through get_platform_topics() and get_resources(),
   both is_approved()-gated in the database, so a pending or declined caller
   gets zero rows and therefore an empty index — the same fail-closed shape as
   every other read in this layer.

   No arguments: matching happens in the browser, so there is nothing to
   validate and no way to use this to probe the data set. */

export async function fetchSearchIndex(): Promise<PwSearchItem[]> {
  return getSearchIndex();
}
