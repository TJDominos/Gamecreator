---
description: Unified PR review prompt for Gamecreator (Cloudflare Worker, D1, React, Zustand, Security, UI)
agent: 'agent'
---

# Unified PR Review Prompt — Gamecreator

This prompt is the single, self-contained review workflow for the **RandSeed Developer Portal (Gamecreator)** repository. It enforces core security, data safety, state architecture, and API stability invariants.

---

## 1. Review Principles & Decision Rules

- **Zero Tolerance for Unverified Security**: Missing authorization evidence or unverified high-risk changes MUST result in `FAIL` or `NEEDS-INFO`, never `PASS`.
- **Progressive Architecture**: Differentiate between new features/refactors (which must strictly follow Zustand store separation and modern patterns) and targeted bugfixes in legacy modules (e.g. `AuthContext`, `apiClient`).
- **Smallest Viable Change**: Flag unnecessary churn, gold-plating, or architectural sprawl.
- **Evidence-Driven Decisions**:
  - `PASS`: All applicable checks have supporting code/test evidence.
  - `FAIL`: A security, data-safety, or critical architectural invariant is broken.
  - `NEEDS-INFO`: An applicable high-risk path cannot be validated from the diff; specify the exact missing evidence.

---

## 2. Mandatory Bilingual Output

Every review report section, finding, and verdict MUST include bilingual explanations:
```
中文：<清晰具体的中文说明与修改建议>
EN: <Clear, actionable English explanation and remediation>
```

---

## 3. Step 1 — Determine Applicable Domains

Identify which domains apply based on the PR diff and description:

| Domain | Scope & File Patterns |
| :--- | :--- |
| **Worker / API** | `worker/**/*.ts`, route handlers, middleware, request validation, response envelopes |
| **D1 / Database** | `migrations/*.sql`, SQL queries, indexes, transactions, schema changes |
| **Frontend / State** | `src/**/*.{ts,tsx}`, Zustand stores, Context, data fetching, caching, debounce, forms |
| **Security / Auth** | JWT verification, RBAC (`hasRequiredRole`), secrets, CORS, audit logging, rate limiting |
| **UI / Accessibility** | `src/**/*.{tsx,css}`, RS Design System tokens, responsive layout, 5-state handling |
| **Release / Config** | `wrangler.jsonc`, build scripts, environment bindings, migration deploy order |

---

## 4. Step 2 — Domain Checklists (P0 Gates)

### A. Worker & Edge API
- [ ] **Standard Envelope**: Endpoints return `{ success, data?, error?, message?, code?, pagination? }` via `worker/src/utils/response.ts`.
- [ ] **Status Code Semantics**: `200`/`201` success, `400` validation error, `401` unauthenticated, `403` forbidden, `404` not found, `409` conflict, sanitized `500` (no stack traces or raw SQLite errors).
- [ ] **Input Bounds**: Request body size, JSON depth, array limits, string lengths, and query parameters are validated and bounded before processing.
- [ ] **Fail-Closed**: Errors, exceptions, and validation failures fail closed with structured error responses.
- [ ] **External Call Resilience**: External fetches use `AbortController` timeouts; mutating retries require idempotency keys.

### B. D1 Database & Migrations
- [ ] **SQL Injection Prevention**: All D1 operations strictly use parameterized bindings: `db.prepare(...).bind(...)`. No string interpolation in SQL.
- [ ] **Dynamic Sorting Safety**: Whitelist allowed `sortBy` columns in code; strictly validate `sortOrder` as `ASC` or `DESC`.
- [ ] **Deterministic Pagination**: Paginated queries include a tie-breaker column (e.g. `ORDER BY created_at DESC, id DESC`). Cursors encode the ordering tuple.
- [ ] **Migration Discipline**: Migrations in `migrations/*.sql` are sequentially numbered, idempotent (`CREATE TABLE/INDEX IF NOT EXISTS`), and non-destructive.
- [ ] **Schema Conventions**: Timestamps stored as epoch milliseconds (`INTEGER NOT NULL`). Compound indexes support combined filter + sort queries.

