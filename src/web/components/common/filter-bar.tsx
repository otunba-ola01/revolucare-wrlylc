import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Filter, X, ChevronDown, ChevronUp, Calendar as CalendarIcon } from "lucide-react"; // v0.284.0
import { format } from "date-fns"; // v2.30.0
import { useMediaQuery } from "react-responsive"; // v9.0.0

import { cn } from "../../lib/utils/color";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { Calendar } from "../ui/calendar";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuCheckboxItem, 
  DropdownMenuSeparator 
} from "../ui/dropdown-menu";
import { SearchBar } from "./search-bar";
import { useFilter } from "../../hooks/use-filter";

/**
 * Options for filter inputs of type select and multi-select
 */
export interface FilterOption {
  value: string | number | boolean;
  label: string;
  disabled?: boolean;
}

/**
 * Filter type definition for supported input types
 */
export type FilterType = 
  | 'select' 
  | 'multi-select' 
  | 'checkbox' 
  | 'date' 
  | 'date-range' 
  | 'text' 
  | 'number' 
  | 'range';

/**
 * Configuration for an individual filter
 */
export interface FilterConfig {
  id: string;
  label: string;
  type: FilterType;
  options?: FilterOption[];
  placeholder?: string;
  section?: string;
  defaultValue?: any;
  min?: number;
  max?: number;
  step?: number;
}

/**
 * Props for the FilterBar component
 */
export interface FilterBarProps {
  /** Initial filter values */
  initialFilters: Record<string, any>;
  /** Callback when filters change */
  onFilterChange: (filters: Record<string, any>) => void;
  /** Configuration for filter inputs */
  filterConfig: FilterConfig[];
  /** Whether to show search bar */
  showSearch?: boolean;
  /** Placeholder text for search input */
  searchPlaceholder?: string;
  /** Callback when search term changes */
  onSearch?: (term: string) => void;
  /** Additional CSS class names */
  className?: string;
  /** Whether filters can be collapsed on mobile */
  collapsible?: boolean;
}

/**
 * A reusable filter bar component that provides a standardized interface for filtering data.
 * Supports various filter types including dropdowns, checkboxes, date ranges, and text inputs,
 * with responsive design for different screen sizes.
 */
