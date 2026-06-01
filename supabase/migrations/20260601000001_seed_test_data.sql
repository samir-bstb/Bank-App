-- Seed data for local development and testing.
-- Passwords (bcrypt, 10 rounds):
--   admin  → Admin1234!  (role: admin)
--   alice  → Alice1234!  (role: client)
--   bob    → Bob1234!    (role: client)
--
-- Constraints discovered in remote schema:
--   users.role                CHECK IN ('admin', 'client')
--   accounts.user_id          UNIQUE (1 account per user)
--   accounts.account_number   bpchar(16) — exactly 16 digits
--   transactions              INSERT blocked by transaction_amount_check;
--                             use the transfer endpoint to seed transactions.

-- ── Users ─────────────────────────────────────────────────────────────────

INSERT INTO users (id, username, password_hash, role, failed_attempts, is_blocked)
VALUES
  (
    'a0000000-0000-0000-0000-000000000001',
    'admin',
    '$2b$10$mSCwwZ1yvzPQ7Nbo.G.5SuhjhlWQx7KpFR8N5lSoKQkw7oRXf5Qg6',
    'admin',
    0,
    false
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    'alice',
    '$2b$10$aTxIk0pcf6a8UEEytOWy9u3/ny1gysaYGpVILvF4rFjsh9BR9ZZ02',
    'client',
    0,
    false
  ),
  (
    'a0000000-0000-0000-0000-000000000003',
    'bob',
    '$2b$10$8.8FwTAwjfMUPWYWaMtKQ.hLYPV04HratcxojFIcCHt6iuruSlnnS',
    'client',
    0,
    false
  )
ON CONFLICT (id) DO NOTHING;

-- ── Accounts (1 per user) ─────────────────────────────────────────────────

INSERT INTO accounts (id, user_id, account_number, balance, is_active)
VALUES
  (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000002',
    '1000000000000001',
    5000.00,
    true
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000003',
    '1000000000000002',
    3000.00,
    true
  )
ON CONFLICT (id) DO NOTHING;

-- ── Login logs ────────────────────────────────────────────────────────────

INSERT INTO logs (user_id, event_type, description)
VALUES
  (
    'a0000000-0000-0000-0000-000000000002',
    'login_success',
    'User alice logged in'
  ),
  (
    'a0000000-0000-0000-0000-000000000003',
    'login_success',
    'User bob logged in'
  );
