import React from 'react';
import { useRouter } from 'next/navigation'; // v14.0.0
import { FileText, Users, Calendar, Settings, HelpCircle, PlusCircle, Search } from 'lucide-react'; // v0.284.0
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { useAuth } from '../../hooks/use-auth';
import { Roles } from '../../config/roles';
import { cn } from '../../lib/utils/color';

/**
 * Component that displays role-specific quick action buttons for common tasks
 * on the dashboard. It provides users with easy access to frequently used features
 * based on their role in the system.
 */
export function QuickActions({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const auth = useAuth();
  const router = useRouter();
  
  // Determine which role to use for actions
  let roleForActions = 'default';
  
  if (auth.isClient) {
    roleForActions = Roles.CLIENT;
  } else if (auth.isProvider) {
    roleForActions = Roles.PROVIDER;
  } else if (auth.isCaseManager) {
    roleForActions = Roles.CASE_MANAGER;
  } else if (auth.isAdmin) {
    roleForActions = Roles.ADMINISTRATOR;
  }
  
  // Get the appropriate actions for the user's role
  const actions = getQuickActionsForRole(roleForActions, (path) => router.push(path));

  return (
    <Card className={cn("", className)} {...props}>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="flex flex-col items-center justify-center h-24 space-y-2"
              onClick={action.onClick}
            >
              {action.icon}
              <span>{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Helper function to get role-specific actions
 * 
 * @param role - The user role to get actions for
 * @param navigate - Function to navigate to a specific path
 * @returns Array of quick action objects appropriate for the role
 */
function getQuickActionsForRole(role: string, navigate: (path: string) => void) {
  switch (role) {
    case Roles.CLIENT:
      return [
        {
          label: 'Request Service',
          icon: <PlusCircle className="h-6 w-6" />,
          onClick: () => navigate('/services/request')
        },
        {
          label: 'Update Profile',
          icon: <Users className="h-6 w-6" />,
          onClick: () => navigate('/profile')
        },
        {
          label: 'View Documents',
          icon: <FileText className="h-6 w-6" />,
          onClick: () => navigate('/documents')
        },
        {
          label: 'Get Support',
          icon: <HelpCircle className="h-6 w-6" />,
          onClick: () => navigate('/support')
        }
      ];
    case Roles.PROVIDER:
      return [
        {
          label: 'Update Availability',
          icon: <Calendar className="h-6 w-6" />,
          onClick: () => navigate('/availability')
        },
        {
          label: 'View Schedule',
          icon: <Calendar className="h-6 w-6" />,
          onClick: () => navigate('/schedule')
        },
        {
          label: 'Manage Services',
          icon: <Settings className="h-6 w-6" />,
          onClick: () => navigate('/services/manage')
        },
        {
          label: 'Client Records',
          icon: <FileText className="h-6 w-6" />,
          onClick: () => navigate('/clients')
        }
      ];
    case Roles.CASE_MANAGER:
      return [
        {
          label: 'Create Care Plan',
          icon: <PlusCircle className="h-6 w-6" />,
          onClick: () => navigate('/care-plans/create')
        },
        {
          label: 'Add Client',
          icon: <Users className="h-6 w-6" />,
          onClick: () => navigate('/clients/add')
        },
        {
          label: 'Schedule Assessment',
          icon: <Calendar className="h-6 w-6" />,
          onClick: () => navigate('/assessments/schedule')
        },
        {
          label: 'Generate Report',
          icon: <FileText className="h-6 w-6" />,
          onClick: () => navigate('/reports/generate')
        }
      ];
    case Roles.ADMINISTRATOR:
      return [
        {
          label: 'User Management',
          icon: <Users className="h-6 w-6" />,
          onClick: () => navigate('/admin/users')
        },
        {
          label: 'System Settings',
          icon: <Settings className="h-6 w-6" />,
          onClick: () => navigate('/admin/settings')
        },
        {
          label: 'View Analytics',
          icon: <FileText className="h-6 w-6" />,
          onClick: () => navigate('/admin/analytics')
        },
        {
          label: 'Audit Logs',
          icon: <FileText className="h-6 w-6" />,
          onClick: () => navigate('/admin/audit-logs')
        }
      ];
    default:
      // Default actions for unknown role or not authenticated
      return [
        {
          label: 'Profile',
          icon: <Users className="h-6 w-6" />,
          onClick: () => navigate('/profile')
        },
        {
          label: 'Settings',
          icon: <Settings className="h-6 w-6" />,
          onClick: () => navigate('/settings')
        },
        {
          label: 'Help',
          icon: <HelpCircle className="h-6 w-6" />,
          onClick: () => navigate('/help')
        },
        {
          label: 'Documents',
          icon: <FileText className="h-6 w-6" />,
          onClick: () => navigate('/documents')
        }
      ];
  }
}

export default QuickActions;