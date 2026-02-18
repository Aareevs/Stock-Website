-- ===========================================
-- VSX: Buy or Bail — Migration to Simple Auth
-- Run this in Supabase SQL Editor to enable simple username/password auth
-- ===========================================

-- Step 1: Add password column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password text;

-- Step 2: Remove the foreign key constraint to auth.users
-- First, let's drop the existing constraint if it exists
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Step 3: Update RLS policies to allow public inserts (for seeding)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Allow anyone to read profiles
CREATE POLICY "Anyone can read profiles"
  ON profiles FOR SELECT USING (true);

-- Allow anyone to update their own profile (based on matching ID in localStorage)
CREATE POLICY "Anyone can update profiles"
  ON profiles FOR UPDATE USING (true);

-- Allow inserts (for seeding)
CREATE POLICY "Allow inserts"
  ON profiles FOR INSERT WITH CHECK (true);

-- Step 4: Update portfolios RLS to work without auth.uid()
DROP POLICY IF EXISTS "Users can read own portfolio" ON portfolios;
DROP POLICY IF EXISTS "Users can update own portfolio" ON portfolios;
DROP POLICY IF EXISTS "Users can insert own portfolio" ON portfolios;

CREATE POLICY "Anyone can read portfolios"
  ON portfolios FOR SELECT USING (true);

CREATE POLICY "Anyone can insert portfolios"
  ON portfolios FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update portfolios"
  ON portfolios FOR UPDATE USING (true);

-- Step 5: Update transactions RLS
DROP POLICY IF EXISTS "Users can read own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;

CREATE POLICY "Anyone can read transactions"
  ON transactions FOR SELECT USING (true);

CREATE POLICY "Anyone can insert transactions"
  ON transactions FOR INSERT WITH CHECK (true);

-- Step 6: Update market_items RLS for admin operations
DROP POLICY IF EXISTS "Admins can update market" ON market_items;
DROP POLICY IF EXISTS "Admins can insert market" ON market_items;

CREATE POLICY "Anyone can update market"
  ON market_items FOR UPDATE USING (true);

CREATE POLICY "Anyone can insert market"
  ON market_items FOR INSERT WITH CHECK (true);

-- Step 7: Update news_events RLS
DROP POLICY IF EXISTS "Admins can insert news" ON news_events;
DROP POLICY IF EXISTS "Admins can update news" ON news_events;

CREATE POLICY "Anyone can insert news"
  ON news_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update news"
  ON news_events FOR UPDATE USING (true);
