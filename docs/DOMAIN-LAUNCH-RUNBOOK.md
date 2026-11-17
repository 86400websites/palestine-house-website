# Domain launch runbook: switching the live site to www.palestine-house.com

> **Every step here is run by the owner, in a dashboard.** This engine changes nothing in
> production through any channel: it cannot reach Vercel, GitHub settings, Google or the
> Supabase dashboard, and its Supabase access to production is read-only. After each step
> the owner says "done", and Claude runs the check written under it, read-only, and says
> PASS or what to fix. **One step at a time; do not start the next until the check passes.**
>
> Written in sprint **L1** (2026-11-17). The site has served on
> `https://palestine-house-website.vercel.app` since 2026-06-19. `palestine-house.com` was
> connected to the Vercel project on 2026-06-30, with the apex redirecting to `www`, and it
> already serves the site, but every canonical tag, the sitemap and every email link still
> name the Vercel address. This runbook moves all of that to `https://www.palestine-house.com`.
> No code change is needed for the switch itself: the code side was done on 2026-06-30
> (`src/lib/safe-redirect.ts` allow-lists both hosts) and in L1.

---

## What changes, and what does not

| | Before | After |
|---|---|---|
| Address people use | either | either; `palestine-house.com` keeps redirecting to `www` |
| What search engines are told is the real address (canonical, `og:url`, sitemap, robots, structured data) | the Vercel address | `https://www.palestine-house.com` |
| Links inside emails the site sends | the Vercel address | `www` |
| Password-reset links | follow the address the person was on; `www` is not yet allowed | allowed on `www`, the apex and the Vercel address |
| The Vercel address | serves the site | **still serves the site** (a grace period), with its canonical tags pointing at `www` |
| The daily morning check | watches the Vercel address | watches `www` |

Nothing about the approval gate, the database, the content or the design changes.

---

## Before you start

**P1. Merge the L1 pull request**, once its checks are green and you have signed the GO on
`docs/test-reports/2026-11-17-test-report.md`. Then wait until Vercel shows the merge's
Production deployment as **Ready** (Vercel → the project → **Deployments**, the top row
says **Production** and **Ready**).

