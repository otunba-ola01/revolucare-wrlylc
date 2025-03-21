import React from 'react'; // React ^18.2.0
import { Metadata } from 'next'; // next ^14.0.0

import { RegisterForm } from '../../../../components/auth/register-form'; // src/web/components/auth/register-form.tsx
import { siteConfig } from '../../../../config/site'; // src/web/config/site.ts
import { Roles } from '../../../../config/roles'; // src/web/config/roles.ts

/**
 * Generates metadata for the administrator registration page
 * @returns {Metadata} Page metadata for SEO and browser display
 */
export const metadata: Metadata = {
  title: `Administrator Registration | ${siteConfig.name}`,
  description: siteConfig.description,
  keywords: ['administrator', 'register', 'sign up', 'create account', 'care management', 'Revolucare'],
  robots: 'noindex, nofollow',
};

/**
 * The administrator registration page component that renders the registration form with the administrator role pre-selected
 * @returns {JSX.Element} Rendered administrator registration page component
 */
const AdministratorRegisterPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
          Administrator Registration
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Create your administrator account for the Revolucare platform to manage the care management system
        </p>
        <RegisterForm defaultRole={Roles.ADMINISTRATOR} redirectUrl="/dashboard" />
      </div>
    </div>
  );
};

export default AdministratorRegisterPage;