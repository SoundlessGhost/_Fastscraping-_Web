import bcrypt from "bcryptjs";

const ROUNDS = 12;

export const hashPassword = (plain: string) => bcrypt.hash(plain, ROUNDS);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

export const PASSWORD_MIN = 8;

/** Returns a human message when the password is unacceptable, else null. */
export function passwordProblem(plain: string): string | null {
  if (plain.length < PASSWORD_MIN) {
    return `Password must be at least ${PASSWORD_MIN} characters.`;
  }
  if (!/[a-zA-Z]/.test(plain) || !/[0-9]/.test(plain)) {
    return "Password must include both letters and numbers.";
  }
  return null;
}
