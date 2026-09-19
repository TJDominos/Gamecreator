# Rust Worker development runtime

The development environment has two Workers: `gamecreator-worker-dev` is the
Rust Creator control plane on `devcreator.randseed.org`, and
`gamecreator-play-dev` is the Play data plane at
`https://gamecreator-play-dev.tjluckydominos.workers.dev`.

## Commands

```sh
npm run worker:rust:check
npm run worker:rust:test
npm run worker:rust:dev
npm run worker:rust:deploy:dev
npm run worker:play:build
```

`worker:rust:check` requires the `wasm32-unknown-unknown` Rust target. The host-target check (`cargo check --manifest-path rust-worker/Cargo.toml`) is useful for local API diagnostics but is not a deploy validation.

Wrangler uses `scripts/build-rust-worker.sh` for the Rust bundle. The script
bootstraps the stable Rust toolchain when `cargo` is not already available,
adds the `wasm32-unknown-unknown` target, installs the pinned `worker-build`
version, and writes the Wrangler entrypoint under `rust-worker/build/`. This
keeps Cloudflare Workers Builds and GitHub Actions independent of a preinstalled
Rust environment.

Deploy the Play data plane independently:

```sh
npm run worker:play:deploy:dev
```

Creator and Play reuse the same `rust-worker` crate and output path. Wrangler
selects the `creator` or `play` Cargo feature for each deployment; the Play
feature exposes only read-only D1/R2 delivery routes.

The Rust Creator control plane provides rollback through
`POST /api/games/:gameId/rollback` and sanitized deployment logs through
`GET /api/deployments/:deploymentId/logs`. Release objects use immutable
deployment-specific prefixes, publication uses a D1 compare-and-swap pointer,
and the Rust Play feature uses the Cloudflare Cache API without compiling D1
write helpers.

## Development scope

The Creator dev Worker is the active backend for debugging and multi-tenant
management. It writes deployment state to the shared development D1 and
manages uploads in `gamecreator-artifacts-dev`. The Play dev Worker binds only
that development D1 and R2 bucket and serves completed immutable releases;
Creator authentication secrets, Creator assets, and Creator API credentials
are not bound to it.

Before broadening the deployment scope, the local parity checks must cover:

- Auth: SSO exchange, JWT validation, creator promotion, profile updates, and admin role checks.
- Organizations and games: CRUD, creator ownership, public-name/short-name validation, media upload/serve.
- GitHub: installation callback, repository binding, webhook signature/idempotency, and deployment creation.
- Deployments: version history, upload session/artifact verification, publishing race handling, private releases.
- Bounties, play delivery, R2 media, CORS, static asset fallback, and every error/status code.
