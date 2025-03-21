import React from 'react'; // React ^18.2.0
import { Metadata } from 'next'; // Next.js metadata type for page metadata ^14.0.0

import { RegisterForm } from '../../../../components/auth/register-form'; // Import the registration form component
import { Roles } from '../../../../config/roles'; // Import role constants to pre-select the case manager role
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/card'; // Import card components for layout structure

/**
 * Metadata object for the case manager registration page
 */
export const metadata: Metadata = {
  title: 'Case Manager Registration | Revolucare',
  description: 'Create your case manager account to coordinate care services and manage client care plans.',
};

/**
 * Case manager registration page component that renders a registration form with the case manager role pre-selected
 */
const CaseManagerRegistrationPage: React.FC = () => {
  return (
    <Card className="w-[500px]">
      <CardHeader className="space-y-2">
        <CardTitle>Create Case Manager Account</CardTitle>
        <CardDescription>
          Enter your information to register as a case manager.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm defaultRole={Roles.CASE_MANAGER} redirectUrl="/dashboard/case-manager" />
      </CardContent>
    </Card>
  );
};

export default CaseManagerRegistrationPage;