# Portfolio — Andrey Mazurov

A portfolio site with the frontend and the backend in a single repository.

| Layer | Technologies |
| --- | --- |
| Monorepo | pnpm workspaces + Turborepo |
| Frontend (`apps/web`) | Nuxt 4 (Vue 3), SSR, Nitro `node-server` |
| Backend (`apps/api`) | Fastify 5 + TypeScript |
| Database | MongoDB 7 + Mongoose |
| Shared schemas (`packages/shared`) | Zod |
| Infrastructure | Docker Compose |

## How it fits together

**There is one public entry point — Nuxt.** Fastify is never published
externally: Nuxt calls it over an internal address during server-side
rendering and proxies form submissions through its own route,
`server/api/contact.post.ts`. As a result there is no CORS, the admin
endpoints are unreachable from the internet, and the whole site lives on a
single domain — which is simpler for SEO too.

**Schemas are written once.** `packages/shared` holds the Zod schemas that
Fastify uses to validate requests and serialise responses, and that Nuxt uses
to type its data and validate the form in the browser. Client and server
cannot drift apart by construction.

**Content lives in the database.** The name, headline, SEO metadata, list of
technologies and contact links are read from MongoDB, so edits do not require
a frontend rebuild.

## Requirements

- Node.js 22+ (`.nvmrc`)
- pnpm 8+
- Docker (for MongoDB and production builds)

## Quick start

```bash
cp .env.example .env      # fill in ADMIN_TOKEN and IP_HASH_SALT
docker compose up -d mongo
pnpm install
pnpm seed                 # populate the database with content
pnpm dev                  # web :3000, api :4000
```

**The site opens at http://localhost:3000** — that is the only address you
need in a browser.

Port 4000 is the internal Fastify service; it is not published externally and
serves no HTML. Its root only lists the available routes — there are no pages
there. The useful parts are `/docs` (OpenAPI UI, dev only), `/health/ready`
and `/api/content`.

If `:3000` does not answer, check the `pnpm dev` output: when the port is
taken, Nuxt quietly moves to 3001. To free the port: `lsof -ti:3000 | xargs kill`.

Generate the secrets like this:

```bash
openssl rand -hex 32      # ADMIN_TOKEN
openssl rand -hex 16      # IP_HASH_SALT
```

If MongoDB is already installed locally, Docker is not needed for development
— just point `MONGO_URI` at your own instance.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Run both apps in development mode |
| `pnpm build` | Production build of every package |
| `pnpm test` | Run the API and frontend test suites |
| `pnpm typecheck` | Type checking |
| `pnpm seed` | Populate the database from `apps/api/src/seed/data/portfolio.json` |
| `pnpm docker:up` | Bring the whole stack up in containers |

## Editing content

The main path is to edit `apps/api/src/seed/data/portfolio.json` and run
`pnpm seed`. The script is idempotent: updates go through upserts on natural
keys (`profile.key`, `tech.name`, `contactLink.label`), and the `messages`
collection is left alone — re-running it against production is safe.

Targeted edits without a deployment go through the private CRUD API:

```bash
# Messages from the contact form
curl -s localhost:4000/api/admin/messages -H "authorization: Bearer $ADMIN_TOKEN"

# SEO title
curl -X PUT localhost:4000/api/admin/profile \
  -H "authorization: Bearer $ADMIN_TOKEN" -H 'content-type: application/json' \
  -d '{"seo":{"title":"…","description":"…","keywords":[],"ogImage":"/og.png"}}'
```

The full list: `PUT /api/admin/profile`, CRUD over `/api/admin/techs` and
`/api/admin/contact-links`, and `GET|PATCH|DELETE /api/admin/messages[/:id]`.

**Files to add by hand** in `apps/web/public/`: `cv.pdf` (the "Open CV"
button) and `og.png` at 1200×630 (the social preview). Their paths are
configured through `profile.cvUrl` and `profile.seo.ogImage`.

### Adding a new icon

Icons are embedded in the frontend bundle so that server-side rendering makes
no network request for their data. A new Iconify key therefore has to be added
in **two places**: to the data (database or seed) and to the
`icon.clientBundle.icons` list in `apps/web/nuxt.config.ts`.

A forgotten key breaks neither the build nor the render — the icon simply
comes out as an empty SVG. That is exactly why `apps/web/test/icons.test.ts`
exists: it cross-checks the seed keys against the installed collections and
against the list in the config. Names are worth verifying — GraphQL, Jest and
Next.js, for instance, only exist in the `devicon-plain` collection, not in
`devicon`.

## Search engine indexing

- **SSR** — all content is present in the initial HTML; the page reads
  completely with JavaScript disabled.
- **Metadata** — `useSeoMeta` pulls the title, description, keywords, Open
  Graph and Twitter Card values from `profile.seo` in the database.
- **JSON-LD** — a `Person` schema whose `sameAs` is assembled from the contact
  links and whose `knowsAbout` comes from the technology list.
- **`/robots.txt` and `/sitemap.xml`** are generated by the `@nuxtjs/robots`
  and `@nuxtjs/sitemap` modules. Indexing is deliberately blocked in
  development; the production variant can be inspected via
  `/robots.txt?mockProductionEnv`.
- **Semantics** — a single `h1`, section headings (hidden visually where the
  design has none), and `aria-label` on the icon links. The technology names
  from the hero are duplicated as a text list: in the design they exist only
  as graphics, but to crawlers they are keywords.
- **No external requests** — Inter is self-hosted through `@nuxt/fonts`, and
  icons are inlined as SVG from local Iconify collections. In the original
  mockup both the font and the icons were pulled from CDNs.
- **Resilience** — if the API is unavailable, the page still returns 200 with
  content from the `apps/web/app/data/fallback.json` snapshot rather than a
  500. A downed backend must not push the site out of the index.
- `/` is cached for an hour (`swr: 3600`), and service JSON routes carry an
  `X-Robots-Tag: noindex` header.

## Design system

The visual layer comes from the **Nocturne** design system
(`apps/web/app/assets/css/nocturne.css`) — a dark `#161826` ground, a `#9184d9`
accent, Inter, a dense spacing scale and outlined buttons. It is the source of
truth: no component should introduce a hex, font or size that a variable there
already describes.

## Deployment

```bash
docker compose up --build -d
```

Three services come up: `mongo` (with the `mongo-data` volume), `api` (its
port is not published) and `web` on `:3000`. Before going live:

1. Fill `.env` with real secrets and a real `NUXT_PUBLIC_SITE_URL`.
2. Remove the `27017:27017` port mapping from the `mongo` service — it exists
   only for local development.
3. Put a reverse proxy with HTTPS (nginx or Caddy) in front of `web`.
4. Run `pnpm seed` once, with access to the production database.

## Layout

```
apps/api/src/
  app.ts            Fastify assembly (reused by the tests)
  config.ts         environment validation through Zod
  plugins/          mongo, security (rate limit, admin token, IP hashing)
  models/           Mongoose schemas
  routes/           health, content, messages, admin
  seed/             seeding script and its data
apps/web/
  app/components/   HeroSection, StackCloud, ContactSection, ContactForm…
  app/composables/  useParallax, useReducedMotion
  app/assets/css/   nocturne.css (design system), app.css (page)
  server/api/       BFF proxy to Fastify
packages/shared/    Zod schemas shared by the frontend and the backend
```
