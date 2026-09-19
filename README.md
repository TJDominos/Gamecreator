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

Creator Workers serve the Creator SPA and control-plane APIs only. User game
files are served by the separate `gamecreator-play-dev` Worker on `workers.dev`
and embedded into the main site shell via iframe:
- Public games: `https://randseed.org/{game_id}`
- Private releases: `https://randseed.org/private/{game_id}?token={token}`

Run the Play Worker locally with:

```bash
npm run worker:play:dev
```

The Play Worker has only the game D1 and R2 bindings. It does not bind Creator
SPA assets, JWT secrets, or Creator API routes. It deploys directly to
`workers_dev` with built-in Cloudflare Edge caching.

The `dev` environment has separate Rust Creator and Play Workers. The Creator
Worker is `gamecreator-worker-dev` on `devcreator.randseed.org`; it owns the
Creator control plane, D1 writes, and R2 upload validation. The Play Worker is
`gamecreator-play-dev` at
`https://gamecreator-play-dev.tjluckydominos.workers.dev`; it reads the shared
development D1 and `gamecreator-artifacts-dev` R2 bucket to serve immutable
game releases. It has no Creator JWT, ASSETS, or Creator API bindings.

Run local development against `dev`:

```bash
npm run worker:dev
```

Deploy the development Worker:

```bash
npm run worker:deploy:dev
npm run worker:play:deploy:dev
```

Migrations must be applied to the same environment's D1 database. For the
current dev database, use `--env dev` and the actual migration file:

```bash
npx wrangler d1 execute gamecreator-d1 --env dev --remote --file=./migrations/0001_init.sql
npx wrangler d1 execute gamecreator-d1 --env dev --remote --file=./migrations/0002_github_sync.sql
npm run d1:migrate:pipeline:dev
npm run d1:migrate:private:dev
```

The pipeline migration creates immutable deployment records, short-lived upload
sessions, per-file checksum records, release pointers, and webhook delivery
deduplication. Apply it only after the base migrations have been applied. The
dev Worker expects the R2 bucket `gamecreator-artifacts-dev`; inspect or create
it with `npm run r2:list` and `npm run r2:create:dev`.

### Worker secrets

Non-sensitive environment values are stored in `wrangler.jsonc`. Each named
environment has its own Worker secrets. Set them for `dev`:

```bash
for secret in JWT_SECRET GITHUB_APP_ID GITHUB_APP_PRIVATE_KEY GITHUB_CLIENT_SECRET GITHUB_WEBHOOK_SECRET; do
	npx wrangler secret put "$secret" --env dev
done
```

`GITHUB_APP_PRIVATE_KEY` must be the complete PEM private key generated
by the corresponding GitHub App. Use `.dev.vars.example` to create local
`.dev.vars` values for `wrangler dev`; `.dev.vars` is ignored by Git.

The GitHub App callback and webhook URLs must point to the matching Worker:

- Dev: `https://devcreator.randseed.org/api/github/callback` and
	`https://devcreator.randseed.org/api/webhooks/github`

### Local GitHub App debugging

GitHub connection endpoints are not mocked by the Vite development server. Run
the Worker and portal separately, and point the browser-safe API URL at the
local Worker:

```bash
cp .dev.vars.example .dev.vars
# Fill .dev.vars with the GitHub App credentials and a local JWT_SECRET.
npm run worker:dev
```

Create an ignored `.env.local` with `VITE_API_BASE_URL` set to the local Worker
URL (normally `http://localhost:8787`) before starting `npm run dev`. GitHub
must be able to reach the callback and webhook, so use an HTTPS tunnel for the
Worker when testing installation callbacks or webhook delivery. Configure the
GitHub App's Setup URL and Webhook URL to that tunnel's `/api/github/callback`
and `/api/webhooks/github` paths, and set the local Worker `MAIN_SITE_URL` to
the portal URL that should receive the callback redirect.

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

### GitHub Actions deployment contract

The GitHub App needs repository **Contents: Read-only**, **Actions: Read and
write**, and repository webhook delivery. The Worker verifies the GitHub
webhook HMAC before creating one pending deployment per game and commit, then
dispatches the configured workflow (`GITHUB_ACTION_WORKFLOW`, currently
`randseed-deploy.yml`).

The generated workflow must use `workflow_dispatch`, checkout the exact
`commit_sha` input, and request `id-token: write`. It exchanges the GitHub
Actions OIDC token for a 15-minute upload session. Each file is uploaded to R2
under a deployment-specific immutable prefix and is checked against the
manifest's SHA-256 and byte length before publication. No long-lived deployment
token or Cloudflare credential is placed in a user repository workflow.

The public game URL is `https://randseed.org/{game_id}`. The Play Worker
resolves the active release pointer and serves completed files from the active
deployment. Private links use `https://randseed.org/private/{game_id}?token={token}`
and are verified against token hashes in D1; they can expire or be revoked. Older
deployments cannot replace a newer release pointer.
