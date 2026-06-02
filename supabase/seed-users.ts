/**
 * Seed script — creates test users in Supabase Auth and their bank accounts.
 *
 * The on_auth_user_created trigger automatically syncs each auth user to public.users.
 * Run this script once after applying all migrations:
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx supabase/seed-users.ts
 *
 * Or, if you have a .env.local in apps/web:
 *
 *   cd apps/web && pnpm seed
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const ACCOUNT_NUMBER_LENGTH = 16;

function randomAccountNumber(): string {
  return Array.from({ length: ACCOUNT_NUMBER_LENGTH }, () =>
    Math.floor(Math.random() * 10),
  ).join('');
}

const SEED_USERS = [
  { username: 'admin', password: 'Admin1234!', role: 'admin' as const, balance: null },
  { username: 'alice', password: 'Alice1234!', role: 'client' as const, balance: 5000 },
  { username: 'bob',   password: 'Bob1234!',   role: 'client' as const, balance: 3000 },
];

async function main() {
  console.log('🌱  Seeding Supabase Auth users...\n');

  for (const u of SEED_USERS) {
    const email = `${u.username}@bankapp.internal`;

    // Create the auth user (trigger syncs profile to public.users)
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password: u.password,
      email_confirm: true,
      app_metadata: { role: u.role },
      user_metadata: { username: u.username },
    });

    if (authErr) {
      if (authErr.message.includes('already registered')) {
        console.log(`  ⚠️  ${u.username} already exists in Auth, skipping`);
        continue;
      }
      console.error(`  ✗  ${u.username}:`, authErr.message);
      continue;
    }

    const userId = authData.user.id;
    console.log(`  ✓  ${u.username} (${u.role}) → auth id: ${userId}`);

    // The INSERT trigger may not see app_metadata.role yet (Supabase sets it
    // in a subsequent UPDATE). Ensure the role is correct in public.users.
    if (u.role !== 'client') {
      await supabase.from('users').update({ role: u.role }).eq('id', userId);
    }

    // Create a bank account for client users
    if (u.balance !== null) {
      const { error: accErr } = await supabase.from('accounts').insert({
        user_id: userId,
        account_number: randomAccountNumber(),
        balance: u.balance,
        is_active: true,
      });

      if (accErr) {
        console.error(`     ✗ account for ${u.username}:`, accErr.message);
      } else {
        console.log(`     ✓ account created — balance: ${u.balance}`);
      }
    }
  }

  console.log('\n✅  Done. Users in public.users:');
  const { data: users } = await supabase
    .from('users')
    .select('id, username, role')
    .order('username');
  console.table(users);
}

main().catch(console.error);
