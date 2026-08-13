"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Search, X } from "lucide-react";
import { fetchSearchIndex } from "@/lib/workspace-v2/search";
import {
  highlightRanges,
  indexForSearch,
  searchIndexed,
  type PwIndexedItem,
  type PwSearchFilter,
} from "@/lib/workspace-v2/search-match";
import type { PwSearchItem } from "@/lib/workspace-v2/types";

/* The global search overlay (PP4 4g) — the mockup's Ctrl/⌘+K dialog.

   Behaviour is the mockup's `renderSearch()` verbatim: fold the query to lower
   case, split it on whitespace, and require EVERY word to appear in the item's
   match text; cap at 80; four chips; a "Popular starting points" panel when the
   field is empty. D-PP-j (owner, 2026-08-13) adds one thing to the match text — a
   focus area's own summary — so a partner can find a focus area by what it is
   about, not only by its title.

   Three departures from the prototype, each for a reason:

   1. A real <dialog>, so the browser owns the focus trap, Escape, the inert
      background and the top layer.

   2. The mockup builds its <mark> highlight by injecting an HTML string. Here
      it is built from React text nodes and <mark> elements — no
      dangerouslySetInnerHTML anywhere near a user-typed query.

   3. Results are <Link>s, not buttons. The mockup had no URLs to point at; this
      platform does, so a partner can middle-click a result, copy its address,
      and use the back button afterwards.

   The index arrives from a server action on FIRST OPEN and is kept for the rest
   of the session — see src/lib/workspace-v2/search.ts for why it is not shipped
   with every page. Until it lands the results area is deliberately EMPTY rather
   than showing "No results found.", because a blank panel is honest about
   knowing nothing yet and the empty state would be a claim. */

const COPY = {
  /* Every string here is the mockup's, verbatim. */
  dialogTitle: "Search all knowledge resources",
  inputLabel: "Search all resources",
  placeholder: "Search focus areas, guides and templates",
  close: "Close search",
  filtersLabel: "Search filters",
  helpLeft: "Search by focus area, file name, or task.",
  helpRight: "Shortcut: Ctrl / ⌘ + K",
  startHeading: "Popular starting points",
  emptyTitle: "No results found.",
  emptyBody: "Try a shorter word or a topic name.",
  focusAreaKind: "FOCUS AREA",
} as const;

const CHIPS = [
  { filter: "all", label: "All" },
  { filter: "topics", label: "Focus Areas" },
  { filter: "guides", label: "Guides" },
  { filter: "templates", label: "Templates" },
] as const;

/* The mockup's four shortcuts, by the section and topic TITLE it names. It
   resolves them with a bare .find() and would throw a TypeError if a title ever
   drifted; here an unresolved shortcut is simply left out. */
const SHORTCUTS = [
  { section: "Setup", title: "Launching a New House" },
  { section: "Operate", title: "Facility Operations" },
  { section: "Program", title: "Programming Model & Pillars" },
  { section: "Support", title: "Crisis Management" },
] as const;

type SearchContextValue = { openSearch: () => void };

const SearchContext = React.createContext<SearchContextValue | null>(null);

export function usePwSearch(): SearchContextValue {
  const ctx = React.useContext(SearchContext);
  if (!ctx) {
    throw new Error("usePwSearch must be used inside <PwSearchProvider>");
  }
  return ctx;
}

/* The mockup's highlight, as ELEMENTS rather than an HTML string — the mockup
   injects `<mark>` markup around the user's own query, which is not something
   to hand to dangerouslySetInnerHTML. The ranges come from search-match.ts. */
function Highlighted({ text, query }: { text: string; query: string }) {
  const ranges = highlightRanges(text, query);
  if (ranges.length === 0) return <>{text}</>;

  const parts: React.ReactNode[] = [];
  let from = 0;
  for (const { start, end } of ranges) {
    if (start > from) parts.push(text.slice(from, start));
    parts.push(<mark key={start}>{text.slice(start, end)}</mark>);
    from = end;
  }
  if (from < text.length) parts.push(text.slice(from));
  return <>{parts}</>;
}

function ResultRow({
  item,
  query,
  onNavigate,
}: {
  item: PwSearchItem;
  query: string;
  onNavigate: () => void;
}) {
  return (
    <Link className="pw-search-result" href={item.href} onClick={onNavigate}>
      <span className="pw-result-kind">
        {item.kind === "TOPIC" ? COPY.focusAreaKind : item.kind}
      </span>
      <span className="pw-result-copy">
        <span className="pw-result-title">
          <Highlighted text={item.title} query={query} />
        </span>
        <span className="pw-result-path">{item.path}</span>
      </span>
      <ArrowRight className="pw-icon" aria-hidden="true" />
    </Link>
  );
}

