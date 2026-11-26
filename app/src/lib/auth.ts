import { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import AuthentikProvider from "next-auth/providers/authentik";
import { prisma } from "./prisma";
import bcrypt from "bcrypt";
import { verifyMfaCode, decrypt } from "./security";
import { decideOidcLink } from "./auth/oidcLink";
import { logger } from "./logger";
import { PlayerRole, PlayerAccountStatus } from "@/types/auth";

// SSO is optional: only enabled when all three env vars are present, so dev/other
// environments keep working with password login alone.
// AUTHENTIK_ISSUER must NOT end with "/" (next-auth appends "/.well-known/...").
const authentikEnabled = Boolean(
  process.env.AUTHENTIK_ISSUER && process.env.AUTHENTIK_CLIENT_ID && process.env.AUTHENTIK_CLIENT_SECRET
);

const playerSelect = { id: true, email: true, oidcSubject: true, accountStatus: true, role: true } as const;

export const authOptions: NextAuthOptions = {
  providers: [
    ...(authentikEnabled
      ? [
          AuthentikProvider({
            issuer: process.env.AUTHENTIK_ISSUER!.replace(/\/+$/, ""),
            clientId: process.env.AUTHENTIK_CLIENT_ID!,
            clientSecret: process.env.AUTHENTIK_CLIENT_SECRET!,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Senha", type: "password" },
        mfaToken: { label: "Código MFA", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const player = await prisma.player.findUnique({
          where: { email: credentials.email }
        });

        if (!player || !player.passwordHash) return null;

        const isPasswordValid = await bcrypt.compare(credentials.password, player.passwordHash);
        if (!isPasswordValid) return null;

        // Check account status
        if (player.accountStatus !== 'ACTIVE' && player.role !== 'ADMIN') {
          throw new Error("Sua conta está aguardando aprovação ou está inativa.");
        }

        // --- Multi-Factor Authentication (MFA) Check ---
        if (player.mfaEnabled) {
          if (!credentials.mfaToken) {
            // Signal to frontend that MFA is required
            throw new Error("MFA_REQUIRED");
          }

          const decryptedSecret = decrypt(player.mfaSecret || '');
          const isMfaValid = verifyMfaCode(credentials.mfaToken, decryptedSecret);

          if (!isMfaValid) {
            throw new Error("Código MFA inválido. Tente novamente.");
          }
        }

        return {
          id: player.id,
          email: player.email,
          name: player.name,
          role: player.role as PlayerRole,
          accountStatus: player.accountStatus as PlayerAccountStatus,
          forcePasswordChange: player.forcePasswordChange
        };
      }
    })
  ],
  callbacks: {
    // Password login is fully handled (incl. TOTP) in authorize(). This only gates SSO:
    // existing players only, linked by verified email on first login, no TOTP here.
    async signIn({ account, profile }) {
      if (account?.provider !== "authentik") return true;

      const claims = (profile ?? {}) as { sub?: string; email?: string; email_verified?: unknown };
      const subject = claims.sub ?? account.providerAccountId;

      const [bySubject, byEmail] = await Promise.all([
        subject ? prisma.player.findUnique({ where: { oidcSubject: subject }, select: playerSelect }) : null,
        claims.email
          ? prisma.player.findFirst({
              where: { email: { equals: claims.email, mode: "insensitive" } },
              select: playerSelect,
            })
          : null,
      ]);

      const decision = decideOidcLink({
        subject,
        email: claims.email,
        emailVerified: claims.email_verified,
        bySubject,
        byEmail,
      });

      if (decision.kind === "deny") {
        logger.warn(`[auth] OIDC sign-in denied: ${decision.reason}`);
        return `/login?error=${decision.reason}`;
      }

      if (decision.linkSubject) {
        await prisma.player.update({ where: { id: decision.playerId }, data: { oidcSubject: subject } });
        logger.log(`[auth] OIDC identity linked to player ${decision.playerId}`);
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (account?.provider === "authentik") {
        // `user` here is the IdP profile (id = sub); load the real player instead.
        const player = await prisma.player.findUnique({ where: { oidcSubject: account.providerAccountId } });
        if (player) {
          token.id = player.id;
          token.role = player.role as PlayerRole;
          token.accountStatus = player.accountStatus as PlayerAccountStatus;
          // Password rotation doesn't apply to SSO sessions.
          token.forcePasswordChange = false;
          token.authMethod = "oidc";
        }
        return token;
      }
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.accountStatus = user.accountStatus;
        token.forcePasswordChange = user.forcePasswordChange;
        token.authMethod = "credentials";
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.accountStatus = token.accountStatus;
      session.user.forcePasswordChange = token.forcePasswordChange;
      session.user.authMethod = token.authMethod;
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

/**
 * Server-side helper for API routes: returns the typed session user,
 * or null if there is no active session. Replaces the repeated
 * `getServerSession(authOptions)` + `session.user` pattern.
 */
export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

export function isAdmin(user: { role: PlayerRole } | null): boolean {
  return user?.role === "ADMIN";
}
