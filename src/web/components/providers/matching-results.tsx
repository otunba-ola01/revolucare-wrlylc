import React from "react"; // react ^18.0.0
import { useState, useEffect } from 'react'; // react ^18.0.0
import { useRouter } from "next/navigation"; // next/navigation latest
import { UserSearchIcon } from "lucide-react"; // lucide-react ^0.284.0
import { cn } from "../../lib/utils/color";
import {
  ProviderMatch,
  ProviderMatchingCriteria,
} from "../../types/provider";
import { useMatchProviders } from "../../hooks/use-providers";
import { ProviderCard } from "./provider-card";
import { ProviderFilter } from "./provider-filter";
import { EmptyState } from "../common/empty-state";
import { LoadingSpinner } from "../common/loading-spinner";
import { ErrorMessage } from "../common/error-message";
import { Button } from "../ui/button";

/**
 * A component that displays the results of the AI-powered provider matching algorithm
 */
export const MatchingResults: React.FC<{
  criteria: ProviderMatchingCriteria;
  onViewProfile: (providerId: string) => void;
  onSchedule: (providerId: string) => void;
  className?: string;
}> = ({ criteria, onViewProfile, onSchedule, className }) => {
  // LD1: Initialize state for filtered criteria using useState
  const [filteredCriteria, setFilteredCriteria] = useState<
    Partial<ProviderMatchingCriteria>
  >(criteria);

  // LD1: Use the useMatchProviders hook to fetch provider matches based on criteria
  const { matches, isLoading, error } = useMatchProviders(
    filteredCriteria as ProviderMatchingCriteria
  );

  // LD1: Initialize router for navigation using useRouter
  const router = useRouter();

  // LD1: Implement handleFilterChange to update filtered criteria
  const handleFilterChange = (newFilters: Partial<ProviderMatchingCriteria>) => {
    setFilteredCriteria((prev) => ({ ...prev, ...newFilters }));
  };

  // LD1: Implement handleReset to reset filters to initial criteria
  const handleReset = () => {
    setFilteredCriteria(criteria);
  };

  // LD1: Implement handleViewProfile to navigate to provider profile
  const handleViewProfile = (providerId: string) => {
    onViewProfile(providerId);
  };

  // LD1: Implement handleSchedule to navigate to scheduling page
  const handleSchedule = (providerId: string) => {
    onSchedule(providerId);
  };

  // LD1: Render a container div with the provided className
  return (
    <div className={cn("space-y-6", className)}>
      {/* LD1: Render ProviderFilter component with current filters and change handlers */}
      <ProviderFilter
        initialFilters={filteredCriteria}
        onFilterChange={handleFilterChange}
      />

      {/* LD1: Handle loading state by rendering LoadingSpinner when isLoading is true */}
      {isLoading && <LoadingSpinner text="Loading providers..." />}

      {/* LD1: Handle error state by rendering ErrorMessage when error exists */}
      {error && (
        <ErrorMessage
          error={error.error.message}
          className="text-center"
        />
      )}

      {/* LD1: Handle empty state by rendering EmptyState when no matches are found */}
      {!isLoading && !error && matches.length === 0 && (
        <EmptyState
          title="No providers found"
          description="We couldn't find any providers matching your criteria. Please adjust your filters and try again."
          icon={<UserSearchIcon size={48} />}
          actionText="Reset Filters"
          onAction={handleReset}
        />
      )}

      {/* LD1: Render a heading with the number of matches found */}
      {!isLoading && !error && matches.length > 0 && (
        <h2 className="text-lg font-semibold">
          {matches.length} Providers Found
        </h2>
      )}

      {/* LD1: Render a grid of ProviderCard components for each provider match */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* LD1: Sort provider matches by compatibility score (highest first) */}
        {matches
          .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
          .map((match) => (
            <ProviderCard
              key={match.provider.id}
              provider={match}
              showCompatibility
              onViewProfile={() => handleViewProfile(match.provider.id)}
              onSchedule={() => handleSchedule(match.provider.id)}
            />
          ))}
      </div>
    </div>
  );
};

export default MatchingResults;