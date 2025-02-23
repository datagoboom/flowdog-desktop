import crypto from 'crypto';
import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16;

async function getOrCreateKey() {
  const keyPath = path.join(app.getPath('userData'), '.key');
  
  try {
    // Try to read existing key
    const keyBuffer = await fs.readFile(keyPath);
    return keyBuffer;
  } catch (error) {
    // If key doesn't exist, create a new one
    const key = crypto.randomBytes(KEY_LENGTH);
    await fs.writeFile(keyPath, key);
    return key;
  }
}

export async function encrypt(text) {
  if (!text) return text;
  
  try {
    const key = await getOrCreateKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    // Combine IV, encrypted data, and auth tag
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

export async function decrypt(text) {
  if (!text) return text;
  
  try {
    const [ivHex, authTagHex, encryptedHex] = text.split(':');
    if (!ivHex || !authTagHex || !encryptedHex) {
      throw new Error('Invalid encrypted data format');
    }

    const key = await getOrCreateKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    if (error.code === 'ERR_OSSL_BAD_DECRYPT') {
      // Return null if decryption fails due to invalid data
      return null;
    }
    throw error;
  }
} 