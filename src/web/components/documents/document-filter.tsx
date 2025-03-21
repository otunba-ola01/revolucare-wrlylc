import React, { useState, useCallback } from "react";
import { Search, Calendar as CalendarIcon, X, Filter } from "lucide-react"; // v0.284.0
import { format } from "date-fns"; // v2.30.0
import { Popover, PopoverTrigger, PopoverContent } from "@radix-ui/react-popover"; // v1.0.6

import { cn } from "../../lib/utils/color";
import { DocumentType, DocumentStatus, DocumentFilterOptions, DOCUMENT_TYPE_LABELS } from "../../types/document";
import { Input } from "../ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";

interface DocumentFilterProps {
  /**
   * Initial filter values
   */
  initialFilters?: DocumentFilterOptions;
  /**
   * Callback fired when filters change
   */
  onFilterChange: (filters: DocumentFilterOptions) => void;
  /**
   * Additional CSS class names
   */
  className?: string;
  /**
   * Whether to use compact layout for smaller screens
   */
  compact?: boolean;
}

/**
 * A component that provides filtering capabilities for document lists in the Revolucare platform.
 * Allows users to filter documents by type, status, date range, and search terms.
 */
const DocumentFilter: React.FC<DocumentFilterProps> = ({
  initialFilters = {},
  onFilterChange,
  className,
  compact = false,
}) => {
  // Initialize filters with default values merged with initialFilters
  const [filters, setFilters] = useState<DocumentFilterOptions>({
    type: initialFilters.type,
    status: initialFilters.status,
    searchTerm: initialFilters.searchTerm || "",
    dateFrom: initialFilters.dateFrom,
    dateTo: initialFilters.dateTo,
  });

  // Search term state for the input
  const [searchTerm, setSearchTerm] = useState(initialFilters.searchTerm || "");

  // Handle filter changes
  const handleFilterChange = useCallback(
    (field: string, value: any) => {
      const updatedFilters = { ...filters, [field]: value };
      setFilters(updatedFilters);
      onFilterChange(updatedFilters);
    },
    [filters, onFilterChange]
  );

  // Handle filter reset
  const handleReset = useCallback(() => {
    const resetFilters: DocumentFilterOptions = {};
    setFilters(resetFilters);
    setSearchTerm("");
    onFilterChange(resetFilters);
  }, [onFilterChange]);

  // Handle search form submission
  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      handleFilterChange("searchTerm", searchTerm);
    },
    [searchTerm, handleFilterChange]
  );

  return (
    <div className={cn("space-y-4", className)}>
      <form onSubmit={handleSearchSubmit} className="flex space-x-2">
        <Input
          placeholder="Search documents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<Search className="h-4 w-4" />}
          className="flex-grow"
          aria-label="Search documents"
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      <div className={cn("grid gap-4", compact ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-4")}>
        {/* Document Type Filter */}
        <div className="space-y-2">
          <label htmlFor="document-type" className="text-sm font-medium text-gray-700">
            Document Type
          </label>
          <Select
            value={filters.type || ""}
            onValueChange={(value) => handleFilterChange("type", value ? value as DocumentType : undefined)}
          >
            <SelectTrigger id="document-type">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              {Object.values(DocumentType).map((type) => (
                <SelectItem key={type} value={type}>
                  {DOCUMENT_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Document Status Filter */}
        <div className="space-y-2">
          <label htmlFor="document-status" className="text-sm font-medium text-gray-700">
            Status
          </label>
          <Select
            value={filters.status || ""}
            onValueChange={(value) => handleFilterChange("status", value ? value as DocumentStatus : undefined)}
          >
            <SelectTrigger id="document-status">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              {Object.values(DocumentStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Date Range
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.dateFrom && !filters.dateTo && "text-gray-500"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateFrom && filters.dateTo ? (
                  <>
                    {format(filters.dateFrom, "MMM d, yyyy")} - {format(filters.dateTo, "MMM d, yyyy")}
                  </>
                ) : filters.dateFrom ? (
                  <>From {format(filters.dateFrom, "MMM d, yyyy")}</>
                ) : filters.dateTo ? (
                  <>Until {format(filters.dateTo, "MMM d, yyyy")}</>
                ) : (
                  "Select date range"
                )}
                {(filters.dateFrom || filters.dateTo) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFilterChange("dateFrom", undefined);
                      handleFilterChange("dateTo", undefined);
                    }}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Clear date</span>
                  </Button>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{
                  from: filters.dateFrom,
                  to: filters.dateTo,
                }}
                onSelect={(range) => {
                  if (range) {
                    const dateRange = range as { from?: Date; to?: Date };
                    handleFilterChange("dateFrom", dateRange.from);
                    handleFilterChange("dateTo", dateRange.to);
                  } else {
                    handleFilterChange("dateFrom", undefined);
                    handleFilterChange("dateTo", undefined);
                  }
                }}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Action Buttons */}
        <div className="flex items-end">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleReset}
            disabled={!filters.type && !filters.status && !filters.searchTerm && !filters.dateFrom && !filters.dateTo}
          >
            <X className="mr-2 h-4 w-4" />
            Reset Filters
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DocumentFilter;