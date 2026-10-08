import { createClient } from "@supabase/supabase-js";

export type ShortLink = { slug: string; url: string; createdAt: number; clicks: number };
export class DuplicateSlugError extends Error {}

function supabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Set SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function fromSupabase(row: { slug: string; url: string; created_at: number; clicks: number }): ShortLink {
  return { slug: row.slug, url: row.url, createdAt: Number(row.created_at), clicks: Number(row.clicks) };
}

export async function listLinks(): Promise<ShortLink[]> {
  const client = supabase();
  const { data, error } = await client.from("links").select("slug,url,created_at,clicks").order("created_at", { ascending: false }).limit(100);
  if (error) throw error;
  return (data || []).map(fromSupabase);
}

export async function findLink(slug: string): Promise<ShortLink | null> {
  const client = supabase();
  const { data, error } = await client.from("links").select("slug,url,created_at,clicks").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data ? fromSupabase(data) : null;
}

export async function createLink(link: ShortLink): Promise<void> {
  const client = supabase();
  const { error } = await client.from("links").insert({ slug: link.slug, url: link.url, created_at: link.createdAt, clicks: 0 });
  if (error?.code === "23505") throw new DuplicateSlugError();
  if (error) throw error;
}

export async function deleteLink(slug: string): Promise<void> {
  const client = supabase();
  const { error } = await client.from("links").delete().eq("slug", slug);
  if (error) throw error;
}

export async function countClick(slug: string): Promise<void> {
  const client = supabase();
  const { error } = await client.rpc("increment_link_clicks", { target_slug: slug });
  if (error) throw error;
}