export function PwSearchProvider({ children }: { children: React.ReactNode }) {
  const dialogRef = React.useRef<HTMLDialogElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<PwSearchFilter>("all");
  const [index, setIndex] = React.useState<PwIndexedItem[] | null>(null);

  /* One in-flight fetch at most, ever: the promise itself is the cache, so two
     quick opens cannot start two requests. */
  const pending = React.useRef<Promise<void> | null>(null);

  const loadIndex = React.useCallback(() => {
    if (index || pending.current) return;
    pending.current = fetchSearchIndex()
      .then((items) => setIndex(indexForSearch(items)))
      .catch(() => {
        /* Fails closed and stays silent, like every other read in this layer:
           an empty index shows the honest "No results found." rather than an
           error the partner can do nothing about. */
        setIndex([]);
      });
  }, [index]);

  const openSearch = React.useCallback(() => {
    setQuery("");
    setFilter("all");
    setOpen(true);
    loadIndex();
  }, [loadIndex]);

  const closeSearch = React.useCallback(() => setOpen(false), []);

  /* showModal() is what buys the focus trap, the inert background, Escape and
     focus restored to whatever opened it; it can only be called on a mounted
     dialog, so it lives in an effect rather than in the click handler.

     One thing showModal() does NOT do is stop the page behind from scrolling —
     it is inert to clicks and to the keyboard, but a wheel or a trackpad still
     moves it. The lock is applied here rather than in CSS because the only CSS
     way to say it (`html:has(dialog[open])`) reaches outside `.pw-root`, and
     nothing in this layer is allowed to. The previous value is restored, so a
     page that had its own overflow set keeps it. */
  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      inputRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [open]);

  /* Escape and the backdrop both fire `close` on the dialog itself, so state
     follows the element rather than trying to predict it. */
  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onClose = () => setOpen(false);
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, []);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.key.toLowerCase() !== "k") return;
      event.preventDefault();
      openSearch();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [openSearch]);

  const results = React.useMemo(
    () => (index ? searchIndexed(index, query, filter) : []),
    [index, query, filter],
  );

  const shortcuts = React.useMemo(() => {
    if (!index) return [];
    return SHORTCUTS.map(({ section, title }) =>
      index.find(
        (entry) =>
          entry.item.kind === "TOPIC" &&
          entry.item.title === title &&
          entry.item.path.startsWith(`${section} `),
      )?.item,
    ).filter((item): item is PwSearchItem => Boolean(item));
  }, [index]);

  const value = React.useMemo(() => ({ openSearch }), [openSearch]);
  const searching = query.trim().length > 0;

  return (
    <SearchContext.Provider value={value}>
      {children}

      <dialog
        ref={dialogRef}
        className="pw-overlay"
        aria-labelledby="pw-search-title"
      >
        <div className="pw-modal">
          <h2 className="pw-sr-only" id="pw-search-title">
            {COPY.dialogTitle}
          </h2>

          <div className="pw-modal-head">
            <Search className="pw-icon" aria-hidden="true" />
            <label className="pw-sr-only" htmlFor="pw-global-search">
              {COPY.inputLabel}
            </label>
            <input
              ref={inputRef}
              id="pw-global-search"
              type="search"
              autoComplete="off"
              placeholder={COPY.placeholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button
              type="button"
              className="pw-modal-close"
              aria-label={COPY.close}
              onClick={closeSearch}
            >
              <X className="pw-icon" aria-hidden="true" />
            </button>
          </div>

          <div className="pw-search-tools">
            <div className="pw-filter-row" role="group" aria-label={COPY.filtersLabel}>
              {CHIPS.map((chip) => (
                <button
                  key={chip.filter}
                  type="button"
                  className={`pw-filter-chip${filter === chip.filter ? " is-active" : ""}`}
                  aria-pressed={filter === chip.filter}
                  onClick={() => setFilter(chip.filter)}
                >
                  {chip.label}
                </button>
              ))}
            </div>
            <div className="pw-search-help">
              <span>{COPY.helpLeft}</span>
              <span>{COPY.helpRight}</span>
            </div>
          </div>

          {/* aria-busy carries the loading state instead of a placeholder
              string: while the index is on its way there is nothing true to
              say, and a placeholder would be a claim.

              Deliberately NOT aria-live. A live region here would re-announce
              the whole result list on every keystroke, which is the classic way
              to make a search field unusable with a screen reader. The one
              state that must be spoken — nothing found — announces itself from
              the empty block below, which only exists when it is true. */}
          <div className="pw-search-results" aria-busy={index === null}>
            {index === null ? null : searching ? (
              results.length > 0 ? (
                results.map((item) => (
                  <ResultRow
                    key={`${item.kind}-${item.href}-${item.title}`}
                    item={item}
                    query={query}
                    onNavigate={closeSearch}
                  />
                ))
              ) : (
                <div className="pw-search-empty" role="status">
                  <strong>{COPY.emptyTitle}</strong>
                  <br />
                  {COPY.emptyBody}
                </div>
              )
            ) : (
              <div className="pw-search-start">
                <h3>{COPY.startHeading}</h3>
                <div className="pw-search-shortcuts">
                  {shortcuts.map((item) => (
                    <Link
                      key={item.href}
                      className="pw-search-shortcut"
                      href={item.href}
                      onClick={closeSearch}
                    >
                      <span className="pw-result-kind">
                        {COPY.focusAreaKind}
                      </span>
                      <span className="pw-result-copy">
                        <span className="pw-result-title">{item.title}</span>
                        <span className="pw-result-path">{item.path}</span>
                      </span>
                      <ArrowRight className="pw-icon" aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </dialog>
    </SearchContext.Provider>
  );
}
