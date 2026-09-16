import { describe, it, expect } from 'vitest';
import { generateToken, hashToken } from './shareToken';

describe('generateToken', () => {
  it('generates distinct tokens each call', () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(20);
  });
});

describe('hashToken', () => {
  it('is deterministic for the same input', () => {
    const token = generateToken();
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it('produces different hashes for different tokens', () => {
    expect(hashToken('a')).not.toBe(hashToken('b'));
  });

  it('does not return the raw token', () => {
    const token = generateToken();
    expect(hashToken(token)).not.toBe(token);
  });
});
