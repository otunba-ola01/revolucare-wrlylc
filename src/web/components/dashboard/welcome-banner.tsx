import React from 'react'; // v18.0+
import Link from 'next/link'; // v14.0.0
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import useAuth from '../../hooks/use-auth';
import useCarePlans from '../../hooks/use-care-plans';
import { Roles } from '../../config/roles';
import { cn } from '../../lib/utils/color';

/**
 * Helper function to get a time-appropriate greeting
 * @returns Greeting message (Good morning/afternoon/evening)
 */
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return 'Good morning';
  } else if (hour >= 12 && hour < 18) {
    return 'Good afternoon';
  } else {
    return 'Good evening';
  }
};

/**
 * Helper function to calculate the care plan progress percentage
 * @param carePlan 
 * @returns Progress percentage (0-100)
 */
const calculateProgress = (carePlan: any): number => {
  if (!carePlan || !carePlan.goals || !carePlan.interventions) {
    return 0;
  }

  const totalItems = carePlan.goals.length + carePlan.interventions.length;
  if (totalItems === 0) {
    return 0;
  }

  const completedGoals = carePlan.goals.filter(
    (goal: any) => goal.status === 'achieved'
  ).length;
  const completedInterventions = carePlan.interventions.filter(
    (intervention: any) => intervention.status === 'completed'
  ).length;

  const completedItems = completedGoals + completedInterventions;
  return (completedItems / totalItems) * 100;
};

interface WelcomeBannerProps {
  className?: string;
}

/**
 * A component that displays a personalized welcome message and care plan progress
 */
const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ className }) => {
  // Use the useAuth hook to get the current user information
  const { user, hasRole } = useAuth();

  // Use the useCarePlans hook to fetch the user's active care plans
  const { data: carePlans } = useCarePlans({
    clientId: user?.id,
  });

  // Calculate the care plan progress percentage based on completed goals and interventions
  const activeCarePlan = carePlans?.data?.[0];
  const progress = activeCarePlan ? calculateProgress(activeCarePlan) : 0;

  // Determine the appropriate greeting and content based on user role
  const greeting = getGreeting();

  // Render a Card component with personalized greeting in the header
  return (
    <Card className={cn('col-span-4 md:col-span-8 lg:col-span-4', className)}>
      <CardHeader>
        <CardTitle>{greeting}, {user?.firstName}!</CardTitle>
        <CardDescription>
          {hasRole(Roles.CLIENT) &&
            activeCarePlan ? (
              <>
                Your care plan is {progress.toFixed(0)}% complete.
              </>
            ) : (
              'Welcome to Revolucare!'
            )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Display care plan progress information for clients */}
        {hasRole(Roles.CLIENT) && activeCarePlan && (
          <>
            <Progress value={progress} />
          </>
        )}
      </CardContent>
      <CardFooter className="justify-between">
        {/* Provide a 'View Care Plan' button that links to the user's care plan */}
        {hasRole(Roles.CLIENT) && activeCarePlan && (
          <Link href={`/care-plans/${activeCarePlan.id}`} passHref>
            <Button variant="secondary" asChild>
              View Care Plan
            </Button>
          </Link>
        )}
        {/* Adapt content for different user roles (provider, case manager, administrator) */}
        {!hasRole(Roles.CLIENT) && (
          <div>
            {/* Add content specific to other roles here */}
            {/* Example: "Manage your clients" button for case managers */}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default WelcomeBanner;