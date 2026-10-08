# Kisux3 Links

> A personal short URL manager with automatic QR codes, per-link QR customization, and Supabase storage.

## <img src="https://api.iconify.design/lucide:sparkles.svg?color=%23ffffff" width="20" height="20" valign="middle"> Overview

Kisux3 Links creates short URLs under `https://kisux3.xyz/`. Each link appears in a recent links list with a QR code that can be styled and downloaded as a PNG.

The app uses Next.js for the interface and API routes. Link records live in Supabase. QR codes are generated in the browser, and their style settings are saved in that browser.

---

## <img src="https://api.iconify.design/lucide:layers-3.svg?color=%23ffffff" width="20" height="20" valign="middle"> Features

### <img src="https://api.iconify.design/lucide:link-2.svg?color=%23ffffff" width="18" height="18" valign="middle"> Short Links

* Shorten HTTP and HTTPS URLs
* Use an optional custom alias of 3–32 letters, numbers, dashes, or underscores
* Copy a new link from its confirmation toast or from the recent links list
* Open, refresh, and delete recent links
* See the click count for each link

Short URLs follow this format:

```text
https://kisux3.xyz/<slug>
```

### <img src="https://api.iconify.design/lucide:qr-code.svg?color=%23ffffff" width="18" height="18" valign="middle"> QR Codes

Every recent link gets a QR preview automatically. Open **QR settings** on a link to customize it:

* Classic, rounded, or dot style
* Code and background colors
* Optional center image from a PNG, JPG, or WebP file
* Live preview and 640 × 640 PNG download

QR codes use high error correction. The editor checks color contrast and limits the center image size, but you should scan a customized code before sharing it.

QR settings, including the processed center image, are stored in browser storage for each link. They do not sync between devices.

---

## <img src="https://api.iconify.design/lucide:network.svg?color=%23ffffff" width="20" height="20" valign="middle"> Architecture

```text
Browser
  |-- Next.js interface
  |     +-- QR preview and PNG generation
  |     +-- Browser storage for QR settings
  |
  +-- Next.js API routes
        +-- Supabase Data API
              +-- PostgreSQL links table
```

The server handles link creation, listing, deletion, redirects, and click counting. The Supabase secret key stays in the server environment.

---

## <img src="https://api.iconify.design/lucide:cpu.svg?color=%23ffffff" width="20" height="20" valign="middle"> Tech Stack

| Technology | Purpose |
| ---------- | ------- |
| Next.js 16 | Web application and API routes |
| React 19 | Interface |
| TypeScript | Type checking |
| Supabase | Link storage through its Data API |
| PostgreSQL | `links` table and click counter |
| `qrcode` | QR matrix generation |
| Canvas API | QR styling, center images, and PNG export |
| Lucide React | Icons |
| CSS | Dark theme and responsive layout |
| Bun | Dependency installation and scripts |

---

## <img src="https://api.iconify.design/lucide:database.svg?color=%23ffffff" width="20" height="20" valign="middle"> Database

The Supabase schema is in [`supabase/schema.sql`](supabase/schema.sql). Its `public.links` table contains:

| Column | Purpose |
| ------ | ------- |
| `slug` | Unique short-link path |
| `url` | Destination URL |
| `created_at` | Creation time in milliseconds |
| `clicks` | Redirect count |

The `increment_link_clicks` function increments the count when a short URL is opened. QR style settings are stored in the browser rather than in this table.

---

## <img src="https://api.iconify.design/lucide:folder-tree.svg?color=%23ffffff" width="20" height="20" valign="middle"> Project Structure

```text
KisuShortLink/
|-- app/
|   |-- api/links/       # Create, list, and delete links
|   |-- [slug]/          # Redirect short URLs
|   |-- page.tsx         # Link creation and recent links
|   +-- globals.css      # Dark theme and responsive styles
|-- components/
|   +-- recent-link.tsx  # QR preview and per-link settings
|-- lib/
|   |-- links-store.ts   # Supabase access
|   |-- qr-render.ts     # QR drawing and PNG export
|   +-- site.ts          # Short-link domain
|-- public/
|-- supabase/
|   +-- schema.sql
|-- .env.example
|-- package.json
+-- README.md
```

---

## <img src="https://api.iconify.design/lucide:rocket.svg?color=%23ffffff" width="20" height="20" valign="middle"> Getting Started

### Requirements

* Node.js 22.13 or newer
* Bun
* A Supabase project

### Clone and Install

```bash
git clone https://github.com/PUKAN223/KisuShortLink.git
cd KisuShortLink
bun install
```

### Environment Variables

Copy the example file and add your Supabase server secret:

```bash
cp .env.example .env.local
```

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your_supabase_secret_key
```

The project URL is already filled in within `.env.example`; replace it if you use another Supabase project. A legacy service role key can be supplied as `SUPABASE_SERVICE_ROLE_KEY` instead. Keep either key out of `NEXT_PUBLIC_` variables and browser code. `.env.local` is ignored by Git.

### Database Setup

Run [`supabase/schema.sql`](supabase/schema.sql) in your Supabase project's SQL Editor. The app uses Supabase's HTTPS Data API, so the direct PostgreSQL connection password is not used by the app.

### Development

```bash
bun run dev
```

Open `http://localhost:3000`. The interface runs locally, while generated short links still use `https://kisux3.xyz/<slug>`.

---

## <img src="https://api.iconify.design/lucide:terminal.svg?color=%23ffffff" width="20" height="20" valign="middle"> Scripts

| Command | Purpose |
| ------- | ------- |
| `bun run dev` | Start the local development server |
| `bun run build` | Create a production build |
| `bun run start` | Serve the production build locally |
| `bun run lint` | Run ESLint |

---

## <img src="https://api.iconify.design/lucide:lock-keyhole.svg?color=%23ffffff" width="20" height="20" valign="middle"> Security

Supabase access uses a server-side secret key. The schema enables row-level security and does not grant direct table access to anonymous or authenticated Supabase clients.

The app's own `/api/links` routes currently have no user authentication. Anyone who can reach the app can create and delete links. Add access control before exposing link management publicly.

---

## <img src="https://api.iconify.design/lucide:cloud-upload.svg?color=%23ffffff" width="20" height="20" valign="middle"> Deployment

Deploy the Next.js app to a Node.js host, set `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in the host's server environment, and point `kisux3.xyz` to that deployment. The domain used for generated links is defined in [`lib/site.ts`](lib/site.ts).

Public short links need the `[slug]` route to be reachable at `https://kisux3.xyz/<slug>`. Review the access control note above before making the management interface public.

---

## <img src="https://api.iconify.design/lucide:scale.svg?color=%23ffffff" width="20" height="20" valign="middle"> License

No license file is included in this repository.
