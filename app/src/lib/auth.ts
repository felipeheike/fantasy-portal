import { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcrypt";
import { verifyMfaCode, decrypt } from "./security";
import { PlayerRole, PlayerAccountStatus } from "@/types/auth";

export const authOptions: NextAuthOptions = {
  providers: [
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.accountStatus = user.accountStatus;
        token.forcePasswordChange = user.forcePasswordChange;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.accountStatus = token.accountStatus;
      session.user.forcePasswordChange = token.forcePasswordChange;
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
