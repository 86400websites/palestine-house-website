# Domain launch runbook: www.palestine-house.com

> **Every step here is run by the owner, in a dashboard.** This engine changes nothing in
> production through any channel: it cannot reach Vercel, GitHub settings, Google or the
> Supabase dashboard, and its Supabase access to production is read-only. After each step
> the owner says "done", and Claude runs the check written under it, read-only, and says
> PASS or what to fix. **One step at a time; do not start the next until its check passes.**
>
> Written in sprint **L1** (2026-11-17) and corrected the same day by its own launch audit.

---

## Where things actually stand (read live, 2026-11-17)

`palestine-house.com` was connected to the Vercel project on 2026-06-30, with the apex
redirecting to `www`. **Production already describes itself as `www`:** read-only requests
to the live site show every canonical tag, the sitemap, `robots.txt` and the structured data
naming `https://www.palestine-house.com`, on both addresses. So `NEXT_PUBLIC_SITE_URL` in
Vercel Production is already `https://www.palestine-house.com`. It was switched at a date
nobody recorded, and the repo's trackers said otherwise until L1. Emails the site sends
already link to `www` too.

**So no redeploy and no Vercel change is needed.** What is left for the launch:

| | Status before L1 merges | Done by |
|---|---|---|
| Canonical, sitemap, robots, structured data, email links on `www` | ✅ already live | (already done) |
| `og:url` on every page, the Search Console file, the in-site video player, the Reduce Motion fix | ⛔ not yet live | **the L1 merge** (P1) |
| Password resets allowed on `www` | ❓ cannot be read from here | **step 2** |
| The daily morning check watching `www` | ⛔ it watches the Vercel address | **step 3** |
| Search Console property, sitemap submitted | ⛔ none | **step 4** |
| One real visitor's walk on `www` | ⛔ never recorded | **step 5** |

The Vercel address keeps serving the site throughout, with its canonical tags pointing at
`www`. Nothing about the approval gate, the database, the content or the design changes.

---

## Before you start

**P1. Merge the L1 pull request**, once its checks are green and you have signed the GO on
`docs/test-reports/2026-11-17-test-report.md`. Then wait until Vercel shows the merge's
Production deployment as **Ready** (Vercel → the project → **Deployments**: the top row says
**Production** and **Ready**).

