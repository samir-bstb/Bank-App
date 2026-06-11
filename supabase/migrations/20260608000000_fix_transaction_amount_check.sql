-- The original transaction_amount_check used a session-variable guard
-- (current_setting) that prevented ALL inserts except from the original
-- seed function. Replace it with a plain positive-amount check so that
-- the transfer_funds RPC can insert rows normally.

ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transaction_amount_check;

ALTER TABLE public.transactions
  ADD CONSTRAINT transaction_amount_check CHECK (amount > 0);
