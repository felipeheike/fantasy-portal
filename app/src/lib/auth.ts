import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcrypt";
import { verifyMfaCode, decrypt } from "./security";

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
          role: player.role,
          accountStatus: player.accountStatus,
          forcePasswordChange: player.forcePasswordChange
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.accountStatus = (user as any).accountStatus;
        token.forcePasswordChange = (user as any).forcePasswordChange;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).accountStatus = token.accountStatus;
        (session.user as any).forcePasswordChange = token.forcePasswordChange;
      }
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
