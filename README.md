# Kisu Link

A personal URL shortener and QR code workspace built with Next.js App Router and Supabase.

## Run locally

1. Install Node.js 22 or newer and Bun.
2. Run `bun install` in this directory.
3. Copy `.env.example` to `.env.local`, then set `SUPABASE_SECRET_KEY` to your server-only Supabase secret key. The project URL is already in the template. `.env.local` is ignored by Git.
4. Run `bun run dev` and open `http://localhost:3000`.

The local server uses standard Next.js in Webpack mode. Use `bun run build:local` and `bun run start:local` to check the production Next.js server.

## Supabase setup

Run [`supabase/schema.sql`](supabase/schema.sql) in your Supabase project's SQL Editor. The Site and local server both use `SUPABASE_URL` and a server-only `SUPABASE_SECRET_KEY`. A legacy service role key also works under `SUPABASE_SERVICE_ROLE_KEY`. Keep this key out of browser code and `NEXT_PUBLIC_` variables.

The supplied `postgresql://` URL is a direct database connection template and still contains `[YOUR-PASSWORD]`. This app uses Supabase's HTTPS Data API, so it needs an API key instead of the database password.

## Hosted build

The Sites deployment uses Vinext to run the same Next.js routes on Cloudflare Workers. `bun run build` produces that hosted build; `bun run dev:sites` starts its development server.
