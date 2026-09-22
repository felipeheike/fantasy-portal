import { describe, it, expect } from 'vitest';
import { resolveLocalUsage } from './localGeneration';

describe('resolveLocalUsage', () => {
  it('uses cloud when the toggle is off, regardless of everything else', () => {
    expect(resolveLocalUsage({ enabled: false, hasOwnKey: false, localUrlConfigured: true, isAdmin: false })).toBe(false);
  });

  it('uses local when the toggle is on, the player has no own key, and the sidecar URL is configured', () => {
    expect(resolveLocalUsage({ enabled: true, hasOwnKey: false, localUrlConfigured: true, isAdmin: false })).toBe(true);
  });

  it('uses cloud when a regular player has their own key, even with the toggle on (BYOK always wins)', () => {
    expect(resolveLocalUsage({ enabled: true, hasOwnKey: true, localUrlConfigured: true, isAdmin: false })).toBe(false);
  });

  it('uses cloud when the toggle is on but no local server URL is configured', () => {
    expect(resolveLocalUsage({ enabled: true, hasOwnKey: false, localUrlConfigured: false, isAdmin: false })).toBe(false);
  });

  it('uses local for an admin even with their own key, as long as the toggle is on (no separate override needed)', () => {
    expect(resolveLocalUsage({ enabled: true, hasOwnKey: true, localUrlConfigured: true, isAdmin: true })).toBe(true);
  });

  it('still uses cloud for an admin when the toggle itself is off', () => {
    expect(resolveLocalUsage({ enabled: false, hasOwnKey: true, localUrlConfigured: true, isAdmin: true })).toBe(false);
  });
});
