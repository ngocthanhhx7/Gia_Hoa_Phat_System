import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { BUSINESS_RULES, MESSAGES } from "@/lib/constants";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // Google OAuth
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Email/password
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;

        // BR4: Check if account is locked
        if (user.lockedUntil && new Date() < new Date(user.lockedUntil)) {
          throw new Error(MESSAGES.MSG05);
        }

        const isValid = await compare(password, user.password);

        if (!isValid) {
          // Increment failed login count
          const newFailedCount = user.failedLogins + 1;
          const updateData: { failedLogins: number; lockedUntil?: Date } = {
            failedLogins: newFailedCount,
          };

          // BR3/BR4: Lock after MAX_FAILED_LOGINS attempts for 30 minutes
          if (newFailedCount >= BUSINESS_RULES.MAX_FAILED_LOGINS) {
            updateData.lockedUntil = new Date(
              Date.now() + BUSINESS_RULES.LOCK_DURATION_MINUTES * 60 * 1000
            );
          }

          await prisma.user.update({
            where: { id: user.id },
            data: updateData,
          });

          throw new Error(MESSAGES.MSG04);
        }

        // Reset failed login count on successful auth
        if (user.failedLogins > 0) {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLogins: 0, lockedUntil: null },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          image: user.avatar,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Handle Google OAuth: auto-create or link user in database
      if (account?.provider === "google" && user.email) {
        let dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!dbUser) {
          // Auto-create user on first Google sign-in
          dbUser = await prisma.user.create({
            data: {
              email: user.email,
              fullName: user.name || user.email.split("@")[0],
              avatar: user.image || null,
              role: "CUSTOMER",
              failedLogins: 0,
              // No password — Google-only account
            },
          });
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === "google" && user.email) {
          // Fetch DB user to get id and role for Google sign-in
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.address = dbUser.address;
            token.phone = dbUser.phone;
          }
        } else {
          // Credentials provider — fetch address/phone from DB
          token.id = user.id;
          token.role = (user as { role?: string }).role;
          if (user.id) {
            const dbUser = await prisma.user.findUnique({
              where: { id: user.id },
              select: { address: true, phone: true },
            });
            token.address = dbUser?.address;
            token.phone = dbUser?.phone;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        session.user.address = token.address as string | null;
        session.user.phone = token.phone as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET,
});
