import crypto from 'crypto';
import { authenticator } from '@otplib/preset-default';
import QRCode from 'qrcode';

// A chave mestra deve ter 32 caracteres para aes-256
const ENCRYPTION_KEY = process.env.MASTER_ENCRYPTION_KEY || 'f4nt4sy-p0rt4l-m4st3r-k3y-32-ch4rs'; 
const IV_LENGTH = 16;

/**
 * Encrypts sensitive text (API Keys, MFA Secrets)
 */
export function encrypt(text: string): string {
  if (!text) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.substring(0, 32)), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Decrypts sensitive text
 */
export function decrypt(text: string): string {
  if (!text || !text.includes(':')) return '';
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.substring(0, 32)), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error('DECRYPTION_ERR:', error);
    return '';
  }
}

/**
 * Masks an API key for safe display
 */
export function maskKey(key: string): string {
  if (!key || key.length <= 8) return '****';
  return key.substring(0, 4) + '...' + key.substring(key.length - 4);
}

/**
 * Generates a new TOTP Secret for MFA
 */
export function generateMfaSecret(email: string) {
  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(email, 'Fantasy Portal', secret);
  return { secret, otpauth };
}

/**
 * Generates a QR Code data URL from an otpauth URI
 */
export async function generateQrCode(otpauth: string): Promise<string> {
  return QRCode.toDataURL(otpauth);
}

/**
 * Verifies a TOTP code
 */
export function verifyMfaCode(token: string, secret: string): boolean {
  return authenticator.check(token, secret);
}
