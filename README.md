# RandSeed Developer Portal (RSdev)

Standalone developer website extracted from the RandSeed homepage. Includes:

- Developer landing (`/`)
- Organization onboarding (`/onboarding`)
- Developer portal shell and dashboard (`/dashboard`, `/games`, …)

## Develop

```bash
npm install
npm run dev
```

Default dev server: http://localhost:3001

## Environment

Copy `.env.example` to `.env` and set:

- `VITE_MAIN_SITE_URL` — main RandSeed site URL for footer links (default: `https://randseed.org`)

## Build

```bash
npm run lint
npm run build
npm run preview
```

## Routes

| Path | Page |
|------|------|
| `/` | Developer landing |
| `/onboarding` | Create developer organization |
| `/dashboard` | Portal dashboard |
| `/games`, `/sandbox`, `/data`, `/revenue`, `/docs`, `/settings` | Portal sections (placeholders) |

Auth and organization data are stored in `localStorage` (mock wallet sign-in), same keys as the main site when sharing an origin.

## Deploy

Vercel SPA rewrites are configured in `vercel.json`.

Production deploys run automatically from the `main` branch through
`.github/workflows/deploy.yml`. Add these repository secrets before the first
push:

- `CLOUDFLARE_API_TOKEN` - API token with Workers Scripts edit permission and
	access to the `gamecreator-d1` database
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID that owns the Worker

The workflow can also be started manually from the GitHub Actions tab.

The Worker JWT key is a Wrangler secret, not a value in `wrangler.jsonc`:

```bash
npx wrangler secret put JWT_SECRET
npx wrangler deploy
```

Run the command for each Wrangler environment that needs its own key. For local Worker development, put a random value in the ignored `.dev.vars` file:

```bash
printf 'JWT_SECRET=%s\n' "$(openssl rand -base64 32)" > .dev.vars
```
