import { jwtVerify, type JWTPayload } from 'jose';

const secret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET!);

export interface SupabaseJwtPayload extends JWTPayload {
  sub: string;
  app_metadata: { role?: string };
  user_metadata: { username?: string };
}

export async function verifySupabaseToken(token: string): Promise<SupabaseJwtPayload> {
  const { payload } = await jwtVerify(token, secret);
  return payload as SupabaseJwtPayload;
}