**P2. Recommended, two minutes: lock the merge button behind CI** (`PROJECT-STATUS.md` §7 #17).
GitHub → the repository → **Settings** → **Branches** → the rule for `main` → **Edit** →
"Require status checks to pass before merging" is already ticked with an empty list → in its
search box type `Install` and **pick** `Install · Typecheck · Lint · Build` from the list (do
not type the whole name: a mistyped name locks every merge, yours included) → leave "Require
branches to be up to date" **off** → **Save changes**.

**P3. Have these open:** the Vercel project, the Supabase dashboard on the **production**
project, GitHub, and your email inbox for `info@`.

**Claude checks, before any setting changes** (proves `www` already serves the merged code
and that nothing has switched yet):

```bash
pnpm exec tsx scripts/verify-domain-launch.ts --canonical https://palestine-house-website.vercel.app
```

Expected: `ALL CHECKS PASSED`, including "apex redirects permanently to www" and "Search
Console verification file served exactly".

---

## The steps

### 1. Confirm the domains in Vercel (look only)

Vercel → the project → **Settings** → **Domains**. You should see:

- `www.palestine-house.com`: **Valid Configuration**, connected to **Production**.
- `palestine-house.com`: **Valid Configuration**, **redirects to** `www.palestine-house.com`
  (308).
- `palestine-house-website.vercel.app`: still listed. **Leave it.**

Change nothing. If either custom domain shows an error, stop and send a screenshot.

**Claude checks:** the apex redirect and the security headers on `www` (the same command as
P3 covers both).

### 2. Allow the new address in Supabase Auth (production project)

This comes before the address switch so that a password reset requested on `www` already
works when people start arriving there.

Supabase → the **production** project → **Authentication** → **URL Configuration**.

1. **First, write down or screenshot what is there now**: the **Site URL** and every entry
   under **Redirect URLs**. That is your undo.
2. **Site URL**: change it to `https://www.palestine-house.com` → **Save**.
3. **Redirect URLs** → **Add URL** → `https://www.palestine-house.com/**` → save. Then **Add
   URL** → `https://palestine-house.com/**` → save.
4. **Do not remove** the Vercel address or any other existing entry: reset links already
   sitting in people's inboxes point there and must keep working.

**Claude checks:** this setting cannot be read from here. Step 7(b) proves it, with a real
reset on `www`.

**Undo:** put the Site URL back to what you wrote down. The two added entries are harmless
and can stay.

### 3. Point the site's address at www (Vercel, Production only)

Vercel → the project → **Settings** → **Environment Variables** → find
`NEXT_PUBLIC_SITE_URL` → the **⋯** menu → **Edit**.

- Value: `https://www.palestine-house.com` (no slash at the end).
- Environments: **Production** only. Leave Preview and Development as they are.
- **Save**.

Nothing changes on the live site yet: this value is built into the pages, so it needs step 4.

**Undo:** edit it back to `https://palestine-house-website.vercel.app`, then step 4 again.

### 4. Redeploy Production, without the build cache

Vercel → the project → **Deployments** → the top **Production** deployment → **⋯** →
**Redeploy** → **untick "Use existing Build Cache"** → **Redeploy**. Wait for **Ready**
(a few minutes).

**Claude checks:**

```bash
pnpm exec tsx scripts/verify-domain-launch.ts
pnpm exec tsx scripts/verify-domain-launch.ts --base https://palestine-house-website.vercel.app
```

The first proves `www` now describes itself as `www` everywhere: every public page's
canonical and `og:url`, the sitemap, robots.txt, the structured data, the share image, the
noindex on private pages, and the Search Console file. The second proves the old address
now points search engines at `www`. Both must say `ALL CHECKS PASSED`.

**Undo:** Vercel → **Deployments** → the previous Production deployment → **⋯** →
**Promote to Production** (instant), then set the variable back as in step 3.

### 5. Point the morning check at www (GitHub)

GitHub → the repository → **Settings** → **Secrets and variables** → **Actions** → the
**Variables** tab → `PRODUCTION_URL` → the pencil → value `https://www.palestine-house.com`
→ **Update variable**.

Then prove it, and prove its alarm (`PROJECT-STATUS.md` §7 #10):

1. Your avatar (top right) → **Settings** → **Notifications** → under **Actions**, choose
   **Only notify for failed workflows**, with email on.
2. The repository → **Actions** → **Morning Check** → **Run workflow** → **Run workflow**.
   It should turn green in a few minutes.

**Claude checks:** reads the run's result with you. Green = the daily check now watches
`www`.

**Undo:** set the variable back to the Vercel address.

### 6. Register the site with Google Search Console

1. Open [Google Search Console](https://search.google.com/search-console), signed in with the
   Google account you want to own it.
2. **Add property** → choose **URL prefix** (not Domain) → enter
   `https://www.palestine-house.com/` → **Continue**.
3. Choose **HTML file**. The file it names must be `google777f049a86d5990c.html`; that file
   is already live at `https://www.palestine-house.com/google777f049a86d5990c.html`.
   Click **Verify**.
   - If it names a **different** file (a different Google account produces a different
     file), stop: download that file and send it over, and it will be added the same way.
4. Left menu → **Sitemaps** → "Add a new sitemap" → type `sitemap.xml` → **Submit**. Status
   should read **Success** (it can say "Couldn't fetch" for a few minutes at first; refresh).
5. Optional: left menu → **URL inspection** → paste `https://www.palestine-house.com/` →
   **Request indexing**.

**Keep the file forever.** Google checks it again from time to time; deleting
`public/google777f049a86d5990c.html` would un-verify the property.

**Claude checks:** the file is still served exactly (the step 4 command covers it).

### 7. The real-person check on www (MN-002), desktop and phone

Done by you, as a real visitor, on `https://www.palestine-house.com`. Each one proves
something no robot can.

- **(a) A real message arrives.** `/contact` → send one short real message from your own
  email address. It should reach the `info@` inbox within a few minutes, **not in spam**.
- **(b) A real password reset works on www.** Sign out. `/forgot-password` → your own
  account's email → open the email → the link must open on
  **`www.palestine-house.com`** (check the address bar) → set a new password → "Done. You
  can sign in now." → sign in with it. This proves step 2, and it also closes the last
  unproven step of MN-003 (`PROJECT-STATUS.md` §7 #7).
- **(c) Admin.** Signed in as an admin: `/admin/approvals` opens.
- **(d) A video plays on the site.** Open any focus area → **Watch Video** → it plays in a
  player on the page → close it. On the phone too.
- **(e) Optional: a share preview.** Paste `https://www.palestine-house.com` into a new
  WhatsApp or LinkedIn message (do not send it): the preview shows the Palestine House
  image and title.

**Claude records** each result, ticks `LAUNCH-CHECKLIST.md` Phase 2 and 3 with the date,
moves the Production URL in `PROJECT-STATUS.md` §1 to `www`, and opens a small docs pull
request with the record.

---

## If something goes wrong

| What you see | What to do |
|---|---|
| A check fails after step 4 | Send Claude the output. Nothing is lost: the Vercel address keeps working throughout. |
| The site itself is broken after step 4 | Vercel → **Deployments** → the previous Production deployment → **⋯** → **Promote to Production**. Then [`ROLLBACK.md`](./ROLLBACK.md). |
| Reset emails open the wrong address, or fail | Check step 2's entries, character for character, then repeat 7(b). |
| Search Console will not verify | Open `https://www.palestine-house.com/google777f049a86d5990c.html` yourself: it must show one line beginning `google-site-verification:`. Then compare the file name with the one Search Console asks for. |

**Do not**, during the launch: remove the Vercel address from Supabase's redirect list,
delete the verification file, or redirect the Vercel address to `www`. Redirecting the
Vercel address is a sensible later step, once the grace period has passed and Search
Console shows `www` indexed; it is a separate decision.

---

## After the launch (not part of it)

- **SYS1.5** is the next sprint (**D-L1-a**): rate limiting and a bot check on Apply and
  Contact. It needs a free Upstash account and a free Cloudflare Turnstile widget.
- Worth doing once, by hand: run [PageSpeed Insights](https://pagespeed.web.dev/) on the
  home page and one deep page, and send Claude the scores for the record
  (`LAUNCH-CHECKLIST.md`, performance budget).
- At GoDaddy, make sure `palestine-house.com` is on **auto-renew**: a lapsed domain is the
  most common way a site like this goes dark (`LAUNCH-CHECKLIST.md`, monitoring).
