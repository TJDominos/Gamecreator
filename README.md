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
- `VITE_WL_LOGIN_URL` — login URL for the selected environment
- `VITE_API_BASE_URL` — Worker API URL for the selected environment

Frontend `.env` files may only contain browser-safe `VITE_*` values. Never put a
GitHub App private key, client secret, webhook secret, or JWT secret in a `VITE_*`
variable.

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

## Worker environments and deploy

The Worker uses Wrangler named environments:

| Environment | Worker | Site | GitHub App |
|-------------|--------|------|------------|
| `dev` | `gamecreator-worker-dev` | `devcreator.randseed.org` | `RDcreatordev` |
| `test` | `randseed-gamecreator-worker-test` | `testcreator.randseed.org` | Replace with test App slug |
| `production` | `randseed-gamecreator-worker-production` | `creator.randseed.org` | Replace with production App slug |

The current Worker and D1 configuration is the `dev` environment. `test` and
`production` are intentionally configured with placeholder D1 IDs and must not
be deployed until their D1 databases, domains, and GitHub Apps are created.

Run local development against `dev`:

```bash
npm run worker:dev
```

Deploy explicitly to an environment:

```bash
npm run worker:deploy:dev
npm run worker:deploy:test
npm run worker:deploy:production
```

Migrations must be applied to the same environment's D1 database. For the
current dev database, use `--env dev` and the actual migration file:

```bash
npx wrangler d1 execute gamecreator-d1 --env dev --remote --file=./migrations/0001_init.sql
npx wrangler d1 execute gamecreator-d1 --env dev --remote --file=./migrations/0002_github_sync.sql
```

Do not run a production deployment until the placeholder values in
`wrangler.jsonc` have been replaced.

### Worker secrets

Non-sensitive environment values are stored in `wrangler.jsonc`. Each named
environment has its own Worker secrets. Set them once for every environment:

```bash
for secret in JWT_SECRET GITHUB_APP_ID GITHUB_APP_PRIVATE_KEY GITHUB_CLIENT_SECRET GITHUB_WEBHOOK_SECRET; do
	npx wrangler secret put "$secret" --env dev
done
```

Repeat with `--env test` and `--env production` after those environments are
created. `GITHUB_APP_PRIVATE_KEY` must be the complete PEM private key generated
by the corresponding GitHub App. Use `.dev.vars.example` to create local
`.dev.vars` values for `wrangler dev`; `.dev.vars` is ignored by Git.

The GitHub App callback and webhook URLs must point to the matching Worker:

- Dev: `https://devcreator.randseed.org/api/github/callback` and
	`https://devcreator.randseed.org/api/webhooks/github`
- Test: `https://testcreator.randseed.org/api/github/callback` and
	`https://testcreator.randseed.org/api/webhooks/github`
- Production: `https://creator.randseed.org/api/github/callback` and
	`https://creator.randseed.org/api/webhooks/github`

Vercel SPA rewrites are configured in `vercel.json`.

Production deploys run automatically from the `main` branch through
`.github/workflows/deploy.yml`. Add these repository secrets before the first
push:

- `CLOUDFLARE_API_TOKEN` - API token with Workers Scripts edit permission and
	access to the `gamecreator-d1` database
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID that owns the Worker

The workflow can also be started manually from the GitHub Actions tab.

The Worker JWT key is a Wrangler secret, not a value in `wrangler.jsonc`. For
local Worker development, put a random value in the ignored `.dev.vars` file:

```bash
printf 'JWT_SECRET=%s\n' "$(openssl rand -base64 32)" > .dev.vars
```
