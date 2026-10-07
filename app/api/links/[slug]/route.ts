import { deleteLink } from "../../../../lib/links-store";

export async function DELETE(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await deleteLink(slug);
  return Response.json({ ok: true });
}
