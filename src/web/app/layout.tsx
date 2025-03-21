import type { Metadata } from 'next' // next: ^13.4.1
import { Inter } from 'next/font/google' // next/font/google: ^13.4.1
import { siteConfig } from '../config/site' // src/web/config/site.ts
import { ThemeProvider } from '../lib/state/theme-provider' // src/web/lib/state/theme-provider.tsx
import { AuthProvider } from '../lib/state/auth-provider' // src/web/lib/state/auth-provider.tsx
import { NotificationProvider } from '../lib/state/notification-provider' // src/web/lib/state/notification-provider.tsx
import { CarePlanProvider } from '../lib/state/care-plan-provider' // src/web/lib/state/care-plan-provider.tsx
import { Toaster } from 'react-hot-toast' // react-hot-toast: ^2.4.1
import { authOptions } from '../lib/auth/auth-options' // src/web/lib/auth/auth-options.ts
import './globals.css' // src/web/app/globals.css
import { SessionProvider } from 'next-auth/react' // next-auth/react: ^4.22.1

// Inter font configuration with Latin subset and swap display strategy
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' })

// Metadata configuration for the application
export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [
    {
      name: 'Revolucare Team',
    },
  ],
  creator: 'Revolucare',
  publisher: 'Revolucare',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Revolucare',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: ['/images/twitter-image.jpg'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

/**
 * Root layout component that wraps all pages with global providers and styles
 */
interface RootLayoutProps {
  children: React.ReactNode
}
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Metadata for SEO */}
      </head>
      <body className="min-h-screen antialiased bg-background font-sans text-foreground">
        {/* Skip to content link for accessibility */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {/* SessionProvider for Next Auth session management */}
        <SessionProvider>
          {/* ThemeProvider for dark/light mode support */}
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* AuthProvider for authentication state */}
            <AuthProvider>
              {/* NotificationProvider for system notifications */}
              <NotificationProvider>
                {/* CarePlanProvider for care plan state management */}
                <CarePlanProvider>
                  <main id="main-content">
                    {children}
                  </main>
                </CarePlanProvider>
              </NotificationProvider>
            </AuthProvider>
            {/* Toaster component for toast notifications */}
            <Toaster />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}