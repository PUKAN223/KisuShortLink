# Kisu Link

A personal URL shortener and QR code workspace built with Next.js App Router. The hosted build uses Vinext to run the Next.js routes on Sites.

## Supabase setup

1. Run [`supabase/schema.sql`](supabase/schema.sql) in your Supabase project's SQL Editor.
2. Add `SUPABASE_SECRET_KEY` as a **secret** environment variable for the Site. Use a current `sb_secret_...` key from Supabase **Settings → API Keys**. A legacy service role key also works under `SUPABASE_SERVICE_ROLE_KEY`. Never use a browser or `NEXT_PUBLIC_` variable for this key.
3. `SUPABASE_URL` is configured for `https://obtqazmecrxcrqrpjgsi.supabase.co`. The same key names are shown in [`.env.example`](.env.example) for local setup.

The supplied `postgresql://` URL is a direct database connection template and still contains `[YOUR-PASSWORD]`. Sites uses Supabase's HTTPS Data API, so it needs an API key instead of the database password. Until the secret key is set, this Site keeps using its existing D1 store. The existing store currently has no links to migrate.

## Local development

Use Node.js 22 or newer and run `bun install`, then `bun run dev`. The hosted build is `bun run build`.
