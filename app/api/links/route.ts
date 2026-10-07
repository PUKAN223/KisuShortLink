import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { links } from "../../../db/schema";

export async function GET() {
  try {
    const rows = await getDb().select().from(links).orderBy(desc(links.createdAt)).limit(100);
    return Response.json({ links: rows });
  } catch { return Response.json({ error: "Could not load links." }, { status: 500 }); }
}

const reserved = new Set(["api", "_next", "favicon.ico", "robots.txt", "sitemap.xml"]);
export async function POST(request: Request) {
  let payload: unknown;
  try { payload = await request.json(); } catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }
  const { url, alias } = (payload ?? {}) as { url?: unknown; alias?: unknown };
  if (typeof url !== "string" || url.length > 2048) return Response.json({ error: "Enter a URL under 2048 characters." }, { status: 400 });
  let parsed: URL;
  try { parsed = new URL(url); } catch { return Response.json({ error: "Enter a valid URL." }, { status: 400 }); }
  if (!["http:", "https:"].includes(parsed.protocol)) return Response.json({ error: "Only http and https URLs are supported." }, { status: 400 });
  if (typeof alias !== "string" || (alias && !/^[A-Za-z0-9_-]{3,32}$/.test(alias))) return Response.json({ error: "Alias must be 3–32 letters, numbers, dashes or underscores." }, { status: 400 });
  if (alias && reserved.has(alias.toLowerCase())) return Response.json({ error: "That alias is reserved." }, { status: 400 });
  if (parsed.origin === new URL(request.url).origin) return Response.json({ error: "Choose a destination outside this site." }, { status: 400 });
  const db = getDb();
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = alias || Array.from(crypto.getRandomValues(new Uint8Array(6)), n => alphabet[n % alphabet.length]).join("");
    const existing = await db.select({ slug: links.slug }).from(links).where(eq(links.slug, slug)).limit(1);
    if (existing.length) { if (alias) return Response.json({ error: "That alias is already taken." }, { status: 409 }); continue; }
    const link = { slug, url: parsed.href, createdAt: Date.now(), clicks: 0 };
    try { await db.insert(links).values(link); return Response.json({ link }, { status: 201 }); }
    catch { if (alias) return Response.json({ error: "That alias is already taken." }, { status: 409 }); }
  }
  return Response.json({ error: "Could not create this link. Try again." }, { status: 500 });
}
