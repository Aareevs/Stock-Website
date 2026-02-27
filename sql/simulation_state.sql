-- ===========================================
-- VSX: Global Simulation Timer State
-- Run this in the Supabase SQL Editor
-- ===========================================

-- Drop old table if it exists (start fresh)
drop table if exists simulation_state;

create table simulation_state (
  id integer primary key check (id = 1),
  status text not null default 'idle' check (status in ('idle', 'running', 'paused')),
  elapsed_seconds integer not null default 0,
  last_started_at timestamptz,
  updated_at timestamptz default now()
);

-- Insert the global single row
insert into simulation_state (id, status, elapsed_seconds)
values (1, 'idle', 0);

-- Enable row level security
alter table simulation_state enable row level security;

-- Anyone can READ
drop policy if exists "Anyone can read simulation state" on simulation_state;
create policy "Anyone can read simulation state"
  on simulation_state for select using (true);

-- Anyone authenticated can UPDATE (it's a single utility row)
drop policy if exists "Admins can update simulation state" on simulation_state;
drop policy if exists "Anyone can update simulation state" on simulation_state;
create policy "Anyone can update simulation state"
  on simulation_state for update using (true);

-- Enable realtime
alter table simulation_state replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'simulation_state'
  ) then
    alter publication supabase_realtime add table simulation_state;
  end if;
end $$;
