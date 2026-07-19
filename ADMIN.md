# The Axon — the live editor (`/admin`)

The site has a login-protected editor at **`yourdomain.com/admin/`** (also
reachable from the pencil icon at the top-right of the site). It's
[Sveltia CMS](https://github.com/sveltia/sveltia-cms) — a Git-based editor,
self-hosted here (no third-party service holds your content).

**How it works:** you sign in with **GitHub** (the account that owns this
site's repository). When you save a paper, the editor commits a Markdown file to
the repo; your host rebuilds the site automatically. Only accounts with *write
access to the repo* can sign in, so it's genuinely private — no password to leak,
nothing to lose. Your articles stay as plain Markdown files (never again locked
in a service that can delete them).

You get the same rich editing as the local Composer — bold, italics, headings,
lists, quotes, links — plus PDF uploads, right from the browser on your domain.

---

## One-time setup

You only do this once, at deploy time. It assumes the site is on **GitHub** and
deployed on **Cloudflare Pages** (swap in Netlify/Vercel if you prefer — the only
difference is where you host the tiny auth worker).

### 1. The site is on GitHub

The repo lives at `github.com/AwiCor/TheAxon`. The build workflow at
`.github/workflows/deploy.yml` builds the Astro site with GitHub Actions.

### 2. Turn on GitHub Pages (via Actions)

In the repo → **Settings → Pages → Build and deployment → Source:
"GitHub Actions"** (not "Deploy from a branch" — that's the Jekyll default that
fails). The workflow then builds and deploys on every push to `main`.

The custom domain (`theaxon.org`) is set under the same **Settings → Pages**
screen; `public/CNAME` keeps it applied on every deploy. Point your domain's DNS
at GitHub Pages (see the checklist in the chat / GitHub's Pages docs).

### 3. Create a GitHub OAuth App

GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**:

- **Homepage URL:** `https://yourdomain.com`
- **Authorization callback URL:** `https://sveltia-cms-auth.<your-subdomain>.workers.dev/callback`
  (the worker URL from step 4 — you can come back and fill this in)

Note the **Client ID** and generate a **Client Secret**.

### 4. Deploy the auth worker

The editor needs a tiny relay to complete the GitHub sign-in. Deploy the
ready-made one — [**`sveltia/sveltia-cms-auth`**](https://github.com/sveltia/sveltia-cms-auth)
(a Cloudflare Worker; the repo's README has a one-click deploy). In the worker's
settings add two secrets:

- `GITHUB_CLIENT_ID` — from step 3
- `GITHUB_CLIENT_SECRET` — from step 3

The worker gives you a URL like `https://sveltia-cms-auth.<sub>.workers.dev`.

### 5. Point the config at your repo + worker

Edit [`public/admin/config.yml`](public/admin/config.yml):

```yaml
backend:
  name: github
  repo: YOUR_USERNAME/theaxon        # your repo
  branch: main
  base_url: https://sveltia-cms-auth.<sub>.workers.dev   # your worker URL
```

Commit and push. Cloudflare redeploys.

### 6. Sign in

Go to **`https://yourdomain.com/admin/`**, click **Sign in with GitHub**, approve,
and you're in the editor. Add a paper, click **Publish** → it commits to the repo
and the site rebuilds in ~a minute.

> **Who can log in?** Only GitHub accounts with write access to the repo. That's
> you (the owner) by default. To let someone else edit, add them as a repo
> collaborator; to revoke, remove them. No separate user list to manage.

---

## Editing locally (no login, no setup)

You don't need the deployed site to use the editor. In a Chromium browser
(Chrome/Edge/Arc/Brave):

```bash
npm run build && npm run preview
# open http://localhost:4173/admin/  → "Work with Local Repository"
```

Pick the `theaxon` folder when prompted, and edit — changes save straight to
`src/content/papers/` on disk. (This uses the browser's File System Access API,
so it needs a Chromium browser; Safari/Firefox will only show the GitHub login.)

Prefer something even simpler for local writing? `npm run compose` opens the
built-in Composer, which does the same job with no browser permissions. Use
whichever you like — both write the same Markdown files.

> Note: on the **dev** server (`npm run dev`) the URL is
> `http://localhost:4323/admin/index.html` (the dev server doesn't add the
> trailing-slash index that `npm run preview` and your live host do).

---

## Updating the editor

The Sveltia bundle is vendored at `public/admin/sveltia-cms.js` (pinned, so it
can't change under you). To update it later:

```bash
curl -L https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js -o public/admin/sveltia-cms.js
```
