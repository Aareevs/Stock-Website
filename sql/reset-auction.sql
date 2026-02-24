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
    WHEN 'VELOCITY' THEN 1250.00
    WHEN 'APEXAUTO' THEN 850.00
    WHEN 'CRUISER' THEN 2150.00
    WHEN 'VITALIS' THEN 1650.00
    WHEN 'CAREPLUS' THEN 3400.00
    WHEN 'MEDISURG' THEN 920.00
    WHEN 'EDUNEXT' THEN 540.00
    WHEN 'SCHOLAR' THEN 890.00
    WHEN 'BRAINB' THEN 1120.00
    WHEN 'FRESHC' THEN 430.00
    WHEN 'SPICER' THEN 1750.00
    WHEN 'URBANB' THEN 220.00
    ELSE price
  END,
  change = 0,
  sentiment = 'Neutral',
  price_history = '[]';

SELECT 'Auction reset complete!' as status;
