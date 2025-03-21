import React from 'react'; // react ^18.2.0
import { Metadata } from 'next'; // next ^14.0.0

import { RegisterForm } from '../../../../components/auth/register-form'; // src/web/components/auth/register-form.tsx
import { Roles } from '../../../../config/roles'; // src/web/config/roles.ts
import { PageContainer } from '../../../../components/layout/page-container'; // src/web/components/layout/page-container.tsx

/**
 * Metadata for the provider registration page
 */
export const metadata: Metadata = {
  title: 'Provider Registration | Revolucare',
  description:
    'Register as a healthcare provider on the Revolucare platform to offer your services to clients with disabilities.',
};

/**
 * ProviderRegistrationPage Component
 *
 * This component renders the provider registration page, pre-selecting the provider role.
 * It uses the RegisterForm component and configures it to redirect to the provider dashboard
 * after successful registration.
 */
const ProviderRegistrationPage: React.FC = () => {
  return (
    <PageContainer>
      <h1 className="text-2xl font-semibold mb-4">Provider Registration</h1>
      <RegisterForm
        defaultRole={Roles.PROVIDER}
        redirectUrl="/dashboard/provider"
      />
    </PageContainer>
  );
};

export default ProviderRegistrationPage;