# LOCKIN

**Build Discipline. One Day at a Time.**

A premium habit and discipline tracking dashboard. Works fully offline
(IndexedDB, no login needed), and can optionally sync across your devices
via a free Supabase project — install it on your iPhone like a native app.

## Local development

```bash
npm install
npm run dev       # start the dev server
npm run build     # type-check + production build → dist/
npm run test      # run the calculation-engine unit tests
npm run lint      # oxlin
```

On first launch LOCKIN seeds itself with ~120 days of realistic demo data
across 10 habits so the dashboard and analytics are meaningful immediately.
Reset or clear it any time from **Settings → Danger zone**.

---

## Deploying it for real (GitHub + Vercel)

### 1. Push to GitHub

```bash
cd lockin
git init
git add .
git commit -m "LOCKIN"
```

Create an empty repo on GitHub (github.com → **New repository**, don't
initialize it with a README), then:

```bash
git remote add origin https://github.com/<your-username>/lockin.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Vercel

Go to [vercel.com/new](https://vercel.com/new), sign in with your GitHub
account, and **import** the `lockin` repo. Vercel auto-detects Vite —
leave the defaults (`npm run build`, output directory `dist`) and click
**Deploy**. You'll get a live `https://lockin-yourname.vercel.app` URL in
about a minute.

That's it for a local-only deployment — every device that opens the URL
gets its own independent, private, offline copy. If you want the same
data on your phone and laptop, continue to step 3.

### 3. Turn on cross-device sync (optional, free)

This is what makes your check-ins follow you to your phone.

1. Go to [supabase.com](https://supabase.com), sign up, and create a new
   project (free tier is plenty for personal use).
2. Once it's provisioned, open **SQL Editor → New query**, paste in the
   entire contents of [`supabase/schema.sql`](./supabase/schema.sql) from
   this repo, and run it. This creates your `habits`, `entries`, and
   `settings` tables with row-level security, so only you can ever read
   or write your own rows.
3. Go to **Project Settings → API** and copy the **Project URL** and the
   **anon public** key.
4. In Supabase Dashboard → **Authentication → URL Configuration**, set:
   - **Site URL**: `http://localhost:5173/` (or your production Vercel URL)
   - **Redirect URLs**: Add `http://localhost:5173/` and your production URL (e.g. `https://lockin-yourname.vercel.app/`).
5. Back in Vercel: your project → **Settings → Environment Variables**,
   add:
   - `VITE_SUPABASE_URL` = the Project URL
   - `VITE_SUPABASE_ANON_KEY` = the anon public key
6. Redeploy (Vercel → **Deployments** → **⋯** → **Redeploy**, or just
   push a new commit).
7. Open the app, go to **Settings → Sync across devices**, and sign in
   with your email — you'll get a magic link, no password needed. Sign
   in with the same email on your phone and both devices stay in sync
   automatically (live, via Supabase Realtime).

For local development, copy `.env.example` to `.env.local` and fill in
the same two values so `npm run dev` also syncs.

**Note on how sync works:** IndexedDB stays the source of truth for
instant, offline-first reads/writes. When you're signed in, every change
also gets pushed to Supabase and broadcast to your other signed-in
devices in real time. If you ever edit the same habit on two offline
devices before either reconnects, the most recently edited version wins
once they're back online — there's no data loss, just a simple
last-write-wins resolution.

### 4. Install it on your iPhone

Once it's deployed:

1. Open the Vercel URL in **Safari** on your iPhone (must be Safari, not
   Chrome, for the install option to appear).
2. Tap the **Share** icon → **Add to Home Screen**.
3. Open it from the home screen — it launches full-screen, no browser
   chrome, with its own icon, and keeps working offline.

---

## What's here

- **Dashboard** — today's progress ring, a quick check-in list, the yearly
  habit matrix (sticky headers, keyboard-navigable, click or Space to
  toggle), weekly performance, top-habit ranking, a yearly consistency
  chart, a GitHub-style heatmap, and computed discipline insights.
- **Habits** — add / edit / archive / delete, drag-to-reorder, press `N`
  for a new habit.
- **Analytics** — overall consistency, best/weakest habits, completion by
  day of week, streak stats.
- **Calendar** — browse any month, click a day to see exactly what got
  done.
- **Goals** — progress toward each habit's target.
- **Settings** — sync, theme (dark/light/system), start of week, animation
  preferences, JSON export/import, demo reset, and full data clear.

## Architecture

```
src/
  components/     shared UI primitives + app layout/nav
  features/       feature-scoped components (dashboard, habits, settings)
  lib/
    calculations/ pure, unit-tested functions: streaks, completion
                  rates, rankings, weekly/monthly/yearly stats
    date/         all date-fns wrapping; ISO-string normalization so
                  DST/timezone shifts never change which day a
                  check-in belongs to
    storage/      StorageAdapter — the only thing that talks to
                  IndexedDB (habits/entries) and localStorage (settings)
    sync/         optional Supabase client, auth, and the pull/push/
                  merge/realtime sync engine — entirely inert if
                  VITE_SUPABASE_URL isn't set
    demo/         seeded, deterministic demo-data generator
  store/          Zustand store; the only piece of global state
  pages/          route-level composition
supabase/
  schema.sql      run once in the Supabase SQL editor to set up sync
```

Habit definitions and daily entries are stored separately and the yearly
matrix is generated dynamically from the two — nothing is duplicated or
denormalized on disk.

## Stack

React 19 · TypeScript (strict) · Vite · Tailwind CSS v4 · Zustand ·
Framer Motion · Recharts · date-fns · dnd-kit · idb · Supabase (optional
sync) · vite-plugin-pwa
