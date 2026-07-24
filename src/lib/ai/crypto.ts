import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getKey(): Buffer {
  const secret = process.env.AI_KEYS_ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error('AI_KEYS_ENCRYPTION_SECRET não configurado. Gere com: openssl rand -base64 32');
  }
  return crypto.createHash('sha256').update(secret).digest();
}

export function encryptApiKey(plainText: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // formato: iv.authTag.ciphertext, tudo em base64
  return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join('.');
}

export function decryptApiKey(encoded: string): string {
  const [ivB64, authTagB64, dataB64] = encoded.split('.');
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('utf8');
}
