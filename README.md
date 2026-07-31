# Dodoso la Washiriki — Nanenane / 51st DITF

A mobile-first, bilingual (Swahili / English) survey for TANTRADE to collect
data from Nanenane / 51st DITF exhibition participants, built from
`DODOSO_LA_UKUSANYAJI_WA_TAARIFA_KWA_WASHIRIKI_WA_MAONESHO_YA_NANENANE.doc`.

- `index.html` — the public survey (multi-step, green/blue/gold theme)
- `admin.html` + `admin.js` — password-gated dashboard to view & export responses
- `styles.css` — shared theme
- `script.js` — survey step logic, validation, submission
- `netlify/functions/submissions.js` — serverless function the admin page calls
- `netlify.toml` — Netlify build config

No build step, no framework, no database — plain HTML/CSS/JS.

## 1. How responses are collected

The survey form is wired for **Netlify Forms** (`data-netlify="true"` on the
`<form>`). When you deploy to Netlify, it automatically detects the form and
stores every submission for you — no backend to run yourself.

The admin dashboard (`admin.html`) reads those submissions back through a
small serverless function (`netlify/functions/submissions.js`) using the
Netlify API, so you can view and export them without logging into the
Netlify UI each time.

**This means the "collect responses" part is Netlify-specific.** If you
later move hosting to Vercel, GitHub Pages, etc., the survey page itself
will still work, but you'd need a different backend for storage (e.g.
Formspree, a Google Sheets webhook, or your own API) and would need to
rewire the `<form>` and `admin.js` accordingly.

## 2. Deploy to Netlify

1. Push this folder to a GitHub/GitLab repo, or drag-and-drop the folder
   straight onto [app.netlify.com/drop](https://app.netlify.com/drop).
2. Netlify will build the site and, on first deploy, detect the
   `nanenane-survey` form automatically (Site → Forms tab).
3. Submit the survey once yourself as a test — you should see it appear
   under **Site → Forms → nanenane-survey**.

## 3. Enable the admin dashboard

The admin page needs two environment variables so it can call the Netlify
API on your behalf:

1. **Get a Personal Access Token**: Netlify → User settings (top-right
   avatar) → **Applications** → **New access token**. Copy it — you won't
   see it again.
2. **Get your Site ID**: open the site in Netlify → **Site settings** →
   **General** → **Site details** → copy the **Site ID**.
3. In the same site: **Site settings** → **Environment variables** → **Add
   a variable**, and add:
   - `NETLIFY_API_TOKEN` = the token from step 1
   - `NETLIFY_SITE_ID` = the ID from step 2
4. Trigger a redeploy (Deploys → Trigger deploy) so the function picks up
   the new variables.
5. Visit `yoursite.netlify.app/admin.html`, enter the password **`1234`**,
   and responses should load.

If the dashboard shows a setup notice instead of a table, it walks through
the same checklist above.

## 4. About the admin password

The `1234` password is checked entirely in the browser (`admin.js`) — it
keeps casual visitors out of the link, but it is **not real security**:
anyone who reads the JavaScript can see the password, and the page doesn't
use any server-side auth. Also, since no `localStorage`/`sessionStorage` is
used, refreshing `admin.html` logs you out again — that's intentional, to
avoid storing anything in the browser.

If the survey data is sensitive, consider one of these instead, in order of
effort:
- **Change the password** in `admin.js` (`ADMIN_PASSWORD`) to something less
  guessable, and don't commit that value to a public repo.
- Turn on **Netlify Identity** or **password-protect the site** (Site
  settings → visitor access) for a real login.
- Restrict the `/.netlify/functions/submissions` function with a proper
  auth check (e.g. a Netlify Identity JWT) instead of relying on the
  client-side password alone.

## 5. Editing the survey questions

All 25 questions live directly in `index.html` as one long `<form>`, split
into visual "steps" with `class="step" data-step="N"`. Netlify scans the
**static HTML** at deploy time to find field names — so if you add a new
question, add real `<input>`/`<label>` markup for it (don't generate it with
JavaScript only), otherwise Netlify won't capture it.

Each question label/option has two `<span>`s — `lang-sw` and `lang-en` — the
language switcher just shows/hides the matching one. Add a third language by
adding a `lang-xx` span next to the existing ones and a new toggle button in
the top bar (see `setLang()` in `script.js`).

## 6. Local preview

Since the form depends on Netlify Forms + Functions, a full local test needs
the Netlify CLI:

```bash
npm install -g netlify-cli
netlify dev
```

Opening `index.html` directly as a `file://` URL will render the design, but
submissions won't be captured and `admin.html` won't be able to load data —
that only works once deployed on Netlify (or run through `netlify dev`).
