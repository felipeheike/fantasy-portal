import { describe, it, expect } from 'vitest';
import { resolveLocalUsage } from './localGeneration';

describe('resolveLocalUsage', () => {
  it('uses cloud when the toggle is off, regardless of everything else', () => {
    expect(resolveLocalUsage({ enabled: false, hasOwnKey: false, localUrlConfigured: true })).toBe(false);
  });

  it('uses local when the toggle is on, the player has no own key, and the sidecar URL is configured', () => {
    expect(resolveLocalUsage({ enabled: true, hasOwnKey: false, localUrlConfigured: true })).toBe(true);
  });

  it('uses cloud when the player has their own key, even with the toggle on (BYOK always wins)', () => {
    expect(resolveLocalUsage({ enabled: true, hasOwnKey: true, localUrlConfigured: true })).toBe(false);
  });

  it('uses cloud when the toggle is on but no local server URL is configured', () => {
    expect(resolveLocalUsage({ enabled: true, hasOwnKey: false, localUrlConfigured: false })).toBe(false);
  });
});
