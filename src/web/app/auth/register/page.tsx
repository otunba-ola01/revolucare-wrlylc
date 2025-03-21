import React from 'react'; // react ^18.2.0
import { Metadata } from 'next'; // next ^14.0.0
import Link from 'next/link'; // next/link ^14.0.0

import { RegisterForm } from '../../../components/auth/register-form'; // src/web/components/auth/register-form.tsx
import { siteConfig } from '../../../config/site'; // src/web/config/site.ts
import { Roles, RoleLabels } from '../../../config/roles'; // src/web/config/roles.ts

/**
 * Generates metadata for the registration page
 * @returns Page metadata for SEO and browser display
 */
export const metadata: Metadata = {
  title: siteConfig.name + ' | Register',
  description: siteConfig.description,
  keywords: ['register', 'sign up', 'create account', 'care management', 'revolucare'],
  robots: 'noindex, nofollow',
};

/**
 * The main registration page component that provides role selection options or renders the general registration form
 * @returns Rendered registration page component
 */
const RegisterPage: React.FC = () => {
  return (
    // Container for the registration page with appropriate styling
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      {/* Content area with a maximum width */}
      <div className="w-full max-w-md space-y-8">
        {/* Heading for the registration page */}
        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
          Create your account
        </h2>
        {/* Description text explaining the registration purpose */}
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in to your existing account
          </Link>
        </p>
        {/* Role selection cards for different user types (Client, Provider, Case Manager) */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Object.entries(RoleLabels).map(([role, label]) => (
            <Link key={role} href={`/auth/register/${role.toLowerCase()}`} passHref>
              <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                {/* Placeholder for role icon - replace with actual icon components */}
                <div className="w-12 h-12 text-indigo-600 mb-4">
                    {/* Placeholder for Icon */}
                </div>
                <h3 className="text-lg font-medium text-gray-900">{label}</h3>
                <p className="mt-2 text-sm text-gray-500 text-center">
                  {/* Placeholder for role description - replace with actual descriptions */}
                  {role === Roles.CLIENT && 'Register as a client to find and receive care services'}
                  {role === Roles.PROVIDER && 'Register as a provider to offer care services'}
                  {role === Roles.CASE_MANAGER && 'Register as a case manager to coordinate care'}
                </p>
              </div>
            </Link>
          ))}
        </div>
        {/* Alternatively, render the RegisterForm component for a general registration flow */}
        {/* Include a link to the login page for users who already have an account */}
        <div className="mt-4 text-center text-sm text-gray-600">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;