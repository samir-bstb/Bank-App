-- ACID-safe fund transfer using row-level locks.
-- Both accounts are locked in UUID order (smaller UUID first) to prevent
-- deadlocks when two concurrent transfers go in opposite directions.

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
  v_locked_count   INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Basic validations
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  IF p_sender_account_id = p_receiver_account_id THEN
    RAISE EXCEPTION 'self_transfer_not_allowed';
  END IF;

  -- Lock both active accounts in UUID order to avoid deadlocks.
  -- ORDER BY id ensures the same lock sequence regardless of transfer direction.
  SELECT COUNT(*) INTO v_locked_count
  FROM accounts
  WHERE id = ANY(ARRAY[p_sender_account_id, p_receiver_account_id])
    AND is_active = true
  ORDER BY id
  FOR UPDATE;

  IF v_locked_count < 2 THEN
    RAISE EXCEPTION 'account_not_found_or_inactive';
  END IF;

  -- Read sender balance after locking
  SELECT balance INTO v_sender_balance
  FROM accounts
  WHERE id = p_sender_account_id;

  IF v_sender_balance < p_amount THEN
    RAISE EXCEPTION 'insufficient_funds';
  END IF;

  -- Debit sender
  UPDATE accounts
  SET balance = balance - p_amount
  WHERE id = p_sender_account_id;

  -- Credit receiver
  UPDATE accounts
  SET balance = balance + p_amount
  WHERE id = p_receiver_account_id;

  -- Record the transaction
  INSERT INTO transactions (sender_account_id, receiver_account_id, amount, status)
  VALUES (p_sender_account_id, p_receiver_account_id, p_amount, 'completed')
  RETURNING id INTO v_transaction_id;

  -- Audit log
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
