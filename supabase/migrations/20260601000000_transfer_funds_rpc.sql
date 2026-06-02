-- ACID-safe fund transfer.
-- Locks both account rows individually in UUID order to prevent deadlocks.
-- Using separate FOR UPDATE selects instead of COUNT(*)+FOR UPDATE
-- (PostgreSQL does not allow FOR UPDATE with aggregate functions).

CREATE OR REPLACE FUNCTION transfer_funds(
  p_sender_account_id   UUID,
  p_receiver_account_id UUID,
  p_amount              NUMERIC,
  p_user_id             UUID
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_sender_balance NUMERIC;
  v_transaction_id UUID;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  IF p_sender_account_id = p_receiver_account_id THEN
    RAISE EXCEPTION 'self_transfer_not_allowed';
  END IF;

  -- Lock both rows in UUID order to prevent deadlocks under concurrent transfers.
  IF p_sender_account_id < p_receiver_account_id THEN
    SELECT balance INTO v_sender_balance
    FROM accounts WHERE id = p_sender_account_id AND is_active = true FOR UPDATE;

    IF NOT FOUND THEN RAISE EXCEPTION 'account_not_found_or_inactive'; END IF;

    PERFORM id FROM accounts WHERE id = p_receiver_account_id AND is_active = true FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'account_not_found_or_inactive'; END IF;
  ELSE
    PERFORM id FROM accounts WHERE id = p_receiver_account_id AND is_active = true FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'account_not_found_or_inactive'; END IF;

    SELECT balance INTO v_sender_balance
    FROM accounts WHERE id = p_sender_account_id AND is_active = true FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'account_not_found_or_inactive'; END IF;
  END IF;

  IF v_sender_balance < p_amount THEN
    RAISE EXCEPTION 'insufficient_funds';
  END IF;

  UPDATE accounts SET balance = balance - p_amount WHERE id = p_sender_account_id;
  UPDATE accounts SET balance = balance + p_amount WHERE id = p_receiver_account_id;

  INSERT INTO transactions (sender_account_id, receiver_account_id, amount, status)
  VALUES (p_sender_account_id, p_receiver_account_id, p_amount, 'completed')
  RETURNING id INTO v_transaction_id;

  INSERT INTO logs (user_id, event_type, description)
  VALUES (
    p_user_id,
    'transfer',
    format(
      'Transfer of %.2f from account %s to account %s',
      p_amount,
      p_sender_account_id,
      p_receiver_account_id
    )
  );

  RETURN json_build_object(
    'transaction_id', v_transaction_id,
    'status',         'completed',
    'amount',         p_amount
  );
END;
$$;
