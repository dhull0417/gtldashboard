# GroupThat Leadership Dashboard

A React (Vite) dashboard showing new users, new groups, and new meetups over
time, toggleable between 1D / 7D / 30D / 3M / 1Y / All. Hosted on GitHub
Pages via a GitHub Actions build; data is refreshed several times a day by a
scheduled GitHub Action that reads from the GroupThat MongoDB and commits an
aggregated JSON snapshot.

Tracking starts from the day this was first deployed — there is no
historical backfill.

## How it works

- `scripts/fetch-stats.mjs` connects to MongoDB with a **read-only** user,
  aggregates daily counts from the `users`, `groups`, and `meetups`
  collections (by `createdAt`), and writes `public/data/stats.json`.
- `.github/workflows/update-stats.yml` runs that script five times a day
  (and via manual "Run workflow"), then commits the updated JSON.
- `src/` is the React app (built with Vite); `public/` holds static assets
  (logo, favicon, `data/stats.json`) that are copied into the build as-is.
- `.github/workflows/deploy-pages.yml` builds the app with `npm run build`
  and publishes the `dist/` output to GitHub Pages on every push to `main`
  that touches app source or data. Nothing needs to be committed to a
  `docs/` folder — the workflow builds fresh each run.

## One-time setup

1. **Create a read-only MongoDB user** scoped to the GroupThat database.
   In Atlas: Database Access → Add New Database User → built-in role
   `Read Only` (`read`) on this database only. Never reuse the app's
   read-write user here.
2. **Add the connection string as a GitHub secret**: repo Settings →
   Secrets and variables → Actions → New repository secret →
   name it `MONGO_URI`, value is the read-only user's connection string
   (include the database name, e.g. `.../groupthat?...`).
3. **Enable GitHub Pages**: repo Settings → Pages → Source: "GitHub
   Actions".
4. **Run the workflow once manually** (Actions tab → "Update dashboard
   stats" → Run workflow) so `public/data/stats.json` has real data before
   waiting for the next scheduled run.

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

Then open the printed local URL. `public/data/stats.json` is served as-is,
so you can drop in sample data locally to preview without touching Mongo.

To sanity-check the production build: `npm run build && npm run preview`.
