-- ===========================================
-- VSX: Buy or Bail — Supabase Schema
-- Safe to re-run (idempotent)
-- ===========================================

-- ─── Profiles ───
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  role text not null default 'participant' check (role in ('admin', 'participant')),
  cash_balance numeric not null default 100000,
  starting_capital numeric not null default 100000,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

drop policy if exists "Anyone can read profiles" on profiles;
create policy "Anyone can read profiles"
  on profiles for select using (true);

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on profiles;
create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- ─── Market Items ───
create table if not exists market_items (
  symbol text primary key,
  name text not null,
  price numeric not null,
  change numeric not null default 0,
  sentiment text not null default 'Neutral',
  icon text not null default '',
  price_history jsonb not null default '[]',
  updated_at timestamptz default now()
);

alter table market_items enable row level security;

drop policy if exists "Anyone can read market" on market_items;
create policy "Anyone can read market"
  on market_items for select using (true);

drop policy if exists "Admins can update market" on market_items;
create policy "Admins can update market"
  on market_items for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─── News Events ───
create table if not exists news_events (
  id uuid primary key default gen_random_uuid(),
  headline text not null,
  crash_company text not null,
  crash_percent numeric not null,
  boost_companies text[] not null default '{}',
  boost_percent numeric not null,
  active boolean not null default true,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

alter table news_events enable row level security;

drop policy if exists "Anyone can read news" on news_events;
create policy "Anyone can read news"
  on news_events for select using (true);

drop policy if exists "Admins can insert news" on news_events;
create policy "Admins can insert news"
  on news_events for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Admins can update news" on news_events;
create policy "Admins can update news"
  on news_events for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─── Portfolios ───
create table if not exists portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  symbol text not null,
  amount integer not null default 0,
  avg_price numeric not null default 0,
  unique(user_id, symbol)
);

alter table portfolios enable row level security;

drop policy if exists "Users can read own portfolio" on portfolios;
create policy "Users can read own portfolio"
  on portfolios for select using (auth.uid() = user_id);

drop policy if exists "Users can insert portfolio" on portfolios;
create policy "Users can insert portfolio"
  on portfolios for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own portfolio" on portfolios;
create policy "Users can update own portfolio"
  on portfolios for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own portfolio" on portfolios;
create policy "Users can delete own portfolio"
  on portfolios for delete using (auth.uid() = user_id);

-- ─── Transactions ───
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  symbol text not null,
  asset_name text not null,
  type text not null check (type in ('BUY', 'SELL')),
  quantity integer not null,
  price numeric not null,
  purchase_price numeric,
  profit_loss numeric,
  created_at timestamptz default now()
);

alter table transactions enable row level security;

drop policy if exists "Users can read own transactions" on transactions;
create policy "Users can read own transactions"
  on transactions for select using (auth.uid() = user_id);

drop policy if exists "Users can insert transactions" on transactions;
create policy "Users can insert transactions"
  on transactions for insert with check (auth.uid() = user_id);

-- ─── Seed Market Data ───
insert into market_items (symbol, name, price, sentiment, icon) values
  -- Automobile Sector
  ('VELOCITY', 'Velocity Auto', 1250.00, 'Bullish', 'V'),
  ('APEXAUTO', 'Apex Automotive', 850.00, 'Neutral', 'A'),
  ('CRUISER', 'Cruiser Dynamics', 2150.00, 'Bullish', 'C'),

  -- Health Sector
  ('VITALIS', 'Vitalis Health', 1650.00, 'Bullish', 'V'),
  ('CAREPLUS', 'CarePlus Hospitals', 3400.00, 'Neutral', 'C'),
  ('MEDISURG', 'Medisurge Pharma', 920.00, 'Bearish', 'M'),

  -- EdTech Sector
  ('EDUNEXT', 'EduNext', 540.00, 'Neutral', 'E'),
  ('SCHOLAR', 'ScholarStream', 890.00, 'Bullish', 'S'),
  ('BRAINB', 'BrainBoost', 1120.00, 'Bearish', 'B'),

  -- Food Sector
  ('FRESHC', 'FreshCrave Foods', 430.00, 'Neutral', 'F'),
  ('SPICER', 'SpiceRoute Dining', 1750.00, 'Bullish', 'S'),
  ('URBANB', 'UrbanBites', 220.00, 'Bullish', 'U')
on conflict (symbol) do nothing;

-- ─── Auto-create profile on signup ───
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Check if profile already exists before inserting
  -- This prevents duplicate profile creation if trigger fires unexpectedly
  if not exists (select 1 from public.profiles where id = new.id) then
    insert into public.profiles (id, username, display_name, role)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
      coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
      coalesce(new.raw_user_meta_data->>'role', 'participant')
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Enable Realtime ───
alter table news_events replica identity full;
alter table market_items replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'news_events'
  ) then
    alter publication supabase_realtime add table news_events;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'market_items'
  ) then
    alter publication supabase_realtime add table market_items;
  end if;
end $$;