### C. Frontend Architecture & State Management
- [ ] **State Tiering**: State lives in the correct layer (URL query -> Server cache -> Zustand/AuthContext -> Component state).
- [ ] **Page Decoupling**: Page components do not store shared cross-page business state; pages remain rendering/composition layers.
- [ ] **Zustand Discipline**: New stores separate `state`, `actions`, `mutations`, and `selectors`. Selectors are used to avoid unneeded re-renders.
- [ ] **Debounce & Race-Safety**: Freeform search inputs are debounced (300–500 ms). In-flight requests are cancellable via `AbortController` on tab/filter/search changes.
- [ ] **Action Throttling**: Mutation buttons disable immediately and show loading spinners to prevent double submission.
- [ ] **5-State UI**: All async flows explicitly handle loading (skeletons), error (with retry CTA), empty (with CTA), disabled, and success states.
- [ ] **Cache Consistency**: Mutations invalidate or update relevant cache keys to guarantee read-your-writes.

### D. Security & Privacy
- [ ] **Authentication & RBAC**: Protected routes call `getAuthenticatedUser()` and enforce roles via `hasRequiredRole()`.
- [ ] **Explicit Permission Model**: PRs changing protected endpoints document: `caller / role / resource / action`.
- [ ] **Anonymous Route Audit**: Any unauthenticated endpoint is explicitly disclosed and justified.
- [ ] **Secret Isolation**: Zero secrets, private keys, or API tokens in client bundles, source code, or logs. Secrets reside in Cloudflare bindings (`env.*`).
- [ ] **CORS Integrity**: `OPTIONS` preflight handled before auth; `Origin` validated against `CORS_ORIGINS`. Never wildcard `*` on authenticated routes.
- [ ] **Log Sanitization**: Logs exclude credentials, JWTs, full request bodies, and unredacted PII. Audit logs capture security-sensitive mutations.

### E. UI, Design System & Accessibility
- [ ] **Design Tokens**: Styles, colors, buttons, and elevation use RS Design System tokens (`vendor/RS`) and Tailwind v4 utilities.
- [ ] **Language**: User-facing text, labels, alerts, logs, and comments MUST be in English only.
- [ ] **Layout Stability**: Images and media specify aspect ratios/placeholders to prevent layout shift (CLS).
- [ ] **Keyboard & Focus**: Interactive controls support keyboard navigation, visible focus rings, and valid ARIA attributes.

---

## 5. Step 3 — Test & Verification Evidence

- [ ] **Unauthorized Path Evidence**: Protected route changes provide evidence/tests for unauthorized (401/403) access failure.
- [ ] **Boundary & Edge Tests**: Tests cover empty states, maximum bounds, invalid inputs, and conflict (409) handling.
- [ ] **Build & Lint**: PR passes `npm run lint` and `npm run build` without errors.

---

## 6. Required Review Report Structure

```markdown
## PR Review — Unified

### 1. Applicable Domains
中文：<列出适用的领域：Worker/API, D1/Database, Frontend, Security, UI 等>
EN: <List applicable domains: Worker/API, D1/Database, Frontend, Security, UI, etc.>

### 2. Overall Verdict
**Result**: PASS | FAIL | NEEDS-INFO

中文：<总体结论简述与关键决策原因>
EN: <Executive summary of review verdict and key drivers>

### 3. Key Findings & Blocking Issues (Ordered by Severity)
- **[P0/Blocking | P1/Warning | P2/Nit]** <Short issue title>
  - **Location**: `path/to/file.ts:line`
  - 中文：<具体问题说明及修改建议>
  - EN: <Specific defect explanation and remediation guidance>

### 4. Domain Checklist Verification
- **Worker & API**: PASS | FAIL | NEEDS-INFO | N/A
  - 中文：<简要评估> / EN: <Brief assessment>
- **D1 Database**: PASS | FAIL | NEEDS-INFO | N/A
  - 中文：<简要评估> / EN: <Brief assessment>
- **Frontend & State**: PASS | FAIL | NEEDS-INFO | N/A
  - 中文：<简要评估> / EN: <Brief assessment>
- **Security & Privacy**: PASS | FAIL | NEEDS-INFO | N/A
  - 中文：<简要评估> / EN: <Brief assessment>
- **UI & Accessibility**: PASS | FAIL | NEEDS-INFO | N/A
  - 中文：<简要评估> / EN: <Brief assessment>

### 5. Missing Evidence / Action Items (If FAIL or NEEDS-INFO)
- 中文：<需要补充的测试证据、配置或代码修复项>
- EN: <Required test evidence, configuration, or code remediations>
```
