import { Metadata } from 'next' // ^14.0.0
import { CheckCircle } from 'lucide-react' // ^0.284.0
import { useSearchParams } from 'next/navigation' // ^14.0.0

import { VerificationForm } from '../../../components/auth/verification-form'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card'

/**
 * Generates metadata for the verification page
 * @returns Page metadata including title and description
 */
export const generateMetadata = (): Metadata => {
  // Return metadata object with title and description for the verification page
  return {
    title: 'Verify Email | Revolucare',
    description: 'Verify your email address to complete your registration with Revolucare',
  }
}

/**
 * The main verification page component that renders the email verification interface
 * @returns Rendered verification page
 */
const VerifyPage: React.FC = () => {
  // Get search parameters from URL using useSearchParams hook
  const searchParams = useSearchParams()

  // Extract token and email parameters from the URL if present
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  // Determine redirect destination from URL parameters or default to dashboard
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  // Render the page with a card containing the verification form
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md p-4 sm:p-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="mr-2 h-6 w-6 text-green-500" />
            Verify Your Email
          </CardTitle>
          <CardDescription>
            Enter the verification token sent to your email address to complete your registration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Pass extracted token, email, and redirect parameters to the VerificationForm component */}
          <VerificationForm token={token || undefined} email={email || undefined} redirectTo={redirectTo} />
        </CardContent>
      </Card>
    </div>
  )
}

export default VerifyPage