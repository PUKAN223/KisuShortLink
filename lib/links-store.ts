import { env } from "cloudflare:workers";
import { desc, eq, sql } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";
import { getDb } from "../db";
import { links } from "../db/schema";

export type ShortLink = { slug: string; url: string; createdAt: number; clicks: number };
export class DuplicateSlugError extends Error {}

const defaultSupabaseUrl = "https://obtqazmecrxcrqrpjgsi.supabase.co";

function supabase() {
  const key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(env.SUPABASE_URL || defaultSupabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function fromSupabase(row: { slug: string; url: string; created_at: number; clicks: number }): ShortLink {
  return { slug: row.slug, url: row.url, createdAt: Number(row.created_at), clicks: Number(row.clicks) };
}

export async function listLinks(): Promise<ShortLink[]> {
  const client = supabase();
  if (client) {
    const { data, error } = await client.from("links").select("slug,url,created_at,clicks").order("created_at", { ascending: false }).limit(100);
    if (error) throw error;
    return (data || []).map(fromSupabase);
  }
  return getDb().select().from(links).orderBy(desc(links.createdAt)).limit(100);
}

export async function findLink(slug: string): Promise<ShortLink | null> {
  const client = supabase();
  if (client) {
    const { data, error } = await client.from("links").select("slug,url,created_at,clicks").eq("slug", slug).maybeSingle();
    if (error) throw error;
    return data ? fromSupabase(data) : null;
  }
  const [link] = await getDb().select().from(links).where(eq(links.slug, slug)).limit(1);
  return link || null;
}

export async function createLink(link: ShortLink): Promise<void> {
  const client = supabase();
  if (client) {
    const { error } = await client.from("links").insert({ slug: link.slug, url: link.url, created_at: link.createdAt, clicks: 0 });
    if (error?.code === "23505") throw new DuplicateSlugError();
    if (error) throw error;
    return;
  }
  try { await getDb().insert(links).values(link); }
  catch (error) {
    if (await findLink(link.slug)) throw new DuplicateSlugError();
    throw error;
  }
}

export async function deleteLink(slug: string): Promise<void> {
  const client = supabase();
  if (client) {
    const { error } = await client.from("links").delete().eq("slug", slug);
    if (error) throw error;
    return;
  }
  await getDb().delete(links).where(eq(links.slug, slug));
}

export async function countClick(slug: string): Promise<void> {
  const client = supabase();
  if (client) {
    const { error } = await client.rpc("increment_link_clicks", { target_slug: slug });
    if (error) throw error;
    return;
  }
  await getDb().update(links).set({ clicks: sql`${links.clicks} + 1` }).where(eq(links.slug, slug));
}
