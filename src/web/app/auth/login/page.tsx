import React from 'react'; // React v18.0+
import { Metadata } from 'next'; // Next.js v14.0+

import { LoginForm } from '../../../components/auth/login-form'; // { LoginForm }
import { siteConfig } from '../../../config/site'; // { siteConfig }

/**
 * Generates metadata for the login page
 * @returns {Metadata} Page metadata for SEO and browser display
 * @step Return metadata object with title, description, and other SEO properties
 */
export const metadata: Metadata = {
  title: `Sign In | Revolucare`,
  description: `Sign in to your Revolucare account to access care management services`,
  keywords: ['login', 'sign in', 'authentication', 'care management', 'Revolucare'],
  robots: 'noindex, nofollow',
};

/**
 * The login page component that renders the login form
 * @returns {JSX.Element} Rendered login page component
 * @step Render a container for the login page with appropriate styling
 * @step Render a heading for the login page
 * @step Render a description text explaining the login purpose
 * @step Render the LoginForm component for user authentication
 * @step The form handles submission, validation, and redirection after successful login
 */
const LoginPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <a
            href="/auth/register"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            create a new account
          </a>
        </p>
        <LoginForm className="mt-8 space-y-6" />
      </div>
    </div>
  );
};

export default LoginPage;