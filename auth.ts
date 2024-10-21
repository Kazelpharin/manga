import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { UserRole } from "@prisma/client";

import { authConfig } from "./auth.config";
import { prisma } from "@/lib/db";
import { getUserById } from "@/lib/user";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      username: string | null;
      email: string | null;
      image: string | null;
    }
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      if (!token.sub) return token;

      const dbUser = await getUserById(token.sub);

      if (!dbUser) return token;

      token.username = dbUser.username || null;
      token.email = dbUser.email || null;
      token.picture = dbUser.profileImage || null;
      token.role = dbUser.role;

      return token;
    },
    async session({ token, session }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.username = token.name || null;
        session.user.email = token.email || '';
        session.user.image = token.picture as string | null;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
});