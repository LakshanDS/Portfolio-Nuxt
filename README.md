# Portfolio-Nuxt

Personal portfolio of [Lakshan De Silva](https://github.com/lakshanDS) — a terminal-styled portfolio site with a built-in CMS, running entirely on Cloudflare.

## Stack

- **Nuxt 3 (SSR) + Nitro** on **Cloudflare Workers**
- **Cloudflare D1** (SQLite) via **Drizzle ORM** — projects, roadmap, about, homepage settings
- **Cloudflare R2** for uploads
- Built-in admin dashboard for editing all site content (projects, roadmap, about, homepage sections)

## Setup

```bash
bun install
bun run dev   # http://localhost:3000
```

Local development uses wrangler's local D1 state (`.wrangler/`), so the API endpoints work out of the box.

## Database

Schema lives in `server/database/schema/sqlite.ts`, migrations in `server/database/migrations` (wired via `drizzle.config.ts`).

```bash
bunx drizzle-kit generate                        # create a migration from the schema
bunx wrangler d1 migrations apply DB --local     # apply locally
bunx wrangler d1 migrations apply DB --remote    # apply to production
```

## Deploy

```bash
bun run build
bunx wrangler deploy
```

Expects a `portfolio` D1 database and a `portfolio-uploads` R2 bucket — see `wrangler.jsonc`.

## License

[MIT](./LICENSE)
