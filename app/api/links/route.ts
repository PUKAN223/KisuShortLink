import { createLink, DuplicateSlugError, findLink, listLinks, type ShortLink } from "../../../lib/links-store";
import { SHORT_LINK_ORIGIN } from "../../../lib/site";

export async function GET() {
  try {
    return Response.json({ links: await listLinks() });
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
  if (parsed.origin === new URL(request.url).origin || parsed.origin === SHORT_LINK_ORIGIN) return Response.json({ error: "Choose a destination outside this site." }, { status: 400 });
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = alias || Array.from(crypto.getRandomValues(new Uint8Array(6)), n => alphabet[n % alphabet.length]).join("");
    if (await findLink(slug)) { if (alias) return Response.json({ error: "That alias is already taken." }, { status: 409 }); continue; }
    const link: ShortLink = { slug, url: parsed.href, createdAt: Date.now(), clicks: 0 };
    try { await createLink(link); return Response.json({ link }, { status: 201 }); }
    catch (error) {
      if (error instanceof DuplicateSlugError) {
        if (alias) return Response.json({ error: "That alias is already taken." }, { status: 409 });
        continue;
      }
      return Response.json({ error: "Could not save this link." }, { status: 500 });
    }
  }
  return Response.json({ error: "Could not create this link. Try again." }, { status: 500 });
}
