/**
 * Auth Options for NextAuth.js
 * 
 * This file defines the authentication configuration for the Revolucare platform,
 * including providers, callbacks, session management, and JWT handling.
 */

import { AuthOptions } from 'next-auth'; // next-auth: ^4.22.1
import CredentialsProvider from 'next-auth/providers/credentials'; // next-auth/providers/credentials: ^4.22.1
import GoogleProvider from 'next-auth/providers/google'; // next-auth/providers/google: ^4.22.1
import MicrosoftProvider from 'next-auth/providers/microsoft'; // next-auth/providers/microsoft: ^4.22.1
import { Roles, hasRole } from '../../config/roles';
import { login, refreshToken } from '../api/auth';

/**
 * NextAuth.js configuration options
 * Centralizes all authentication settings for the application
 */
export const authOptions: AuthOptions = {
  providers: [
    // Email/Password authentication provider
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Call the login API function to validate credentials
          const response = await login({
            email: credentials.email,
            password: credentials.password
          });

          // Return user with tokens for JWT creation
          if (response && response.accessToken) {
            return {
              ...response.user,
              accessToken: response.accessToken,
              refreshToken: response.refreshToken,
              expiresAt: Date.now() + response.expiresIn * 1000
            };
          }
          return null;
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      }
    }),
    
    // Google OAuth authentication provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    
    // Microsoft OAuth authentication provider
    MicrosoftProvider({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: process.env.MICROSOFT_TENANT_ID,
      authorization: {
        params: {
          prompt: "consent"
        }
      }
    })
  ],
  
  callbacks: {
    /**
     * JWT Callback
     * Handles token creation and updates, including token refresh when expired
     */
    async jwt({ token, user, account }) {
      // Initial sign in - add user data to token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.role = user.role;
        token.isVerified = user.isVerified;
        token.profileComplete = user.profileComplete;
        token.permissions = user.permissions || [];
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.expiresAt = user.expiresAt;
      }

      // Handle OAuth provider tokens
      if (account && (account.provider === 'google' || account.provider === 'microsoft')) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = Date.now() + (account.expires_in as number) * 1000;
      }

      // Return previous token if not expired
      const currentTime = Date.now();
      if (token.expiresAt && currentTime < (token.expiresAt as number)) {
        return token;
      }

      // Token has expired, attempt to refresh
      if (token.refreshToken) {
        try {
          const response = await refreshToken(token.refreshToken as string);
          
          if (response && response.accessToken) {
            // Update token with new credentials
            token.accessToken = response.accessToken;
            token.refreshToken = response.refreshToken;
            token.expiresAt = Date.now() + response.expiresIn * 1000;
            return token;
          }
        } catch (error) {
          console.error('Token refresh error:', error);
          // Clear token data on refresh failure to force re-authentication
          delete token.accessToken;
          delete token.refreshToken;
          delete token.expiresAt;
        }
      }

      return token;
    },
    
    /**
     * Session Callback
     * Transforms JWT token data into session data for the client
     */
    async session({ session, token }) {
      if (token) {
        // Add user data from token to session
        session.user = {
          id: token.id as string,
          email: token.email as string,
          firstName: token.firstName as string || '',
          lastName: token.lastName as string || '',
          role: token.role as Roles,
          isVerified: token.isVerified as boolean,
          profileComplete: token.profileComplete as boolean,
          permissions: token.permissions as string[] || [],
          createdAt: token.createdAt as string || new Date().toISOString(),
          updatedAt: token.updatedAt as string || new Date().toISOString()
        };
        
        // Add authentication tokens to session
        session.accessToken = token.accessToken as string;
        session.refreshToken = token.refreshToken as string;
        session.expiresAt = token.expiresAt as number;
      }
      return session;
    },
    
    /**
     * SignIn Callback
     * Validates sign-in attempts and manages user creation for OAuth
     */
    async signIn({ user, account, profile }) {
      // For credentials provider, authorization is already handled
      if (account?.provider === 'credentials') {
        return true;
      }
      
      // For OAuth providers (Google, Microsoft)
      if (account && (account.provider === 'google' || account.provider === 'microsoft')) {
        // Here we would typically call our API to verify if the user exists
        // and create a new user record if they don't
        
        // This would require additional backend implementation
        // For now, allowing all OAuth sign-ins
        return true;
      }
      
      return true;
    },
    
    /**
     * Redirect Callback
     * Customizes redirect URLs after authentication events
     */
    async redirect({ url, baseUrl }) {
      // Allow relative URLs or URLs on the same origin
      if (url.startsWith('/') || url.startsWith(baseUrl)) {
        return url;
      }
      
      // Default redirect to dashboard
      return `${baseUrl}/dashboard`;
    }
  },
  
  // Custom authentication pages
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
    verifyRequest: '/auth/verify',
    newUser: '/auth/register'
  },
  
  // Session configuration
  session: {
    strategy: 'jwt',
    maxAge: 15 * 60, // 15 minutes in seconds
    updateAge: 5 * 60, // 5 minutes in seconds
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 15 * 60, // 15 minutes in seconds
  },
  
  // Enable debug logs in development
  debug: process.env.NODE_ENV === 'development',
  
  // Security settings
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  }
};