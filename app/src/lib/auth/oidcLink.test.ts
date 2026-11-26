import { describe, it, expect } from "vitest";
import { decideOidcLink, isEmailVerifiedClaim, type OidcCandidatePlayer } from "./oidcLink";

const player = (over: Partial<OidcCandidatePlayer> = {}): OidcCandidatePlayer => ({
  id: "p1",
  email: "hero@example.com",
  oidcSubject: null,
  accountStatus: "ACTIVE",
  role: "PLAYER",
  ...over,
});

const base = {
  subject: "sub-123",
  email: "hero@example.com",
  emailVerified: true,
  bySubject: null,
  byEmail: null,
};

describe("decideOidcLink", () => {
  it("denies when the IdP sends no subject", () => {
    expect(decideOidcLink({ ...base, subject: undefined })).toEqual({ kind: "deny", reason: "MISSING_SUBJECT" });
  });

  it("allows an already-linked player without re-linking", () => {
    const p = player({ oidcSubject: "sub-123" });
    expect(decideOidcLink({ ...base, bySubject: p })).toEqual({ kind: "allow", playerId: "p1", linkSubject: false });
  });

  it("still enforces account status for already-linked players", () => {
    const p = player({ oidcSubject: "sub-123", accountStatus: "PENDING" });
    expect(decideOidcLink({ ...base, bySubject: p })).toEqual({ kind: "deny", reason: "INACTIVE" });
  });

  it("links on first login when the email matches and is verified", () => {
    expect(decideOidcLink({ ...base, byEmail: player() })).toEqual({ kind: "allow", playerId: "p1", linkSubject: true });
  });

  it("refuses to link when the email is not verified", () => {
    expect(decideOidcLink({ ...base, emailVerified: false, byEmail: player() })).toEqual({
      kind: "deny",
      reason: "EMAIL_NOT_VERIFIED",
    });
  });

  it("does not create accounts for unknown emails (no auto-provisioning)", () => {
    expect(decideOidcLink({ ...base, byEmail: null })).toEqual({ kind: "deny", reason: "NO_ACCOUNT" });
  });

  it("never re-links a player already bound to another SSO identity", () => {
    const p = player({ oidcSubject: "someone-else" });
    expect(decideOidcLink({ ...base, byEmail: p })).toEqual({ kind: "deny", reason: "SUBJECT_MISMATCH" });
  });

  it("blocks pending players but lets admins through", () => {
    expect(decideOidcLink({ ...base, byEmail: player({ accountStatus: "PENDING" }) })).toEqual({
      kind: "deny",
      reason: "INACTIVE",
    });
    expect(decideOidcLink({ ...base, byEmail: player({ accountStatus: "PENDING", role: "ADMIN" }) })).toMatchObject({
      kind: "allow",
    });
  });
});

describe("isEmailVerifiedClaim", () => {
  it("accepts boolean and string true only", () => {
    expect(isEmailVerifiedClaim(true)).toBe(true);
    expect(isEmailVerifiedClaim("true")).toBe(true);
    expect(isEmailVerifiedClaim(false)).toBe(false);
    expect(isEmailVerifiedClaim(undefined)).toBe(false);
    expect(isEmailVerifiedClaim("yes")).toBe(false);
  });
});
