// Add zod as a dependency before using these validators:
// pnpm --filter @bank-app/shared add zod

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isPositiveAmount(amount: number): boolean {
  return Number.isFinite(amount) && amount > 0;
}
