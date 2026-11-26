/**
 * Decides whether an OIDC (Authentik) identity may sign in, and to which player.
 *
 * Policy (no auto-provisioning): only players that already exist in the portal can
 * sign in via SSO. The first SSO login links the identity to the player whose email
 * matches (the IdP must assert the email as verified); later logins match by subject.
 * Account status rules are the same as for password login. TOTP is intentionally not
 * part of this path: MFA is enforced by the identity provider.
 */

export interface OidcCandidatePlayer {
  id: string;
  email: string;
  oidcSubject: string | null;
  accountStatus: string;
  role: string;
}

export interface OidcLinkInput {
  subject: string | undefined;
  email: string | undefined;
  emailVerified: unknown;
  /** Player already linked to this subject, if any. */
  bySubject: OidcCandidatePlayer | null;
  /** Player whose email matches the IdP email (case-insensitive), if any. */
  byEmail: OidcCandidatePlayer | null;
}

export type OidcDenyReason =
  | "MISSING_SUBJECT"
  | "EMAIL_NOT_VERIFIED"
  | "NO_ACCOUNT"
  | "SUBJECT_MISMATCH"
  | "INACTIVE";

export type OidcLinkDecision =
  | { kind: "allow"; playerId: string; linkSubject: boolean }
  | { kind: "deny"; reason: OidcDenyReason };

function canSignIn(player: OidcCandidatePlayer): boolean {
  return player.accountStatus === "ACTIVE" || player.role === "ADMIN";
}

export function isEmailVerifiedClaim(value: unknown): boolean {
  return value === true || value === "true";
}

export function decideOidcLink(input: OidcLinkInput): OidcLinkDecision {
  if (!input.subject) return { kind: "deny", reason: "MISSING_SUBJECT" };

  if (input.bySubject) {
    if (!canSignIn(input.bySubject)) return { kind: "deny", reason: "INACTIVE" };
    return { kind: "allow", playerId: input.bySubject.id, linkSubject: false };
  }

  if (!input.email || !isEmailVerifiedClaim(input.emailVerified)) {
    return { kind: "deny", reason: "EMAIL_NOT_VERIFIED" };
  }

  const player = input.byEmail;
  if (!player) return { kind: "deny", reason: "NO_ACCOUNT" };

  // Already linked to a different SSO identity: never silently re-link.
  if (player.oidcSubject && player.oidcSubject !== input.subject) {
    return { kind: "deny", reason: "SUBJECT_MISMATCH" };
  }

  if (!canSignIn(player)) return { kind: "deny", reason: "INACTIVE" };

  return { kind: "allow", playerId: player.id, linkSubject: player.oidcSubject === null };
}
