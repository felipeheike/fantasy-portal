import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, maskKey } from './security';

describe('encrypt/decrypt', () => {
  it('round-trips a plaintext string', () => {
    const plaintext = 'sk-test-1234567890';
    const encrypted = encrypt(plaintext);
    expect(encrypted).not.toBe(plaintext);
    expect(decrypt(encrypted)).toBe(plaintext);
  });

  it('uses a random IV, so encrypting the same value twice differs', () => {
    const a = encrypt('same-value');
    const b = encrypt('same-value');
    expect(a).not.toBe(b);
    expect(decrypt(a)).toBe('same-value');
    expect(decrypt(b)).toBe('same-value');
  });

  it('returns an empty string for empty input', () => {
    expect(encrypt('')).toBe('');
  });

  it('returns an empty string when decrypting malformed or empty input', () => {
    expect(decrypt('not-a-valid-ciphertext')).toBe('');
    expect(decrypt('')).toBe('');
  });
});

describe('maskKey', () => {
  it('masks the middle of a long key, keeping the first/last 4 chars', () => {
    expect(maskKey('sk-1234567890abcdef')).toBe('sk-1...cdef');
  });

  it('returns a generic mask for short or empty keys', () => {
    expect(maskKey('short')).toBe('****');
    expect(maskKey('')).toBe('****');
  });
});
