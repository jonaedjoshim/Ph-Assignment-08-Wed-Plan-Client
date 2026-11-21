# WedPlan — Wedding Planning Platform (Client)

## Project Name and Description

**WedPlan** is a role-based wedding planning platform where customers discover wedding services, send booking requests to vendors, and track those requests. Vendors publish and manage services, handle booking requests and subscribe to a paid plan. Admins manage users, review services and monitor transactions.

This repository contains the **Next.js client application**. The Express/MongoDB backend lives in a separate repository (links below).

## Important Features

- Wedding-themed responsive home page with Framer Motion animations, featured approved services and service categories.
- Public Browse Services page with search by name, category filter, location filter, price sorting (ascending/descending), pagination, and loading/empty/error states.
- Service details page with vendor information and a booking request form (requires sign-in).
- Better Auth email/password and Google sign-in/sign-up, with role selection (Customer or Vendor) and password validation.
- Role-based dashboards with sidebar layouts:
  - **Customer:** overview, my bookings, cancel pending requests, profile settings.
  - **Vendor:** overview, my services (add/update/delete/availability), booking requests (accept/reject), subscription, profile settings.
  - **Admin:** overview, manage users (search/filter/block/unblock/change roles), manage services (approve/reject/delete), transactions.
- Stripe Checkout upgrade flow with Free, Starter (up to 10 active services) and Premium (unlimited services and vendor badge) plans, plus dedicated payment success and cancel pages. Paid plans activate only after the verified server-side webhook.
- HeroUI components and toast notifications for user feedback.
- JWT-backed authenticated API calls through a single `apiFetch` helper.

## Technology Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router, React 19) |
| Language | TypeScript 5 |
| UI | Tailwind CSS 3, HeroUI 2.8, lucide-react |
| Animation | Framer Motion 14 |
| Auth | Better Auth 1.7 (JWT client plugin) |
| Server | Express 4 + TypeScript (separate repo) |
| Database | MongoDB / Mongoose (separate repo) |
| Payments | Stripe Checkout (separate repo) |
| Images | ImgBB via the server upload endpoint |

## Installation Instructions

Prerequisites: Node.js 20+ and npm.

```bash
git clone https://github.com/jonaedjoshim/Ph-Assignment-08-Wed-Plan-Client.git
cd Ph-Assignment-08-Wed-Plan-Client
npm install
cp .env.example .env.local
# Fill in the values described in Environment Variables below.
```

## How to Run the Project Locally

The client needs the server running (default `http://localhost:5000`).

```bash
# Terminal 1 — server (see the server README)
npm run dev

# Terminal 2 — client
npm run dev
```

Open <http://localhost:3000>.

Useful commands:

```bash
npm run dev     # development server
npm run build   # production build
npm run start   # serve the production build
npm run lint    # ESLint
```

## Live Website Link

**https://wed-plan-mj.vercel.app/**

## Client and Server Repository Links

- Client: <https://github.com/jonaedjoshim/Ph-Assignment-08-Wed-Plan-Client>
- Server: <https://github.com/jonaedjoshim/Ph-Assignment-08-Wed-Plan-Server>

## Environment Variables

Create `.env.local` in the project root. Never commit `.env.local` or any secret value.

| Variable | Example | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000` | Base URL used by pages and the Better Auth client to build `${API_URL}/api/...` requests. Set to `https://wed-plan-server.onrender.com` for the deployed client. |
| `API_PROXY_TARGET` | `http://localhost:5000` | Target of the `next.config.ts` rewrite for `/api/:path*`. This is independent of `NEXT_PUBLIC_API_URL`; set both to the same backend URL. |

The client holds **no secret keys**. All sensitive credentials (MongoDB URI, Better Auth secret, Google OAuth client secret, Stripe secret/webhook keys and the ImgBB API key) stay on the server.

Admin accounts are **not** created through public registration. They are provisioned on the server with its admin bootstrap script; evaluation credentials are provided separately.

## Required Application URLs

| URL | Purpose |
| --- | --- |
| `/` | Home (banner, featured services, categories, Why Choose WedPlan, How It Works) |
| `/services` | Browse services (public) |
| `/services/[serviceId]` | Service details + booking form (sign-in required) |
| `/sign-in`, `/sign-up` | Authentication |
| `/customer`, `/vendor`, `/admin` | Role dashboards |
| `/settings/profile` | Profile settings |
| `/payment/success`, `/payment/cancel` | Stripe checkout return pages |

Backend base URL (local): `http://localhost:5000`. Backend base URL (deployed): `https://wed-plan-server.onrender.com`.

## Deployment Guideline

1. Deploy the server first and note its public URL.
2. In Vercel, import this repository and set `NEXT_PUBLIC_API_URL` and `API_PROXY_TARGET` to the deployed server URL with no trailing slash.
3. On the server, set `CLIENT_URL` to this site's URL so CORS and Stripe return URLs match.
4. Verify: no CORS errors, all routes load and reload correctly, private routes redirect to sign-in when signed out, Google sign-in works, and Stripe success/cancel return to the correct pages.
5. Use `npm run build` locally before deploying to catch type/build errors.
