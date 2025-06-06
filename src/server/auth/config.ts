import { type DefaultSession, type NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import "next-auth/jwt";
import { verifyPassword } from "@/lib/password-utils";
import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { env } from "@/env";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      firstName?: string;
      lastName?: string;
      isSuperuser?: boolean;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    firstName?: string;
    lastName?: string;
    isSuperuser?: boolean;
    // ...other properties
    // role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    firstName?: string;
    lastName?: string;
    isSuperuser?: boolean;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  secret: env.AUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        try {
          const user = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (user.length === 0) {
            return null;
          }

          const foundUser = user[0];
          if (!foundUser?.password) {
            return null;
          }

          const isValidPassword = await verifyPassword(
            password,
            foundUser.password,
          );

          if (!isValidPassword) {
            return null;
          }

          return {
            id: foundUser.id,
            email: foundUser.email,
            name: `${foundUser.firstName ?? ""} ${foundUser.lastName ?? ""}`.trim(),
            firstName: foundUser.firstName ?? undefined,
            lastName: foundUser.lastName ?? undefined,
            isSuperuser: foundUser.isSuperuser,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user?.id) {
        token.id = user.id;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.isSuperuser = user.isSuperuser;
      }
      return token;
    },
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.id,
        firstName: token.firstName,
        lastName: token.lastName,
        isSuperuser: token.isSuperuser,
      },
    }),
  },
} satisfies NextAuthConfig;
