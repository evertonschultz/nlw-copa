import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.CLIENT_ID!,
      clientSecret: process.env.CLIENT_SECRET!,
    }),
  ],
  secret: process.env.SECRET,
  callbacks: {
    async jwt({ token, user, account }: any) {
      if (account && user) {
        return {
          accessToken: account.access_token,
          accessTokenExpires: Date.now() + account.expires_at * 1000,
          user,
        }
      }
      return token
    },
    async session({ session, token }: any) {
      session.user = token.user
      session.accessToken = token.accessToken
      session.error = token.error

      return session
    },
  }
}

export default NextAuth(authOptions)