export const FilterBar: React.FC<React.PropsWithChildren<FilterBarProps>> = ({
  initialFilters,
  onFilterChange,
  filterConfig,
  showSearch = false,
  searchPlaceholder = 'Search...',
  onSearch,
  className,
  collapsible = true,
  children
}) => {
  // Use the useFilter hook to manage filter state with debouncing
  const { filters, debouncedFilters, updateFilters, resetFilters } = useFilter(initialFilters, 300);
  
  // State for managing expanded sections on mobile
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  
  // State for managing open date picker or dropdown
  const [openItem, setOpenItem] = useState<string | null>(null);
  
  // Detect mobile screens
  const isMobile = useMediaQuery({ maxWidth: 768 });
  
  // Reference for detecting clicks outside the filter component
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Initialize expanded sections based on screen size
  useEffect(() => {
    if (!isMobile || !collapsible) {
      // On desktop or when not collapsible, all sections are expanded
      const allSections: Record<string, boolean> = {};
      filterConfig.forEach((filter) => {
        const section = filter.section || 'default';
        allSections[section] = true;
      });
      setExpandedSections(prev => {
        // Only update if there are changes
        if (Object.keys(prev).length === 0) {
          return allSections;
        }
        return prev;
      });
    } else if (Object.keys(expandedSections).length === 0) {
      // On mobile, only expand the first section by default
      const uniqueSections = [...new Set(filterConfig.map(f => f.section || 'default'))];
      if (uniqueSections.length > 0) {
        setExpandedSections({ [uniqueSections[0]]: true });
      }
    }
  }, [isMobile, collapsible, filterConfig, expandedSections]);
  
  // Notify parent component when debounced filters change
  useEffect(() => {
    onFilterChange(debouncedFilters);
  }, [debouncedFilters, onFilterChange]);
  
  // Handle individual filter changes
  const handleFilterChange = useCallback((id: string, value: any) => {
    updateFilters({ [id]: value });
  }, [updateFilters]);
  
  // Reset all filters to initial values
  const handleReset = useCallback(() => {
    resetFilters();
  }, [resetFilters]);
  
  // Toggle section expansion (for mobile view)
  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenItem(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Group filters by section for organized display
  const filtersBySection = useMemo(() => {
    const sections: Record<string, FilterConfig[]> = {};
    
    filterConfig.forEach(filter => {
      const section = filter.section || 'default';
      if (!sections[section]) {
        sections[section] = [];
      }
      sections[section].push(filter);
    });
    
    return sections;
  }, [filterConfig]);
  
  // Render the appropriate filter input based on filter type
  const renderFilterInput = (
    filter: FilterConfig,
    value: any,
    onChange: (value: any) => void
  ): JSX.Element => {
    const isOpen = openItem === filter.id;
    const toggleOpen = () => setOpenItem(isOpen ? null : filter.id);
    
    switch (filter.type) {
      case 'select':
        return (
          <Select
            value={value !== undefined ? String(value) : undefined}
            onValueChange={onChange}
          >
            <SelectTrigger id={filter.id}>
              <SelectValue placeholder={filter.placeholder || `Select ${filter.label}`} />
            </SelectTrigger>
            <SelectContent>
              {filter.options?.map((option) => (
                <SelectItem 
                  key={String(option.value)} 
                  value={String(option.value)}
                  disabled={option.disabled}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
        
      case 'multi-select':
        return (
          <DropdownMenu open={isOpen} onOpenChange={toggleOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {Array.isArray(value) && value.length > 0
                  ? `${value.length} selected`
                  : filter.placeholder || `Select ${filter.label}`}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full min-w-[220px]">
              <div className="px-2 py-1.5 text-sm font-semibold text-gray-700">
                {filter.label}
              </div>
              <DropdownMenuSeparator />
              {filter.options?.map((option) => (
                <DropdownMenuCheckboxItem
                  key={String(option.value)}
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...(Array.isArray(value) ? value : []), option.value]);
                    } else {
                      onChange(
                        Array.isArray(value)
                          ? value.filter((v) => v !== option.value)
                          : []
                      );
                    }
                  }}
                  disabled={option.disabled}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
        
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2 h-10 py-2">
            <Checkbox
              id={filter.id}
              checked={Boolean(value)}
              onCheckedChange={onChange}
            />
            <label htmlFor={filter.id} className="text-sm cursor-pointer">
              {filter.label}
            </label>
          </div>
        );
        
      case 'date':
        return (
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !value && "text-gray-500"
              )}
              onClick={toggleOpen}
              aria-expanded={isOpen}
              aria-haspopup="true"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? format(new Date(value), 'PPP') : filter.placeholder || 'Select date'}
            </Button>
            
            {isOpen && (
              <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-md shadow-lg">
                <Calendar
                  mode="single"
                  selected={value ? new Date(value) : undefined}
                  onSelect={(date) => {
                    onChange(date);
                    setOpenItem(null);
                  }}
                  initialFocus
                />
              </div>
            )}
          </div>
        );
        
      case 'date-range':
        return (
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !(value?.from && value?.to) && "text-gray-500"
              )}
              onClick={toggleOpen}
              aria-expanded={isOpen}
              aria-haspopup="true"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value?.from && value?.to
                ? `${format(new Date(value.from), 'PP')} - ${format(new Date(value.to), 'PP')}`
                : filter.placeholder || 'Select date range'}
            </Button>
            
            {isOpen && (
              <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-md shadow-lg">
                <Calendar
                  mode="range"
                  selected={value}
                  onSelect={(range) => {
                    onChange(range);
                    if (range?.from && range?.to) {
                      setOpenItem(null);
                    }
                  }}
                  initialFocus
                />
              </div>
            )}
          </div>
        );
        
      case 'text':
        return (
          <Input
            id={filter.id}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={filter.placeholder}
          />
        );
        
      case 'number':
        return (
          <Input
            id={filter.id}
            type="number"
            value={value !== undefined ? value : ''}
            onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
            min={filter.min}
            max={filter.max}
            step={filter.step || 1}
            placeholder={filter.placeholder}
          />
        );
        
      case 'range':
        return (
          <div className="flex items-center space-x-2">
            <Input
              id={`${filter.id}-min`}
              type="number"
              value={value?.min !== undefined ? value.min : ''}
              onChange={(e) => onChange({
                ...value,
                min: e.target.value === '' ? undefined : Number(e.target.value)
              })}
              min={filter.min}
              max={filter.max}
              step={filter.step || 1}
              placeholder="Min"
              className="w-full"
            />
            <span className="px-1">-</span>
            <Input
              id={`${filter.id}-max`}
              type="number"
              value={value?.max !== undefined ? value.max : ''}
              onChange={(e) => onChange({
                ...value,
                max: e.target.value === '' ? undefined : Number(e.target.value)
              })}
              min={filter.min}
              max={filter.max}
              step={filter.step || 1}
              placeholder="Max"
              className="w-full"
            />
          </div>
        );
        
      default:
        return <div>Unsupported filter type: {filter.type}</div>;
    }
  };
  
  return (
    <div 
      ref={containerRef}
      className={cn(
        "bg-white border border-gray-200 rounded-lg p-4 shadow-sm",
        className
      )}
      role="region"
      aria-label="Filter controls"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900 flex items-center">
          <Filter className="mr-2 h-5 w-5" aria-hidden="true" />
          Filters
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Reset all filters"
        >
          <X className="mr-1 h-4 w-4" aria-hidden="true" />
          Reset
        </Button>
      </div>
      
      {showSearch && onSearch && (
        <div className="mb-4">
          <SearchBar
            placeholder={searchPlaceholder}
            onSearch={onSearch}
            aria-label={searchPlaceholder}
          />
        </div>
      )}
      
      <div className="space-y-4">
        {Object.entries(filtersBySection).map(([section, sectionFilters]) => (
          <div key={section} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
            {section !== 'default' && (
              <div 
                className={cn(
                  "flex justify-between items-center py-2",
                  collapsible && "cursor-pointer"
                )}
                onClick={() => collapsible && toggleSection(section)}
                role={collapsible ? "button" : undefined}
                aria-expanded={Boolean(expandedSections[section])}
                aria-controls={`section-${section}`}
                tabIndex={collapsible ? 0 : undefined}
                onKeyDown={(e) => {
                  if (collapsible && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    toggleSection(section);
                  }
                }}
              >
                <h3 className="text-md font-medium text-gray-900">{section}</h3>
                {collapsible && (
                  <Button variant="ghost" size="sm" className="p-1" tabIndex={-1} aria-hidden="true">
                    {expandedSections[section] ? 
                      <ChevronUp className="h-4 w-4" /> : 
                      <ChevronDown className="h-4 w-4" />
                    }
                  </Button>
                )}
              </div>
            )}
            
            {(!collapsible || expandedSections[section] || section === 'default') && (
              <div 
                id={`section-${section}`}
                className={cn(
                  "grid gap-4 mt-2",
                  isMobile ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-3"
                )}
              >
                {sectionFilters.map((filter) => (
                  <div key={filter.id} className="space-y-1">
                    {filter.type !== 'checkbox' && (
                      <label htmlFor={filter.id} className="text-sm font-medium text-gray-700">
                        {filter.label}
                      </label>
                    )}
                    {renderFilterInput(
                      filter,
                      filters[filter.id] !== undefined ? filters[filter.id] : filter.defaultValue,
                      (value) => handleFilterChange(filter.id, value)
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {children}
    </div>
  );
};

export default FilterBar;