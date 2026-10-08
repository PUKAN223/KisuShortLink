# Kisux3 Links

A personal URL shortener and QR code workspace built with Next.js App Router and Supabase.

Each recent link has an automatically generated QR code. Open its QR settings to change the style, colors, or center image. QR settings are saved in this browser; links are stored in Supabase.

Generated short links use `https://kisux3.xyz/<slug>`. For those links to resolve outside your computer, deploy this app at `kisux3.xyz` and point the domain to that deployment. Local development still runs at `http://localhost:3000`.

## Run locally

1. Install Node.js 22 or newer and Bun.
2. Run `bun install` in this directory.
3. Copy `.env.example` to `.env.local`, then set `SUPABASE_SECRET_KEY` to your server-only Supabase secret key. The project URL is already in the template. `.env.local` is ignored by Git.
4. Run `bun run dev` and open `http://localhost:3000`.

Use `bun run build` and `bun run start` to run a local production build.

## Supabase setup

Run [`supabase/schema.sql`](supabase/schema.sql) in your Supabase project's SQL Editor. The server uses `SUPABASE_URL` and a server-only `SUPABASE_SECRET_KEY`. A legacy service role key also works under `SUPABASE_SERVICE_ROLE_KEY`. Keep this key out of browser code and `NEXT_PUBLIC_` variables.

The supplied `postgresql://` URL is a direct database connection template and still contains `[YOUR-PASSWORD]`. This app uses Supabase's HTTPS Data API, so it needs an API key instead of the database password.
