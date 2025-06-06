import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * Hash a password using MD5 for test environment (faster) or bcrypt for production (secure)
 */
export async function hashPassword(password: string): Promise<string> {
  return process.env.NODE_ENV === "test"
    ? crypto.createHash("md5").update(password).digest("hex")
    : await bcrypt.hash(password, 12);
}

/**
 * Verify a password against a stored hash using MD5 for test environment or bcrypt for production
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  return process.env.NODE_ENV === "test"
    ? crypto.createHash("md5").update(password).digest("hex") === storedHash
    : await bcrypt.compare(password, storedHash);
}
