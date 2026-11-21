<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# WedPlan client

Frontend-only Next.js App Router app for a wedding-planning / vendor marketplace. The backend is a separate `wedplan-server` repo (Express, TypeScript, MongoDB, Mongoose); do not implement backend features here or assume its code exists in this repo. A missing planned page is not a bug unless it is part of the task.

## Default role

Reviewer, bug fixer, and git manager. The user owns feature work, UI design, and functionality changes. Keep fixes minimal, preserve intended design, and do not redesign, refactor broadly, or add dependencies. No `any`, `@ts-ignore`, or ESLint suppressions to hide errors. Stop and ask if a fix needs a design decision. Reports in simple English or Bangla are fine.

## Stack (exact versions: package.json / lockfile)

- Next 16.4.6, React 19.3.0, TypeScript 5, Tailwind 3.4.17, HeroUI 2.8.10, Framer Motion 14, lucide-react 1.75, Better Auth 1.7.25, dotenv 18, ESLint 9 flat config.
- `@/*` resolves to `src/*` (tsconfig.json).

## Commands and checks

- `npm run dev`, `npm run build`, `npm run start`, `npm run lint`.
- There is no `test` script and no `typecheck` script. Type-check with `npx tsc --noEmit`. No test suite, CI workflows, or README exist in this repo.
- Verification order: `npm run lint` -> `npx tsc --noEmit` -> `npm run build`. Check actual output; never claim a pass that did not happen. Report pre-existing failures separately and do not push with relevant unresolved failures.

## Structure and data flow

- `src/app` routes, `src/components`, `src/lib`. `customer/`, `vendor/`, and `admin/` layouts each wrap `DashboardShell variant=...` in `<Suspense>`; most data pages are `"use client"` and fetch in `useEffect`.
- All authenticated API calls go through `apiFetch` in `src/lib/api.ts`: it reads a JWT via `authClient.token()` (Better Auth `jwtClient` plugin), sets `Authorization: Bearer ...`, uses `credentials: "include"`, then calls native `fetch`. Use this helper rather than raw `fetch`.
- Toasts: `addToast` from `@heroui/react`; `ToastProvider` (top-right) is mounted in `src/app/providers.tsx`. Never use `alert()`.

## API config gotcha

Two independent env vars, both defaulting to `http://localhost:5000`:

- `NEXT_PUBLIC_API_URL` — used by `src/lib/auth-client.ts` and every page as `API_BASE_URL` to build `${API_BASE_URL}/api/...` URLs. This is the only one documented in `.env.example`.
- `API_PROXY_TARGET` — used only by the `next.config.ts` rewrite `/api/:path*` -> `${API_PROXY_TARGET}/api/:path*` (trailing slashes stripped). Changing it does not change the URLs pages build.

`.env*` is gitignored (except `.env.example`). Never commit env files, keys, or secrets.

## Next.js specifics

- `next.config.ts` enables `cacheComponents` and `partialPrefetching` plus the rewrite above. Verify it before relying on it.
- Do not add `dynamic`, `revalidate`, `fetchCache`, or `runtime` route exports. Follow the repo's `<Suspense>` pattern (layouts and client hooks like `useSearchParams`/`usePathname` are wrapped), and use `"use cache"` with `cacheLife` where appropriate.
- Consult `node_modules/next/dist/docs/` before using unfamiliar APIs; heed deprecation notices. Do not edit the generated rules block at the top of this file.

## UI conventions

Brand colors in `tailwind.config.ts`: `wedplan-ink` `#2d2725`, `wedplan-cream` `#fffaf7`, `wedplan-rose` `#96575b`. `darkMode: "class"`, HeroUI plugin plus HeroUI theme in `content`. Preserve the existing visual identity, layout, typography, spacing, and responsive behavior; use existing Tailwind/HeroUI patterns and no new UI library.

## Product and security invariants (context, not permission to add features)

Roles are `customer`, `vendor`, `admin`; public registration must not create admins. Service statuses `pending`/`approved`/`rejected`, and only approved services appear in public listings. Booking statuses `pending`/`accepted`/`rejected`/`cancelled`. Free vendors are capped at three active services; premium activates only after a verified Stripe webhook, never a frontend redirect. The backend owns authentication, roles, ownership, self-booking and duplicate-booking rules — client route guards are not security controls. Do not claim frontend code enforces a backend guarantee; report that gap separately.

## Git

`origin` is `github.com/jonaedjoshim/Ph-Assignment-08-Wed-Plan-Client.git`, branch `main`. Inspect status and the full diff before staging; stage only reviewed files by path; use Conventional Commits; push the current branch. Never discard, reset, revert, force-push, or amend user work. Stop on unexpected remote changes; make no empty commit.
