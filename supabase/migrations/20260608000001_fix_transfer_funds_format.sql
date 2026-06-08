-- PostgreSQL format() does not support %.2f — only %s, %I, %L.
-- Use to_char() to format the numeric amount in the log description.

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
    'Transfer of ' || to_char(p_amount, 'FM999999999990.00') ||
    ' from account ' || p_sender_account_id ||
    ' to account ' || p_receiver_account_id
  );

  RETURN json_build_object(
    'transaction_id', v_transaction_id,
    'status',         'completed',
    'amount',         p_amount
  );
END;
$$;
