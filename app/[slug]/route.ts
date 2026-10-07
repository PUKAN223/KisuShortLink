import { eq, sql } from "drizzle-orm";
import { getDb } from "../../db";
import { links } from "../../db/schema";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = getDb();
  const [link] = await db.select().from(links).where(eq(links.slug, slug)).limit(1);
  if (!link) return new Response("Link not found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  await db.update(links).set({ clicks: sql`${links.clicks} + 1` }).where(eq(links.slug, slug));
  return Response.redirect(link.url, 302);
}
