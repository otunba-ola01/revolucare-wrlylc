import React from 'react'; // v18.0+
import { notFound, useRouter } from 'next/navigation'; // v14.0.0
import { ArrowLeft, History, FileText, Eye } from 'lucide-react'; // v0.284.0
import {
  PageContainer,
  Breadcrumbs,
} from '../../../../../components/layout/page-container';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../../../../../components/ui/card';
import { Button } from '../../../../../components/ui/button';
import {
  useCarePlanHistory,
  useCarePlan,
} from '../../../../../hooks/use-care-plans';
import useAuth from '../../../../../hooks/use-auth';
import { formatDate } from '../../../../../lib/utils/date';
import { ROUTES } from '../../../../../config/constants';
import { CarePlanVersion } from '../../../../../types/care-plan';

/**
 * Page component that displays the version history of a specific care plan
 * @param {object} { params } - The parameters object containing the care plan ID
 * @returns {JSX.Element} Rendered care plan history page
 */
const CarePlanHistoryPage: React.FC<{ params: { id: string } }> = ({ params }) => {
  // LD1: Extract the care plan ID from the params object
  const { id: carePlanId } = params;

  // LD1: Use the useCarePlan hook to fetch the care plan data by ID
  const { data: carePlan, isLoading: isCarePlanLoading, isError: isCarePlanError } = useCarePlan(carePlanId);

  // LD1: Use the useCarePlanHistory hook to fetch the version history data
  const { data: carePlanHistory, isLoading: isHistoryLoading, isError: isHistoryError } = useCarePlanHistory(carePlanId);

  // LD1: Use the useAuth hook to get user information and permissions
  const { requireAuth } = useAuth();

  // LD1: Use the useRouter hook for navigation
  const router = useRouter();

  // LD1: Handle loading state with a skeleton UI
  if (isCarePlanLoading || isHistoryLoading) {
    return (
      <PageContainer>
        <Card>
          <CardHeader>
            <CardTitle>Loading Care Plan History...</CardTitle>
          </CardHeader>
          <CardContent>Loading...</CardContent>
        </Card>
      </PageContainer>
    );
  }

  // LD1: Handle error state with appropriate error message
  if (isCarePlanError || isHistoryError) {
    return (
      <PageContainer>
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Care Plan History</CardTitle>
          </CardHeader>
          <CardContent>Failed to load care plan history. Please try again later.</CardContent>
        </Card>
      </PageContainer>
    );
  }

  // LD1: If care plan is not found, call the notFound function
  if (!carePlan) {
    notFound();
  }

  // LD1: Format dates for display using formatDate utility
  const formattedCreatedAt = formatDate(carePlan.createdAt, 'MMM DD, YYYY');

  // LD1: Render the page with PageContainer for consistent layout
  return (
    <PageContainer>
      {/* LD1: Include Breadcrumbs for navigation context */}
      <Breadcrumbs />

      {/* LD1: Display page header with title and back button */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Care Plan
          </Button>
          <CardTitle className="mt-2">Care Plan History: {carePlan.title}</CardTitle>
        </div>
        <Button variant="primary" size="sm">
          <Eye className="mr-2 h-4 w-4" />
          View Care Plan
        </Button>
      </div>

      {/* LD1: Render a list of care plan versions in chronological order */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Version History</CardTitle>
        </CardHeader>
        <CardContent>
          {carePlanHistory?.versions.map((version) => (
            // LD1: For each version, display version number, creation date, author, and changes
            // LD1: Highlight the current version
            <VersionCard
              key={version.id}
              version={version}
              isCurrentVersion={version.version === carePlanHistory.currentVersion}
              carePlanId={carePlanId}
            />
          ))}
        </CardContent>
      </Card>
    </PageContainer>
  );
};

/**
 * Generates metadata for the care plan history page
 * @param {object} { params } - The parameters object containing the care plan ID
 * @returns {object} Page metadata including title and description
 */
export async function generateMetadata({ params }: { params: { id: string } }) {
  // LD1: Extract the care plan ID from the params object
  const { id } = params;

  // LD1: Return metadata object with dynamic title including the care plan ID
  // LD1: Include appropriate description for SEO
  return {
    title: `Care Plan History - Care Plan ID: ${id}`,
    description: `View the version history for care plan ${id}. Track changes, creation dates, and authors.`,
  };
}

/**
 * Helper function to render a summary of changes for a care plan version
 * @param {Record<string, any>} changes - The changes object
 * @returns {JSX.Element} Rendered summary of changes
 */
function renderChangesSummary(changes: Record<string, any>): JSX.Element {
  // LD1: Process the changes object to extract meaningful changes
  // LD1: Group changes by category (goals, interventions, general info)
  // LD1: Format each change in a human-readable format
  // LD1: Render a list of changes with appropriate styling
  // LD1: Handle empty changes object with a default message
  return (
    <div>
      {/* Implement logic to display changes here */}
      <p>Changes Summary: {JSON.stringify(changes)}</p>
    </div>
  );
}

/**
 * Component to render a single version card in the history list
 * @param {object} { version, isCurrentVersion, carePlanId } - The version data, current version flag, and care plan ID
 * @returns {JSX.Element} Rendered version card component
 */
function VersionCard({ version, isCurrentVersion, carePlanId }: { version: CarePlanVersion; isCurrentVersion: boolean; carePlanId: string }): JSX.Element {
  // LD1: Destructure props to get version data, current version flag, and care plan ID
  // LD1: Format the creation date using formatDate utility
  const formattedCreatedAt = formatDate(version.createdAt, 'MMM DD, YYYY h:mm A');

  // LD1: Apply special styling for the current version
  const cardClassName = isCurrentVersion ? 'border-2 border-indigo-500' : '';

  // LD1: Render a Card component with version information
  return (
    <Card className={`mb-4 ${cardClassName}`}>
      <CardHeader>
        {/* LD1: Display version number, creation date, and author */}
        <CardTitle>
          Version {version.version} - Created on {formattedCreatedAt}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* LD1: Render changes summary using renderChangesSummary helper */}
        {renderChangesSummary(version.changes)}
        {/* LD1: Include a button to view this version of the care plan if implemented */}
        {/* <Button variant="secondary" size="sm">View This Version</Button> */}
      </CardContent>
    </Card>
  );
}

// LD1: Be generous about your exports so long as it doesn't create a security risk.
export default CarePlanHistoryPage;
export { generateMetadata };