import crypto from "crypto";

export const ALGORITHM = "aes-256-cbc";
export const SECRET_KEY = process.env.ENCRYPTION_SECRET;

/**
 * Generates a signature for an order
 */
export function signOrder(orderIdString: string): string {
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const expiresAt = Date.now() + thirtyDays;

  // 3. Sign the data (ID + Expiration)
  const dataToSign = `${orderIdString}:${expiresAt}`;

  const iv = crypto.randomBytes(16);
  const KEY = crypto.createHash("sha256").update(String(process.env.ENCRYPTION_SECRET)).digest();
  // 2. Create Cipher
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  // 3. Encrypt
  let encrypted = cipher.update(dataToSign, "utf8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  // 4. Return IV:EncryptedData (Hex encoded for URL safety)
  // We need the IV later to decrypt, so we join it with a colon
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}
