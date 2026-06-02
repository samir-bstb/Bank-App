import { jwtVerify, createRemoteJWKSet, type JWTPayload } from 'jose';

// Supabase signs JWTs with ES256 (asymmetric). The public keys are served at
// the JWKS endpoint and cached by jose — no extra env variable needed.
const JWKS = createRemoteJWKSet(
  new URL(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/.well-known/jwks.json`),
);

export interface SupabaseJwtPayload extends JWTPayload {
  sub: string;
  app_metadata: { role?: string };
  user_metadata: { username?: string };
}

export async function verifySupabaseToken(token: string): Promise<SupabaseJwtPayload> {
  const { payload } = await jwtVerify(token, JWKS);
  return payload as SupabaseJwtPayload;
}
