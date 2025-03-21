# src/web/app/(dashboard)/analytics/reports/page.tsx
```tsx
import React, { useState, useEffect, useCallback } from 'react'; // React ^18.2.0
import { FileText, BarChart, PieChart, LineChart } from 'lucide-react'; // lucide-react ^0.284.0
import { Metadata } from 'next'; // next ^14.0.0

import { PageContainer } from '../../../components/layout/page-container';
import { Breadcrumbs } from '../../../components/layout/breadcrumbs';
import ReportGenerator from '../../../components/analytics/report-generator';
import DataTable from '../../../components/analytics/data-table';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../../../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs';
import { useGenerateReport } from '../../../hooks/use-analytics';
import { useAuth } from '../../../hooks/use-auth';

/**
 * Generates metadata for the reports page
 */
export const generateMetadata = (): Metadata => {
  return {
    title: 'Analytics Reports',
    description: 'Generate and view custom analytics reports for the Revolucare platform',
  };
};

/**
 * Generates column configuration for the reports data table
 */
const getReportColumns = () => {
  return [
    {
      id: 'name',
      header: 'Report Name',
      accessor: 'name',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      id: 'description',
      header: 'Description',
      accessor: 'description',
      filterable: true,
      type: 'string',
    },
    {
      id: 'format',
      header: 'Format',
      accessor: 'format',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      id: 'createdAt',
      header: 'Created Date',
      accessor: 'createdAt',
      sortable: true,
      type: 'date',
    },
    {
      id: 'actions',
      header: 'Actions',
      accessor: 'id',
      cell: (id: string) => (
        <div className="flex space-x-2">
          <button onClick={() => console.log(`View report ${id}`)}>View</button>
          <button onClick={() => console.log(`Download report ${id}`)}>Download</button>
          <button onClick={() => console.log(`Delete report ${id}`)}>Delete</button>
        </div>
      ),
    },
  ];
};

/**
 * A page component that displays the analytics reports interface
 */
const ReportsPage: React.FC = () => {
  // Get authentication state and user role using useAuth hook
  const { user } = useAuth();

  // Initialize state for saved reports using useState
  const [savedReports, setSavedReports] = useState([
    {
      id: '1',
      name: 'User Activity Report',
      description: 'Report on user engagement metrics',
      format: 'pdf',
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: '2',
      name: 'Provider Performance Report',
      description: 'Report on provider performance metrics',
      format: 'csv',
      createdAt: '2024-01-05T00:00:00.000Z',
    },
  ]);

  // Initialize state for active tab using useState
  const [activeTab, setActiveTab] = useState('generate');

  // Initialize report generation mutation using useGenerateReport hook
  const { mutate: generateReport, isLoading: isGeneratingReport } = useGenerateReport();

  // Use useEffect to fetch saved reports on component mount
  useEffect(() => {
    // Simulate fetching saved reports from an API
    // Replace this with actual API call when available
    const fetchSavedReports = async () => {
      // Simulate API response
      const reports = [
        {
          id: '1',
          name: 'User Activity Report',
          description: 'Report on user engagement metrics',
          format: 'pdf',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: '2',
          name: 'Provider Performance Report',
          description: 'Report on provider performance metrics',
          format: 'csv',
          createdAt: '2024-01-05T00:00:00.000Z',
        },
      ];
      setSavedReports(reports);
    };

    fetchSavedReports();
  }, []);

  // Define columns for the reports data table using getReportColumns
  const columns = useMemo(() => getReportColumns(), []);

  // Implement handleReportGenerated function to handle new report creation
  const handleReportGenerated = (reportUrl: string) => {
    console.log('Report generated:', reportUrl);
    // Implement logic to save the report to the database
    // and update the savedReports state
  };

  // Implement handleViewReport function to open a report
  const handleViewReport = (reportId: string) => {
    console.log('View report:', reportId);
    // Implement logic to open the report in a new tab or window
  };

  // Implement handleDeleteReport function to delete a saved report
  const handleDeleteReport = (reportId: string) => {
    console.log('Delete report:', reportId);
    // Implement logic to delete the report from the database
    // and update the savedReports state
  };

  return (
    <PageContainer>
      <Breadcrumbs />
      <Card>
        <CardHeader>
          <CardTitle>Analytics Reports</CardTitle>
          <CardDescription>
            Generate and view custom analytics reports for the Revolucare platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="generate">Generate Report</TabsTrigger>
              <TabsTrigger value="saved">Saved Reports</TabsTrigger>
            </TabsList>
            <TabsContent value="generate">
              <ReportGenerator onReportGenerated={handleReportGenerated} />
            </TabsContent>
            <TabsContent value="saved">
              {savedReports.length > 0 ? (
                <DataTable
                  data={savedReports}
                  columns={columns}
                  title="Saved Reports"
                  description="View and manage your saved reports."
                />
              ) : (
                <p>No saved reports yet.</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default ReportsPage;