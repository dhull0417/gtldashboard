# GroupThat Leadership Dashboard

A React (Vite) dashboard with two tabs:

- **Dashboard** — new users, new groups, and new meetups over time,
  toggleable between 1D / 7D / 30D / 3M / 1Y / All, plus current-state rows
  for permissions, soft indicators, sign-in method, and user habits.
- **Searchable Data** — a directory for leadership to look up individual
  users (search by name/email/phone; see when they joined and which groups
  they created or belong to) and to browse groups (sortable by name,
  members, or schedule; see owner, moderators, members, schedule, and last
  chat activity).

Hosted on GitHub Pages via a GitHub Actions build; data is refreshed several
times a day by a scheduled GitHub Action that reads from the GroupThat
MongoDB and Clerk, and commits aggregated JSON snapshots.

Tracking starts from the day this was first deployed — there is no
historical backfill.

## How it works

- `scripts/fetch-stats.mjs` connects to MongoDB with a **read-only** user
  and to Clerk with a secret key, then writes two files:
  - `public/data/stats.json` — daily counts from the `users`, `groups`, and
    `meetups` collections (by `createdAt`), one entry per day since first
    deploy. Powers the three trend charts.
  - `public/data/insights.json` — a current-state snapshot (not a time
    series): sign-in method breakdown from Clerk, and permissions /
    soft-indicator / user-habit aggregates from Mongo. Overwritten each run,
    not accumulated.
  - `public/data/directory.json` — the searchable directory: every user
    (name, email, phone from Clerk, join date, groups created/joined) and
    every non-DM group (name, owner, moderators, members, schedule,
    createdAt, last chat message time). Powers the Searchable Data tab.
    Overwritten each run, not accumulated.
- `.github/workflows/update-stats.yml` runs that script five times a day
  (and via manual "Run workflow"), then commits all three updated JSON
  files.
- `src/` is the React app (built with Vite); `public/` holds static assets
  (logo, favicon, `data/stats.json`, `data/insights.json`) that are copied
  into the build as-is.
- `.github/workflows/deploy-pages.yml` builds the app with `npm run build`
  and publishes the `dist/` output to GitHub Pages on every push to `main`
  that touches app source or data. Nothing needs to be committed to a
  `docs/` folder — the workflow builds fresh each run.

Permissions row note: only "Notifications" is populated today (via presence
of a stored `expoPushToken`). Location and photo-library access aren't
written to the `users` collection anywhere yet — the app itself needs to
report OS permission status to the backend before those can show real
numbers here.

## One-time setup

1. **Create a read-only MongoDB user** scoped to the GroupThat database.
   In Atlas: Database Access → Add New Database User → built-in role
   `Read Only` (`read`) on this database only. Never reuse the app's
   read-write user here.
2. **Add the connection string as a GitHub secret**: repo Settings →
   Secrets and variables → Actions → New repository secret →
   name it `MONGO_URI`, value is the read-only user's connection string
   (include the database name, e.g. `.../groupthat?...`).
3. **Add a Clerk secret key as a GitHub secret** the same way: name it
   `CLERK_SECRET_KEY`, value from the Clerk dashboard (API Keys → Secret
   keys). Only the secret key is needed — this script never runs in a
   browser, so the publishable key isn't used.
4. **Enable GitHub Pages**: repo Settings → Pages → Source: "GitHub
   Actions".
5. **Run the workflow once manually** (Actions tab → "Update dashboard
   stats" → Run workflow) so `public/data/stats.json` and
   `public/data/insights.json` have real data before waiting for the next
   scheduled run.

## Changing the password

The gate in `src/components/PasswordGate.jsx` checks a SHA-256 hash, not a
plaintext password — it's a casual deterrent for a public GitHub Pages URL,
not real access control (the data file itself is fetchable by anyone with
the link). To change it, compute a new hash and replace `PASSWORD_HASH` in
that file:

```js
crypto.subtle.digest("SHA-256", new TextEncoder().encode("your-new-password"))
  .then(b => console.log([...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("")))
```

Run that in any browser console, paste the result in as `PASSWORD_HASH`.

## Branding

Logo and favicon in `public/assets/` were copied from the GT_2 mobile app's
GroupThat brand assets. Chart colors live as CSS custom properties at the
top of `src/style.css` (`--series-users`, `--series-groups`,
`--series-meetups`, plus `--brand-dark` / `--brand-gray`) — swap those
and the header/gate markup in `src/components/` to adjust branding further.

## Local development

```
npm install
npm run dev
```

Then open the printed local URL. `public/data/stats.json` and
`public/data/insights.json` are served as-is, so you can drop in sample data
locally to preview without touching Mongo or Clerk.

To sanity-check the production build: `npm run build && npm run preview`.

### Running the fetch script locally

`scripts/.env` (gitignored) holds `MONGO_URI` and `CLERK_SECRET_KEY` for
local runs — copy `scripts/.env.example` and fill in real values yourself
(don't paste secrets into chat/AI tools). Then, from `scripts/`:

```
npm install
npm run fetch-stats
```

This overwrites `public/data/stats.json` and `public/data/insights.json`
with live data, same as the scheduled GitHub Action.
