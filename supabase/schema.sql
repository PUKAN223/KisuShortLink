create table if not exists public.links (
  slug text primary key check (slug ~ '^[A-Za-z0-9_-]{3,32}$'),
  url text not null,
  created_at bigint not null,
  clicks bigint not null default 0
);

alter table public.links enable row level security;
revoke all on public.links from anon, authenticated;
grant select, insert, update, delete on public.links to service_role;

create or replace function public.increment_link_clicks(target_slug text)
returns void
language sql
security invoker
as $$
  update public.links set clicks = clicks + 1 where slug = target_slug;
$$;

revoke execute on function public.increment_link_clicks(text) from public, anon, authenticated;
grant execute on function public.increment_link_clicks(text) to service_role;
