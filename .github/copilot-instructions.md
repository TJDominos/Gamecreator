# Copilot Instructions — RandSeed Developer Portal (Gamecreator)

You are the AI coding assistant for the **RandSeed Developer Portal (Gamecreator)** repository. Follow these architectural invariants and engineering standards across all code generation, refactoring, debugging, and review tasks.

Before conducting PR reviews, read and execute [prompts/review-pr.prompt.md](prompts/review-pr.prompt.md) as the detailed review workflow.

---

## 1. Platform & Technology Stack

- **Frontend**: React 18 / 19, TypeScript, Vite, Tailwind CSS v4, RS Design System tokens (`vendor/RS`).
- **Backend / Edge API**: Cloudflare Worker (`worker/src/index.ts`, `ExportedHandler<Env>`).
- **Database**: Cloudflare D1 (SQLite) with sequential, idempotent migrations in `migrations/*.sql`.
- **Platform Boundary**: Exclusively Cloudflare Worker + D1 + React. ICP/Canister technologies (`ic_cdk`, Motoko, Candid, `wl_caller`, stable memory) are excluded.

---

## 2. Core Architectural & Security Invariants (MUST)

### A. State Management & Progressive Migration
- **4-Tier State Matrix**:
  1. **URL State** (`useSearchParams`): Filter conditions, search query, sorting, active page/cursor, tab.
  2. **Server Cache** (`apiClient` / query hooks): Remote server entities with explicit query keys and invalidation.
  3. **Shared Client State** (Zustand Store / `AuthContext`): Cross-page UI state, active session, user identity.
  4. **Component State** (`useState`, `useReducer`): Ephemeral modal visibility, form draft inputs, hover states.
- **Page Ownership**: Page components must remain rendering and composition layers. Never store shared cross-page business state in page components.
- **Zustand Discipline**: New shared stores MUST separate `state`, `actions`, `mutations`, and `selectors`.
- **Progressive Migration**: `AuthContext` and `apiClient` represent existing baseline code. Existing patterns may be maintained for targeted bugfixes, while new shared features and refactors must adopt the Zustand store structure.

### B. Worker & API Contracts
- **Standard Envelope**: All API endpoints return `{ success: boolean, data?: T, error?: string, message?: string, code?: string, pagination?: {...} }` via `worker/src/utils/response.ts`.
- **HTTP Status Code Discipline**:
  - `200` / `201`: Successful read/write.
  - `400`: Malformed input / validation error with structured machine-readable code.
  - `401`: Missing, invalid, or expired JWT token.
  - `403`: Valid token but insufficient role or ownership permissions.
  - `404`: Resource or route not found.
  - `409`: Unique conflict or state concurrency violation.
  - `500`: Sanitized internal error (never expose raw SQLite errors or stack traces).
- **Authentication & RBAC**: Protected routes MUST authenticate via `getAuthenticatedUser(request, env)` and enforce RBAC via `hasRequiredRole()`. Authorization must follow `caller / role / resource / action`.

### C. D1 Database Safety
- **Parameterized Queries**: All D1 operations MUST use `db.prepare(...).bind(...)`. Never interpolate dynamic variables into SQL.
- **Data Conventions**: Timestamps are stored as epoch milliseconds (`INTEGER NOT NULL`). Foreign keys must specify explicit referential actions (`ON DELETE CASCADE` / `RESTRICT`).
- **Migrations**: Files in `migrations/*.sql` must be sequential, idempotent (`IF NOT EXISTS`), non-destructive, and backward-compatible.

### D. Data Flow & Concurrency
- **Mandatory Pagination**: Any list that can exceed 100 items or grow unbounded MUST paginate (default 20, max 100). Use cursor pagination for mutable datasets and tie-breaker sorting (`ORDER BY created_at DESC, id DESC`).
- **Sorting Whitelist**: Dynamic sort fields must use a strict code-level whitelist; `sortOrder` must be strictly validated as `ASC` or `DESC`.
- **Debounce & Race-Safety**: Freeform searches and live filters must be debounced (300–500 ms). In-flight requests must support cancellation via `AbortController` to prevent out-of-order responses from overwriting newer state.
- **Action Throttling**: Action buttons must disable immediately upon click and show loading feedback to prevent duplicate submissions.

### E. Security & Privacy
- **Secret Isolation**: Never commit secrets or API keys. Secrets must come from Cloudflare environment bindings (`env.*`).
- **Cryptographic Operations**: Use Web Crypto (`crypto.getRandomValues()`) for tokens, nonces, and IDs; never use `Math.random()`.
- **Log Privacy**: Never log credentials, JWTs, unredacted PII, or full sensitive request bodies.

---

## 3. Code Style & Language

- **English Only**: User-facing copy, code identifiers, comments, logs, and error messages MUST be in English only.
- **UI Consistency**: Use RS Design System tokens and Tailwind v4 utilities. Provide loading, error (with retry), empty, disabled, and success states for all interactive flows.
