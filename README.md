# GroupThat Leadership Dashboard

A static dashboard showing new users, new groups, and new meetups over time,
toggleable between 1D / 7D / 30D / 3M / 1Y / All. Hosted on GitHub Pages;
data is refreshed daily by a scheduled GitHub Action that reads from the
GroupThat MongoDB and commits an aggregated JSON snapshot.

Tracking starts from the day this was first deployed — there is no
historical backfill.

## How it works

- `scripts/fetch-stats.mjs` connects to MongoDB with a **read-only** user,
  aggregates daily counts from the `users`, `groups`, and `meetups`
  collections (by `createdAt`), and writes `docs/data/stats.json`.
- `.github/workflows/update-stats.yml` runs that script once a day (and via
  manual "Run workflow"), then commits the updated JSON.
- `docs/` is the static site GitHub Pages serves — plain HTML/CSS/JS, no
  build step, no client-side database access of any kind.

## One-time setup

1. **Create a read-only MongoDB user** scoped to the GroupThat database.
   In Atlas: Database Access → Add New Database User → built-in role
   `Read Only` (`read`) on this database only. Never reuse the app's
   read-write user here.
2. **Add the connection string as a GitHub secret**: repo Settings →
   Secrets and variables → Actions → New repository secret →
   name it `MONGO_URI`, value is the read-only user's connection string
   (include the database name, e.g. `.../groupthat?...`).
3. **Enable GitHub Pages**: repo Settings → Pages → Source: "Deploy from a
   branch" → Branch: `main`, folder: `/docs`.
4. **Run the workflow once manually** (Actions tab → "Update dashboard
   stats" → Run workflow) so `docs/data/stats.json` has real data before
   waiting for the next scheduled run.

## Changing the password

The gate in `docs/app.js` checks a SHA-256 hash, not a plaintext password —
it's a casual deterrent for a public GitHub Pages URL, not real access
control (the data file itself is fetchable by anyone with the link).
To change it, compute a new hash and replace `PASSWORD_HASH` in
`docs/app.js`:

```js
crypto.subtle.digest("SHA-256", new TextEncoder().encode("your-new-password"))
  .then(b => console.log([...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("")))
```

Run that in any browser console, paste the result in as `PASSWORD_HASH`.

## Branding

Logo and favicon in `docs/assets/` were copied from the GT_2 mobile app's
GroupThat brand assets. Chart colors live as CSS custom properties at the
top of `docs/style.css` (`--series-users`, `--series-groups`,
`--series-meetups`, plus `--brand-dark` / `--brand-gray`) — swap those
and the header/gate markup in `docs/index.html` to adjust branding further.

## Local development

```
cd docs && python -m http.server 8080
```

Then open `http://localhost:8080`. `docs/data/stats.json` is served as-is,
so you can drop in sample data locally to preview without touching Mongo.
