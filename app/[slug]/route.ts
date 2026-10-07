import { countClick, findLink } from "../../lib/links-store";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const link = await findLink(slug);
  if (!link) return new Response("Link not found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  await countClick(slug);
  return Response.redirect(link.url, 302);
}
