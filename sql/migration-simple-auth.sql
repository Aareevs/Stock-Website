-- ===========================================
-- VSX: Buy or Bail — Migration to Simple Auth
-- Run this in Supabase SQL Editor to enable simple username/password auth
-- ===========================================

-- Step 1: Add password column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password text;

-- Step 2: Remove the foreign key constraint to auth.users
-- First, let's drop the existing constraint if it exists
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Step 3: Update RLS policies to allow public access (since we're not using auth.uid())
-- PROFILES
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can update profiles" ON profiles;
DROP POLICY IF EXISTS "Allow inserts" ON profiles;

CREATE POLICY "Anyone can read profiles"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Anyone can update profiles"
  ON profiles FOR UPDATE USING (true);

CREATE POLICY "Allow inserts"
  ON profiles FOR INSERT WITH CHECK (true);

-- PORTFOLIOS
DROP POLICY IF EXISTS "Users can read own portfolio" ON portfolios;
DROP POLICY IF EXISTS "Users can update own portfolio" ON portfolios;
DROP POLICY IF EXISTS "Users can insert portfolio" ON portfolios;
DROP POLICY IF EXISTS "Users can delete own portfolio" ON portfolios;
DROP POLICY IF EXISTS "Anyone can read portfolios" ON portfolios;
DROP POLICY IF EXISTS "Anyone can insert portfolios" ON portfolios;
DROP POLICY IF EXISTS "Anyone can update portfolios" ON portfolios;
DROP POLICY IF EXISTS "Anyone can delete portfolios" ON portfolios;

CREATE POLICY "Anyone can read portfolios"
  ON portfolios FOR SELECT USING (true);

CREATE POLICY "Anyone can insert portfolios"
  ON portfolios FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update portfolios"
  ON portfolios FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete portfolios"
  ON portfolios FOR DELETE USING (true);

-- TRANSACTIONS
DROP POLICY IF EXISTS "Users can read own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert transactions" ON transactions;
DROP POLICY IF EXISTS "Anyone can read transactions" ON transactions;
DROP POLICY IF EXISTS "Anyone can insert transactions" ON transactions;
DROP POLICY IF EXISTS "Anyone can delete transactions" ON transactions;

CREATE POLICY "Anyone can read transactions"
  ON transactions FOR SELECT USING (true);

CREATE POLICY "Anyone can insert transactions"
  ON transactions FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete transactions"
  ON transactions FOR DELETE USING (true);

-- MARKET_ITEMS
DROP POLICY IF EXISTS "Anyone can read market" ON market_items;
DROP POLICY IF EXISTS "Admins can update market" ON market_items;
DROP POLICY IF EXISTS "Admins can insert market" ON market_items;
DROP POLICY IF EXISTS "Anyone can update market" ON market_items;
DROP POLICY IF EXISTS "Anyone can insert market" ON market_items;

CREATE POLICY "Anyone can read market"
  ON market_items FOR SELECT USING (true);

CREATE POLICY "Anyone can update market"
  ON market_items FOR UPDATE USING (true);

CREATE POLICY "Anyone can insert market"
  ON market_items FOR INSERT WITH CHECK (true);

-- NEWS_EVENTS
DROP POLICY IF EXISTS "Anyone can read news" ON news_events;
DROP POLICY IF EXISTS "Admins can insert news" ON news_events;
DROP POLICY IF EXISTS "Admins can update news" ON news_events;
DROP POLICY IF EXISTS "Anyone can insert news" ON news_events;
DROP POLICY IF EXISTS "Anyone can update news" ON news_events;
DROP POLICY IF EXISTS "Anyone can delete news" ON news_events;

CREATE POLICY "Anyone can read news"
  ON news_events FOR SELECT USING (true);

CREATE POLICY "Anyone can insert news"
  ON news_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update news"
  ON news_events FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete news"
  ON news_events FOR DELETE USING (true);

-- Step 4: Make sure market data exists
INSERT INTO market_items (symbol, name, price, sentiment, icon) VALUES
  ('RADIANCE', 'Radiance Industries', 2450.00, 'Bullish', 'R'),
  ('TCS', 'Tantra Consultancy', 3480.00, 'Bullish', 'T'),
  ('HDFCBANK', 'Horizon Bank', 1650.00, 'Neutral', 'H'),
  ('INFY', 'InfyTech Solutions', 1420.00, 'Bullish', 'I'),
  ('ITC', 'IndoTobacco Corp', 440.00, 'Neutral', 'I'),
  ('SBIN', 'Suvarna Bank of India', 620.00, 'Bullish', 'S'),
  ('BHARTIARTL', 'Bharat AirLink', 1180.00, 'Bullish', 'B'),
  ('HINDUNILVR', 'Hindva UniProducts', 2520.00, 'Neutral', 'H'),
  ('KOTAKBANK', 'Kalpana Mahindra Bank', 1780.00, 'Neutral', 'K'),
  ('LT', 'Lakshya & Turbo', 3200.00, 'Bullish', 'L'),
  ('AXISBANK', 'Akshar Bank', 1050.00, 'Neutral', 'A'),
  ('TATAMOTORS', 'Triveni Motors', 680.00, 'Bearish', 'T')
ON CONFLICT (symbol) DO NOTHING;

-- Verify
SELECT 'Migration complete! Market items count:' as status, count(*) as count FROM market_items;
