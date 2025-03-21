import React from 'react'; // react ^18.2.0
import { Metadata } from 'next'; // next ^13.4.0
import Link from 'next/link'; // next/link ^13.4.0
import { PasswordResetForm } from '../../../components/auth/password-reset-form';
import { siteConfig } from '../../../config/site';

/**
 * Generates metadata for the forgot password page
 * @returns {Metadata} Page metadata object
 */
export const metadata: Metadata = {
  title: `Forgot Password | ${siteConfig.name}`,
  description: 'Reset your password to regain access to your Revolucare account',
};

/**
 * Renders the forgot password page with the password reset form
 * @returns {JSX.Element} The rendered forgot password page
 */
const ForgotPasswordPage: React.FC = () => {
  return (
    <div className="container relative flex flex-col items-center justify-center min-h-screen">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-semibold text-center">Forgot Password</h1>
        <p className="mt-4 text-gray-600 text-center">
          Enter your email address below and we'll send you instructions to reset
          your password.
        </p>
        <PasswordResetForm />
        <div className="mt-6 text-sm text-center">
          <Link href="/login" className="text-indigo-600 hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;