-- ===========================================
-- VSX: Buy or Bail — Reset Auction
-- Resets all participant balances, clears portfolios and transactions
-- ===========================================

-- Reset all participant cash balances to starting capital
UPDATE profiles 
SET cash_balance = 100000, starting_capital = 100000 
WHERE role = 'participant';

-- Clear all portfolios
DELETE FROM portfolios;

-- Clear all transactions
DELETE FROM transactions;

-- Deactivate all news events
UPDATE news_events SET active = false;

-- Reset market prices to initial values
UPDATE market_items SET 
  price = CASE symbol
    WHEN 'RADIANCE' THEN 2450.00
    WHEN 'TCS' THEN 3480.00
    WHEN 'HDFCBANK' THEN 1650.00
    WHEN 'INFY' THEN 1420.00
    WHEN 'ITC' THEN 440.00
    WHEN 'SBIN' THEN 620.00
    WHEN 'BHARTIARTL' THEN 1180.00
    WHEN 'HINDUNILVR' THEN 2520.00
    WHEN 'KOTAKBANK' THEN 1780.00
    WHEN 'LT' THEN 3200.00
    WHEN 'AXISBANK' THEN 1050.00
    WHEN 'TATAMOTORS' THEN 680.00
    ELSE price
  END,
  change = 0,
  sentiment = 'Neutral',
  price_history = '[]';

SELECT 'Auction reset complete!' as status;
