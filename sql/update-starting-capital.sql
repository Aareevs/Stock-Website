-- ===========================================
-- VSX: Buy or Bail — Update Starting Capital
-- Changes starting capital from ₹10 Crore to ₹1 Lakh (100,000)
-- Run this in Supabase SQL Editor
-- ===========================================

-- Update all profiles to new starting capital
UPDATE profiles 
SET cash_balance = 100000, starting_capital = 100000;

-- Update default value in schema (for new users)
ALTER TABLE profiles ALTER COLUMN cash_balance SET DEFAULT 100000;
ALTER TABLE profiles ALTER COLUMN starting_capital SET DEFAULT 100000;

SELECT 'Updated ' || count(*) || ' profiles to ₹1 Lakh starting capital' as status FROM profiles;
