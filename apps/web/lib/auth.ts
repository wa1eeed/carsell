import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import logger from './logger'
import { AUTH } from './constants'

export type AuthUser = {
  id:         string
  email:      string
  name:       string
  role:       string
  showroomId: string
}

declare module 'next-auth' {
  interface Session { user: AuthUser }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id:         string
    role:       string
    showroomId: string
    // Timestamp used to re-validate showroomId from DB every N minutes
    checkedAt?: number
  }
}

/** How often (ms) to re-validate showroomId from DB — prevents stale tenant after reassignment */
const REVALIDATE_INTERVAL_MS = 5 * 60 * 1000  // 5 min

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: AUTH.ACCESS_TOKEN_MAX_AGE,
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null

        const user = await prisma.showroomUser.findUnique({
          where: { email: credentials.email },
        })
        if (!user || !user.isActive) return null

        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) {
          logger.warn({ email: credentials.email }, 'auth.login.invalid_password')
          return null
        }

        logger.info({ userId: user.id, email: user.email }, 'auth.login.success')
        return {
          id: user.id, email: user.email, name: user.name,
          role: user.role, showroomId: user.showroomId,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // First sign-in — set all fields
      if (user) {
        const u = user as AuthUser
        token.id         = u.id
        token.role       = u.role
        token.showroomId = u.showroomId
        token.checkedAt  = Date.now()
        return token
      }

      // Subsequent requests — re-validate showroomId from DB every 5 minutes
      // This prevents a user whose showroom was changed from using stale tenant data
      const now = Date.now()
      const lastCheck = token.checkedAt ?? 0
      if (now - lastCheck > REVALIDATE_INTERVAL_MS) {
        try {
          const dbUser = await prisma.showroomUser.findUnique({
            where: { id: token.id },
            select: { showroomId: true, role: true, isActive: true },
          })
          if (!dbUser || !dbUser.isActive) {
            // User deactivated — invalidate token
            logger.warn({ userId: token.id }, 'auth.jwt: user deactivated, invalidating token')
            return { ...token, showroomId: '', role: '' }
          }
          // Refresh showroomId and role from DB
          token.showroomId = dbUser.showroomId
          token.role       = dbUser.role
          token.checkedAt  = now
        } catch {
          // DB unreachable — keep existing token values (fail-open for availability)
        }
      }

      return token
    },

    async session({ session, token }) {
      // Guard: if token was invalidated above, session shows empty showroomId
      session.user = {
        id:         token.id,
        email:      token.email ?? '',
        name:       token.name ?? '',
        role:       token.role,
        showroomId: token.showroomId,
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error:  '/login',
  },
}
