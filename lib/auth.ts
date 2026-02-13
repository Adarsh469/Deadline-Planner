import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const isDev = process.env.NODE_ENV === "development";

async function getOrCreateDevUser() {
  const email = process.env.DEV_USER_EMAIL ?? "dev@local";
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: "Dev User",
      },
    });
  }
  return user;
}

const providers: NextAuthOptions["providers"] = [];

if (!isDev && process.env.EMAIL_SERVER_HOST && process.env.EMAIL_FROM) {
  providers.push(
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    })
  );
}

if (isDev) {
  providers.push(
    CredentialsProvider({
      name: "Dev",
      credentials: {},
      async authorize() {
        const user = await getOrCreateDevUser();
        return user;
      },
    })
  );
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

export async function getAuthUserId() {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) return session.user.id;
  if (isDev) {
    const user = await getOrCreateDevUser();
    return user.id;
  }
  return null;
}
