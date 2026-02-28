-- ===========================================
-- VSX: Atomic Trade Execution Function
-- Prevents race conditions (negative balance/holdings)
-- ===========================================

CREATE OR REPLACE FUNCTION public.execute_trade(
  p_user_id UUID,
  p_symbol TEXT,
  p_asset_name TEXT,
  p_type TEXT, -- 'BUY' or 'SELL'
  p_quantity INT,
  p_price NUMERIC
) RETURNS JSONB AS $$
DECLARE
  v_balance NUMERIC;
  v_total_cost NUMERIC;
  v_current_amount INT;
  v_current_avg NUMERIC;
  v_new_amount INT;
  v_new_avg NUMERIC;
  v_profit_loss NUMERIC;
  v_portfolio_id UUID;
BEGIN
  -- 1. Validate inputs
  IF p_quantity <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quantity must be greater than zero');
  END IF;

  v_total_cost := p_quantity * p_price;

  -- 2. Lock the user's profile to prevent concurrent modifications (race conditions)
  SELECT cash_balance INTO v_balance
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
  END IF;

  -- 3. Lock the user's portfolio for this specific stock
  SELECT id, amount, avg_price INTO v_portfolio_id, v_current_amount, v_current_avg
  FROM public.portfolios
  WHERE user_id = p_user_id AND symbol = p_symbol
  FOR UPDATE;

  -- Initialize values if portfolio row doesn't exist yet
  IF NOT FOUND THEN
    v_current_amount := 0;
    v_current_avg := 0;
  END IF;

  -- 4. Execute BUY Logic
  IF p_type = 'BUY' THEN
    IF v_total_cost > v_balance THEN
      RETURN jsonb_build_object('success', false, 'error', 'Insufficient funds');
    END IF;

    -- Update Cash Balance
    UPDATE public.profiles
    SET cash_balance = cash_balance - v_total_cost
    WHERE id = p_user_id;

    -- Calculate new holdings & average price
    v_new_amount := v_current_amount + p_quantity;
    
    IF v_current_amount = 0 THEN
      v_new_avg := p_price;
      -- Insert new portfolio record
      INSERT INTO public.portfolios (user_id, symbol, amount, avg_price)
      VALUES (p_user_id, p_symbol, v_new_amount, v_new_avg);
    ELSE
      v_new_avg := round(((v_current_amount * v_current_avg) + v_total_cost) / v_new_amount, 2);
      -- Update existing portfolio record
      UPDATE public.portfolios
      SET amount = v_new_amount, avg_price = v_new_avg
      WHERE id = v_portfolio_id;
    END IF;

    -- Log transaction
    INSERT INTO public.transactions (user_id, symbol, asset_name, type, quantity, price)
    VALUES (p_user_id, p_symbol, p_asset_name, 'BUY', p_quantity, p_price);

    RETURN jsonb_build_object('success', true);

  -- 5. Execute SELL Logic
  ELSIF p_type = 'SELL' THEN
    IF v_current_amount < p_quantity THEN
      RETURN jsonb_build_object('success', false, 'error', 'Not enough shares');
    END IF;

    -- Update Cash Balance
    UPDATE public.profiles
    SET cash_balance = cash_balance + v_total_cost
    WHERE id = p_user_id;

    -- Calculate new holdings
    v_new_amount := v_current_amount - p_quantity;
    v_profit_loss := round((p_price - v_current_avg) * p_quantity, 2);

    IF v_new_amount = 0 THEN
      -- Delete portfolio record if sold all shares
      DELETE FROM public.portfolios WHERE id = v_portfolio_id;
    ELSE
      -- Update existing portfolio record
      UPDATE public.portfolios
      SET amount = v_new_amount
      WHERE id = v_portfolio_id;
    END IF;

    -- Log transaction
    INSERT INTO public.transactions (user_id, symbol, asset_name, type, quantity, price, purchase_price, profit_loss)
    VALUES (p_user_id, p_symbol, p_asset_name, 'SELL', p_quantity, p_price, v_current_avg, v_profit_loss);

    RETURN jsonb_build_object('success', true);

  -- 6. Invalid Type
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid transaction type');
  END IF;

EXCEPTION WHEN OTHERS THEN
  -- Catch any unexpected database errors and rollback automatically
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
