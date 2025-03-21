/**
 * Site Configuration
 *
 * Centralizes all site-wide configuration including metadata, branding,
 * contact information, social media links, and legal information
 */

/**
 * Main site configuration
 * Contains core information about the Revolucare platform
 */
export const siteConfig = {
  name: "Revolucare",
  description: "Next-generation care management platform designed to transform how care services are delivered, matched, and managed for individuals with disabilities.",
  url: "https://revolucare.com",
  ogImage: "/images/og-image.jpg",
  keywords: [
    "care management",
    "disability services",
    "healthcare platform",
    "care coordination",
    "provider matching",
    "personalized care",
    "AI healthcare",
    "service planning",
    "accessibility"
  ],
  authors: [
    {
      name: "Revolucare Healthcare Technologies",
      url: "https://revolucare.com/about/team",
    },
  ],
  creator: "Revolucare Healthcare Technologies, Inc."
}

/**
 * Important site links for navigation and legal compliance
 */
export const siteLinks = {
  home: "/",
  about: "/about",
  contact: "/contact",
  privacyPolicy: "/legal/privacy-policy",
  termsOfService: "/legal/terms-of-service",
  help: "/help",
  faq: "/faq",
}

/**
 * Contact information for support and communication
 */
export const contactInfo = {
  email: "support@revolucare.com",
  phone: "(555) 987-6543",
  address: {
    street: "123 Healthcare Avenue, Suite 200",
    city: "Springfield",
    state: "IL",
    zipCode: "62704",
    country: "United States"
  },
  supportHours: "Monday - Friday, 8:00 AM - 8:00 PM EST"
}

/**
 * Social media links for the platform
 */
export const socialLinks = {
  twitter: "https://twitter.com/revolucare",
  facebook: "https://facebook.com/revolucare",
  linkedin: "https://linkedin.com/company/revolucare",
  instagram: "https://instagram.com/revolucare",
  youtube: "https://youtube.com/c/revolucare"
}

/**
 * Logo paths for different contexts and devices
 */
export const logoConfig = {
  mainLogo: "/images/logos/revolucare-logo.svg",
  altLogo: "/images/logos/revolucare-logo-alt.svg",
  favicon: "/favicon.ico",
  mobileLogo: "/images/logos/revolucare-logo-mobile.svg"
}

/**
 * Copyright information for the platform
 */
export const copyrightInfo = {
  year: new Date().getFullYear(),
  company: "Revolucare Healthcare Technologies, Inc.",
  rights: "All Rights Reserved"
}

/**
 * Configuration for analytics and tracking tools
 */
export const analyticsConfig = {
  vercelAnalytics: true,
  googleAnalyticsId: "G-MEASUREMENT_ID", // Replace with actual GA ID in production
  hotjarId: "0000000" // Replace with actual Hotjar ID in production
}

/**
 * Configuration for user feedback collection
 */
export const feedbackConfig = {
  enabled: true,
  email: "feedback@revolucare.com",
  formUrl: "https://forms.revolucare.com/user-feedback"
}

/**
 * Configuration for customer support features
 */
export const supportConfig = {
  enabled: true,
  email: "support@revolucare.com",
  phone: "(555) 987-6543",
  chatEnabled: true,
  helpCenterUrl: "https://help.revolucare.com"
}