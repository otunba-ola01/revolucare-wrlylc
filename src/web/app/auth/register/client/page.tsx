import React from 'react'; // react ^18.2.0
import { Metadata } from 'next'; // next ^14.0.0

import { RegisterForm } from '../../../../components/auth/register-form'; // Import the registration form component
import { Roles } from '../../../../config/roles'; // Import role constants to pre-select the client role
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/card'; // Import card components for layout structure

/**
 * Metadata object for the client registration page
 */
export const metadata: Metadata = {
  title: 'Client Registration | Revolucare',
  description: 'Create your client account to access personalized care services and connect with providers.',
};

/**
 * Client registration page component that renders a registration form with the client role pre-selected
 */
const ClientRegistrationPage: React.FC = () => {
  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Client Account</CardTitle>
          <CardDescription>
            Enter your information to create a client account.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <RegisterForm defaultRole={Roles.CLIENT} redirectUrl="/dashboard" />
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientRegistrationPage;