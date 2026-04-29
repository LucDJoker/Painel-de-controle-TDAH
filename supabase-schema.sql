create table if not exists public.app_states (
    user_id text primary key,
    payload jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default now()
);
alter table public.app_states enable row level security;
do $$ begin if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
        and tablename = 'app_states'
        and policyname = 'allow all for authenticated users'
) then create policy "allow all for authenticated users" on public.app_states for all to authenticated using (true) with check (true);
end if;
end $$;