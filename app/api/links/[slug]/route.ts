import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { links } from "../../../../db/schema";

export async function DELETE(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await getDb().delete(links).where(eq(links.slug, slug));
  return Response.json({ ok: true });
}
