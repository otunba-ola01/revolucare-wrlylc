import React, { useState, useEffect } from "react";
import { Search, MapPin, Calendar, Star, Filter, X } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "../ui/select";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useFilter } from "../../hooks/use-filter";
import { ProviderSearchCriteria, ServiceType } from "../../types/provider";
import { SERVICE_TYPES, SERVICE_TYPE_LABELS } from "../../config/constants";
import { providerSearchSchema } from "../../lib/schemas/provider";

interface ProviderFilterProps {
  initialFilters?: Partial<ProviderSearchCriteria>;
  onFilterChange: (filters: Partial<ProviderSearchCriteria>) => void;
  className?: string;
}

export const ProviderFilter: React.FC<ProviderFilterProps> = ({
  initialFilters = {},
  onFilterChange,
  className = "",
}) => {
  // Setup filter state with the useFilter hook
  const { filters, debouncedFilters, updateFilters, resetFilters } = useFilter<Partial<ProviderSearchCriteria>>(
    initialFilters,
    300 // 300ms debounce
  );

  // State for tracking if filters are expanded on mobile
  const [isExpanded, setIsExpanded] = useState(false);
  // Track ZIP code validation state
  const [zipCodeError, setZipCodeError] = useState<string | null>(null);

  // Effect to call onFilterChange when debounced filters change
  useEffect(() => {
    onFilterChange(debouncedFilters);
  }, [debouncedFilters, onFilterChange]);

  // Handle filter reset
  const handleReset = () => {
    resetFilters();
    setZipCodeError(null);
  };

  // Toggle mobile filter view
  const toggleFilters = () => {
    setIsExpanded(!isExpanded);
  };

  // Validate ZIP code
  const validateZipCode = (value: string) => {
    if (!value) {
      setZipCodeError(null);
      return true;
    }
    
    const zipRegex = /^\d{5}(-\d{4})?$/;
    const isValid = zipRegex.test(value);
    
    if (!isValid) {
      setZipCodeError("Please enter a valid ZIP code");
      return false;
    }
    
    setZipCodeError(null);
    return true;
  };

  // Handle ZIP code change
  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    validateZipCode(value);
    updateFilters({ zipCode: value });
  };

  // Apply filters with validation
  const applyFilters = () => {
    // Validate all inputs before applying
    if (filters.zipCode && !validateZipCode(filters.zipCode)) {
      return;
    }
    
    onFilterChange(filters);
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Mobile filter toggle */}
      <div className="flex items-center justify-between mb-4 sm:hidden">
        <h2 className="text-lg font-semibold">Filter Providers</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleFilters}
          aria-expanded={isExpanded}
          aria-controls="filter-panel"
        >
          {isExpanded ? (
            <>
              <X className="h-4 w-4 mr-2" aria-hidden="true" />
              <span>Close Filters</span>
            </>
          ) : (
            <>
              <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
              <span>Show Filters</span>
            </>
          )}
        </Button>
      </div>

      {/* Desktop title */}
      <h2 className="text-lg font-semibold mb-4 hidden sm:block">Filter Providers</h2>

      {/* Filter panel - responsive */}
      <div 
        id="filter-panel" 
        className={`${
          isExpanded ? 'block' : 'hidden'
        } sm:block bg-white p-4 rounded-md border border-gray-200 shadow-sm`}
        aria-labelledby="filter-heading"
      >
        <h3 id="filter-heading" className="sr-only">Provider search filters</h3>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          {/* Service Type Filter */}
          <div className="space-y-2">
            <label htmlFor="service-type" className="block text-sm font-medium text-gray-700">
              Service Type
            </label>
            <Select 
              value={filters.serviceTypes?.[0] || ''} 
              onValueChange={(value) => {
                if (value) {
                  // Use the string value as a ServiceType
                  updateFilters({ serviceTypes: [value as ServiceType] });
                } else {
                  // Empty array for "Any service type" option
                  updateFilters({ serviceTypes: [] });
                }
              }}
            >
              <SelectTrigger id="service-type" className="w-full">
                <SelectValue placeholder="Select service type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any service type</SelectItem>
                {Object.entries(SERVICE_TYPES).map(([key, value]) => (
                  <SelectItem key={key} value={value}>
                    {SERVICE_TYPE_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location Filter */}
          <div className="space-y-2">
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Location
            </label>
            <div className="flex space-x-2">
              <div className="flex-1">
                <Input
                  id="location"
                  type="text"
                  placeholder="ZIP Code"
                  value={filters.zipCode || ''}
                  onChange={handleZipCodeChange}
                  icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
                  error={!!zipCodeError}
                  aria-invalid={!!zipCodeError}
                  aria-describedby={zipCodeError ? "zipcode-error" : undefined}
                />
                {zipCodeError && (
                  <p id="zipcode-error" className="text-red-500 text-xs mt-1" role="alert">
                    {zipCodeError}
                  </p>
                )}
              </div>
              <div className="w-1/3">
                <Select 
                  value={String(filters.distance || '10')} 
                  onValueChange={(value) => updateFilters({ distance: Number(value) })}
                >
                  <SelectTrigger id="distance">
                    <SelectValue placeholder="Distance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 miles</SelectItem>
                    <SelectItem value="10">10 miles</SelectItem>
                    <SelectItem value="25">25 miles</SelectItem>
                    <SelectItem value="50">50 miles</SelectItem>
                    <SelectItem value="100">100 miles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Availability Filter */}
          <div className="space-y-2">
            <label htmlFor="availability" className="block text-sm font-medium text-gray-700">
              Availability
            </label>
            <Select 
              value={filters.availability ? 'custom' : 'any'} 
              onValueChange={(value) => {
                if (value === 'any') {
                  updateFilters({ availability: null });
                } else if (value === 'this-week') {
                  const today = new Date();
                  const nextWeek = new Date();
                  nextWeek.setDate(today.getDate() + 7);
                  
                  updateFilters({
                    availability: {
                      startDate: today.toISOString().split('T')[0],
                      endDate: nextWeek.toISOString().split('T')[0]
                    }
                  });
                } else if (value === 'this-month') {
                  const today = new Date();
                  const nextMonth = new Date();
                  nextMonth.setMonth(today.getMonth() + 1);
                  
                  updateFilters({
                    availability: {
                      startDate: today.toISOString().split('T')[0],
                      endDate: nextMonth.toISOString().split('T')[0]
                    }
                  });
                }
              }}
            >
              <SelectTrigger id="availability" className="w-full">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" aria-hidden="true" />
                  <SelectValue placeholder="Any time" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any time</SelectItem>
                <SelectItem value="this-week">This week</SelectItem>
                <SelectItem value="this-month">This month</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Insurance Filter */}
          <div className="space-y-2">
            <label htmlFor="insurance" className="block text-sm font-medium text-gray-700">
              Insurance
            </label>
            <Select 
              value={filters.insurance || ''} 
              onValueChange={(value) => updateFilters({ insurance: value || null })}
            >
              <SelectTrigger id="insurance" className="w-full">
                <SelectValue placeholder="Any insurance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any insurance</SelectItem>
                <SelectItem value="medicare">Medicare</SelectItem>
                <SelectItem value="medicaid">Medicaid</SelectItem>
                <SelectItem value="blue-cross">Blue Cross Blue Shield</SelectItem>
                <SelectItem value="aetna">Aetna</SelectItem>
                <SelectItem value="cigna">Cigna</SelectItem>
                <SelectItem value="united">United Healthcare</SelectItem>
                <SelectItem value="private-pay">Private Pay</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rating Filter */}
          <div className="space-y-2">
            <label htmlFor="rating" className="block text-sm font-medium text-gray-700">
              Minimum Rating
            </label>
            <Select 
              value={filters.minRating !== null && filters.minRating !== undefined ? String(filters.minRating) : ''} 
              onValueChange={(value) => updateFilters({ minRating: value ? Number(value) : null })}
            >
              <SelectTrigger id="rating" className="w-full">
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-2" aria-hidden="true" />
                  <SelectValue placeholder="Any rating" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any rating</SelectItem>
                <SelectItem value="5">★★★★★ (5 stars only)</SelectItem>
                <SelectItem value="4">★★★★☆ (4+ stars)</SelectItem>
                <SelectItem value="3">★★★☆☆ (3+ stars)</SelectItem>
                <SelectItem value="2">★★☆☆☆ (2+ stars)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filter Action Buttons */}
          <div className="flex space-x-2 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleReset}
              className="flex-1"
            >
              Reset Filters
            </Button>
            <Button 
              type="button" 
              className="flex-1"
              onClick={applyFilters}
            >
              Apply Filters
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};