**P2. Recommended, two minutes: lock the merge button behind CI** (`PROJECT-STATUS.md` §7 #17).
GitHub → the repository → **Settings** → **Branches** → the rule for `main` → **Edit** →
"Require status checks to pass before merging" is already ticked with an empty list → in its
search box type `Install` and **pick** `Install · Typecheck · Lint · Build` from the list (do
not type the whole name: a mistyped name locks every merge, yours included) → leave "Require
branches to be up to date" **off** → **Save changes**.

**P3. Have open:** the Supabase dashboard on the **production** project, GitHub, Google
Search Console, and your email inbox for `info@`.

**Claude checks, once P1 is Ready:**

```bash
pnpm exec tsx scripts/verify-domain-launch.ts
pnpm exec tsx scripts/verify-domain-launch.ts --base https://palestine-house-website.vercel.app
```

Expected: `ALL CHECKS PASSED` on both, with one `NOTE` line for `/apply` (its canonical is
streamed into the page body, a known issue fixed in SYS1.5, `PROJECT-STATUS.md` §7 #19). The
first proves `www` describes itself as `www` everywhere: canonical and `og:url` on every
public page, the sitemap, robots, the structured data, the share image, noindex on private
pages, the apex redirect, the six security headers, and the Search Console file. The second
proves the old address points search engines at `www`.

---

## The steps

### 1. Look, change nothing: Vercel domains and the site address

Vercel → the project → **Settings** → **Domains**. You should see:

- `www.palestine-house.com`: **Valid Configuration**, connected to **Production**.
- `palestine-house.com`: **Valid Configuration**, **redirects to** `www.palestine-house.com`.
- `palestine-house-website.vercel.app`: still listed. **Leave it.**

Then **Settings** → **Environment Variables** → `NEXT_PUBLIC_SITE_URL`: its **Production**
value should read exactly `https://www.palestine-house.com` (no slash at the end).
**Change nothing.** If anything differs, stop and send a screenshot.

### 2. Allow password resets on www (Supabase, production project), and prove it

A password reset follows the address the person was on. Today the site sends people to
`www`, so Supabase must allow `www`, or a reset requested there falls back to the Site URL
and lands on a home page with a code nothing uses. Nobody can read this setting from here,
so check it by eye and prove it with a real reset.

Supabase → the **production** project → **Authentication** → **URL Configuration**.

1. **First, screenshot what is there now**: the **Site URL** and every entry under
   **Redirect URLs**. That is your undo.
2. **Redirect URLs**: each of these must be its own line. **Add URL** for any that is missing:
   - `https://www.palestine-house.com/**`
   - `https://palestine-house.com/**`
   - `https://palestine-house-website.vercel.app/**` (keep it: reset links already sitting
     in people's inboxes point there)
3. **Site URL**: if it is not already `https://www.palestine-house.com`, change it to that.
4. **Save**. Remove nothing.

**Prove it now (MN-003's last step, `PROJECT-STATUS.md` §7 #7):** sign out, then on
`https://www.palestine-house.com/forgot-password` request a reset for your own account.
Open the email **in the same browser** you requested it from (with Supabase's default email
template, the link carries a one-time code that only that browser can finish), check the
address bar shows
**`www.palestine-house.com`**, set a new password, see "Done. You can sign in now.", and
sign in with it. Then repeat once on `https://palestine-house-website.vercel.app/forgot-password`:
that link must come back to the Vercel address and work the same.

**Undo:** put back what the screenshot shows. Extra redirect entries are harmless.

### 3. Point the morning check at www (GitHub), and prove its alarm

GitHub → the repository → **Settings** → **Secrets and variables** → **Actions** → the
**Variables** tab → `PRODUCTION_URL` → the pencil → value `https://www.palestine-house.com`
(not the apex) → **Update variable**.

Then, so a failure would actually reach you (`PROJECT-STATUS.md` §7 #10):

1. Your avatar (top right) → **Settings** → **Notifications** → under **Actions**, choose
   **Only notify for failed workflows**, with email on.
2. The repository → **Actions** → **Morning Check** → **Run workflow** → **Run workflow**.
   It should turn green in a few minutes.

**Claude checks:** reads that run's log with you; it names the address it ran against, which
must be `https://www.palestine-house.com`.

**Undo:** set the variable back to `https://palestine-house-website.vercel.app`.

### 4. Register the site with Google Search Console

1. Open [Google Search Console](https://search.google.com/search-console), signed in with the
   Google account that should own it.
2. **Add property** → **URL prefix** (not Domain) → `https://www.palestine-house.com/` →
   **Continue**.
3. Choose **HTML file**. The file it names must be `google777f049a86d5990c.html`, which is
   already live at `https://www.palestine-house.com/google777f049a86d5990c.html` → **Verify**.
   - If it names a **different** file (a different Google account gets a different file),
     stop, download that file and send it over; it goes live the same way, with a merge.
4. Left menu → **Sitemaps** → "Add a new sitemap" → `sitemap.xml` → **Submit**. It may say
   "Couldn't fetch" for a few minutes at first; refresh until it says **Success**.
5. Optional: **URL inspection** → `https://www.palestine-house.com/` → **Request indexing**.

**Keep the file forever.** Google checks it again from time to time; deleting
`public/google777f049a86d5990c.html` would un-verify the property.

**Claude checks:** the file is still served exactly (the P3 command covers it).

### 5. The real-visitor walk on www (MN-002), desktop and phone

On `https://www.palestine-house.com`, as an ordinary visitor:

- **(a) A real message arrives.** `/contact` → one short real message from your own email
  address. It should reach the `info@` inbox within a few minutes, **not in spam**.
- **(b) Admin.** Signed in as an admin: `/admin/approvals` opens.
- **(c) A video plays on the site.** Any focus area → **Watch Video** → it plays in a player
  on the page → close it. On the phone too.
- **(d) Reduce Motion.** On the phone, turn on Reduce Motion (iPhone: Settings →
  Accessibility → Motion; Android: Settings → Accessibility → Remove animations), open
  `https://www.palestine-house.com/apply`, and check the heading and the whole form are
  showing. Turn it back off afterwards.
- **(e) Optional, a share preview.** Paste `https://www.palestine-house.com` into a new
  WhatsApp or LinkedIn message (do not send it): the preview shows the Palestine House image
  and title.

**Claude records** each result, ticks `LAUNCH-CHECKLIST.md` Phase 2 and 3 with the date, sets
the Production URL in `PROJECT-STATUS.md` §1, and opens a small docs pull request.

---

## If something goes wrong

| What you see | What to do |
|---|---|
| A P3 check fails | Send Claude the output. Nothing is lost: both addresses keep working. |
| The site itself is broken after the merge | Vercel → **Deployments** → the previous Production deployment → **⋯** → **Promote to Production** (instant). Then [`ROLLBACK.md`](./ROLLBACK.md). |
| A P3 check says the canonical is the Vercel address | Someone changed `NEXT_PUBLIC_SITE_URL` back. Set it to `https://www.palestine-house.com` (Production only), then **Deployments** → the top Production deployment → **⋯** → **Redeploy** with "Use existing Build Cache" **unticked**. |
| Reset emails open the wrong address, or fail | Compare step 2's entries character for character, and open the email in the same browser that asked for it. |
| Search Console will not verify | Open `https://www.palestine-house.com/google777f049a86d5990c.html` yourself: it must show one line beginning `google-site-verification:`. Then compare the file name with the one Search Console asks for. |

**Do not**, during the launch: remove the Vercel address from Supabase's redirect list,
delete the verification file, or redirect the Vercel address to `www`. That redirect is a
sensible later step, once Search Console shows `www` indexed; it is tracked in
[`POST-LAUNCH-BACKLOG.md`](./POST-LAUNCH-BACKLOG.md) as its own decision.

---

## After the launch (not part of it)

- **SYS1.5** is the next sprint (**D-L1-a**): rate limiting and a bot check on Apply and
  Contact. It needs a free Upstash account and a free Cloudflare Turnstile widget. It also
  carries the `/apply` metadata fix (§7 #19), since both edit `next.config.ts`.
- Worth doing once, by hand: run [PageSpeed Insights](https://pagespeed.web.dev/) on the home
  page and one deep page, and send Claude the scores for the record (`LAUNCH-CHECKLIST.md`,
  performance budget).
- At GoDaddy, make sure `palestine-house.com` is on **auto-renew**: a lapsed domain is the
  most common way a site like this goes dark (`LAUNCH-CHECKLIST.md`, monitoring).
