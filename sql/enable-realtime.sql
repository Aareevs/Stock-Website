-- ===========================================
-- Enable Realtime for news_events and market_items
-- Run this AFTER schema.sql if realtime isn't working
-- ===========================================

-- Set REPLICA IDENTITY FULL so Realtime sends all columns
alter table news_events replica identity full;
alter table market_items replica identity full;

-- Re-add to realtime publication (safe to run multiple times)
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
