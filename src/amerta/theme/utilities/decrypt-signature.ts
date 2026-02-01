import crypto from "crypto";
import { ALGORITHM, SECRET_KEY } from "./sign-order";

/**
 * Verifies if the signature belongs to the order
 */
export function decryptSignature(providedSignature: string): string | null {
  try {
    // 1. Split IV and Data
    const textParts = providedSignature.split(":");
    if (textParts.length !== 2) return null;

    const iv = Buffer.from(textParts[0]!, "hex");
    const encryptedText = Buffer.from(textParts[1]!, "hex");

    const KEY = crypto.createHash("sha256").update(String(SECRET_KEY)).digest();
    // 2. Create Decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);

    // 3. Decrypt
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
  } catch (error) {
    console.error("Decryption error:", error);
    // Decryption failed (bad key or manipulated data)
    return null;
  }
}
