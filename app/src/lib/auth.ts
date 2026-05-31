import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Senha", type: "password" }
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

        return {
          id: player.id,
          email: player.email,
          name: player.name,
          role: player.role,
          accountStatus: player.accountStatus
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
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).accountStatus = token.accountStatus;
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
