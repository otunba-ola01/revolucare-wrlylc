import React, { useState, useEffect, useCallback } from 'react'; // react ^18.2.0
import { useForm } from 'react-hook-form'; // react-hook-form ^7.43.0
import { zodResolver } from '@hookform/resolvers/zod'; // @hookform/resolvers/zod ^3.0.0
import {
  FundingSource,
  FundingSourceFormData,
  FundingSourceType,
  VerificationStatus,
} from '../../types/service-plan';
import { fundingSourceSchema } from '../../lib/schemas/service-plan';
import { useClientFundingSources } from '../../hooks/use-services-plans';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Progress } from '../ui/progress';
import { formatCurrency, formatPercentage } from '../../lib/utils/format';
import { cn } from '../../lib/utils/color';
import {
  Plus,
  Edit,
  Trash2,
  DollarSign,
  CheckCircle,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'; // lucide-react ^0.284.0

/**
 * Determines the appropriate badge variant based on verification status
 * @param status VerificationStatus
 * @returns Badge variant (default, primary, secondary, outline, destructive)
 */
const getVerificationStatusBadgeVariant = (status: VerificationStatus): string => {
  switch (status) {
    case VerificationStatus.PENDING:
      return 'default';
    case VerificationStatus.VERIFIED:
      return 'secondary';
    case VerificationStatus.DENIED:
      return 'destructive';
    default:
      return 'default';
  }
};

/**
 * Converts FundingSourceType enum to options for select component
 * @returns Array of options with label and value properties
 */
const getFundingTypeOptions = () => {
  return Object.values(FundingSourceType).map((type) => ({
    label: type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    value: type,
  }));
};

/**
 * Converts VerificationStatus enum to options for select component
 * @returns Array of options with label and value properties
 */
const getVerificationStatusOptions = () => {
  return Object.values(VerificationStatus).map((status) => ({
    label: status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    value: status,
  }));
};

/**
 * Calculates the total coverage amount from all funding sources
 * @param fundingSources FundingSource[]
 * @returns Total coverage amount
 */
const calculateTotalCoverage = (fundingSources: FundingSource[]): number => {
  return fundingSources.reduce((total, source) => total + source.coverageAmount, 0);
};

/**
 * Sub-component for displaying coverage progress
 */
interface CoverageProgressProps {
  coveragePercentage: number;
  totalCost: number;
  totalCoverage: number;
}

const CoverageProgress: React.FC<CoverageProgressProps> = ({
  coveragePercentage,
  totalCost,
  totalCoverage,
}) => {
  const remainingOutOfPocket = totalCost - totalCoverage;

  return (
    <div>
      <Progress value={coveragePercentage} showValue />
      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        {formatCurrency(totalCoverage)} of {formatCurrency(totalCost)} covered ({formatPercentage(coveragePercentage / 100)})
        <br />
        Remaining out-of-pocket: {formatCurrency(remainingOutOfPocket > 0 ? remainingOutOfPocket : 0)}
      </div>
    </div>
  );
};

/**
 * Sub-component for adding or editing funding sources
 */
interface FundingSourceFormProps {
  defaultValues?: Partial<FundingSourceFormData>;
  onSubmit: (data: FundingSourceFormData) => void;
  onCancel: () => void;
}

const FundingSourceForm: React.FC<FundingSourceFormProps> = ({
  defaultValues,
  onSubmit,
  onCancel,
}) => {
  const form = useForm<FundingSourceFormData>({
    resolver: zodResolver(fundingSourceSchema),
    defaultValues,
    mode: 'onChange',
  });

  const handleSubmit = (values: FundingSourceFormData) => {
    onSubmit(values);
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Funding Source Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Blue Cross" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Funding Source Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {getFundingTypeOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="coveragePercentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Coverage Percentage</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 80" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="coverageAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Coverage Amount</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 1000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="verificationStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Verification Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {getVerificationStatusOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

/**
 * Component for managing funding sources within a service plan
 */
interface FundingSourcesProps {
  clientId: string;
  fundingSources: FundingSource[];
  onChange: (fundingSources: FundingSource[]) => void;
  totalCost: number;
  readOnly?: boolean;
}

export const FundingSources: React.FC<FundingSourcesProps> = ({
  clientId,
  fundingSources,
  onChange,
  totalCost,
  readOnly = false,
}) => {
  const [open, setOpen] = useState(false);
  const [currentFundingSource, setCurrentFundingSource] = useState<FundingSource | null>(null);

  const { data: potentialFundingSources } = useClientFundingSources(clientId);

  const totalCoverage = calculateTotalCoverage(fundingSources);
  const coveragePercentage = totalCost > 0 ? (totalCoverage / totalCost) * 100 : 0;

  const handleAddFundingSource = () => {
    setCurrentFundingSource(null);
    setOpen(true);
  };

  const handleEditFundingSource = (fundingSource: FundingSource) => {
    setCurrentFundingSource(fundingSource);
    setOpen(true);
  };

  const handleRemoveFundingSource = (fundingSource: FundingSource) => {
    const updatedFundingSources = fundingSources.filter((s) => s.id !== fundingSource.id);
    onChange(updatedFundingSources);
  };

  const handleSaveFundingSource = (data: FundingSourceFormData) => {
    if (currentFundingSource) {
      // Edit existing funding source
      const updatedFundingSources = fundingSources.map((s) =>
        s.id === currentFundingSource.id ? { ...s, ...data } : s
      );
      onChange(updatedFundingSources);
    } else {
      // Add new funding source
      const newFundingSource: FundingSource = {
        id: Math.random().toString(36).substring(7), // Temporary ID
        ...data,
        details: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      onChange([...fundingSources, newFundingSource]);
    }
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
    setCurrentFundingSource(null);
  };

  return (
    <section>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Funding Sources</h3>
        {!readOnly && (
          <Button size="sm" onClick={handleAddFundingSource}>
            <Plus className="mr-2 h-4 w-4" />
            Add Funding Source
          </Button>
        )}
      </div>

      <CoverageProgress coveragePercentage={coveragePercentage} totalCost={totalCost} totalCoverage={totalCoverage} />

      {fundingSources.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No funding sources added yet.</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {fundingSources.map((fundingSource) => (
            <Card key={fundingSource.id}>
              <CardHeader>
                <CardTitle>{fundingSource.name}</CardTitle>
                <CardDescription>{fundingSource.type}</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Coverage: {formatCurrency(fundingSource.coverageAmount)} ({formatPercentage(fundingSource.coveragePercentage / 100)})</p>
                <Badge variant={getVerificationStatusBadgeVariant(fundingSource.verificationStatus)}>
                  {fundingSource.verificationStatus.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </Badge>
              </CardContent>
              {!readOnly && (
                <CardFooter className="justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditFundingSource(fundingSource)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleRemoveFundingSource(fundingSource)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={!form.formState.isSubmitting}>
          <DialogHeader>
            <DialogTitle>{currentFundingSource ? 'Edit Funding Source' : 'Add Funding Source'}</DialogTitle>
            <DialogDescription>
              {currentFundingSource ? 'Update the funding source details.' : 'Enter the details for the new funding source.'}
            </DialogDescription>
          </DialogHeader>
          <FundingSourceForm
            defaultValues={currentFundingSource || undefined}
            onSubmit={handleSaveFundingSource}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>
    </section>
  );
};