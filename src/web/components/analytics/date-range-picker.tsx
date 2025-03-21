import React, { useState, useEffect, useCallback } from "react";
import { 
  addDays, 
  subDays, 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear, 
  isSameDay, 
  format 
} from "date-fns"; // ^2.30.0
import { CalendarIcon, ChevronDownIcon } from "lucide-react"; // ^0.284.0

import { Button } from "../ui/button";
import { Calendar, DateRange } from "../ui/calendar";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator 
} from "../ui/dropdown-menu";
import { cn } from "../../lib/utils/color";
import { formatDate, getDateRangeForPeriod } from "../../lib/utils/date";

/**
 * Interface for preset date range options
 */
interface PresetDateRange {
  label: string;
  value: DateRange;
}

/**
 * Props interface for the DateRangePicker component
 */
export interface DateRangePickerProps {
  /** The currently selected date range */
  dateRange: DateRange;
  /** Callback function when date range changes */
  onDateRangeChange: (dateRange: DateRange) => void;
  /** Additional CSS class names */
  className?: string;
  /** Whether to show preset date range options */
  showPresets?: boolean;
  /** Alignment of the dropdown menu */
  align?: 'start' | 'center' | 'end';
  /** Whether the date range picker is disabled */
  disabled?: boolean;
}

/**
 * Generates a list of predefined date range options
 * @returns Array of preset date range options with labels and date values
 */
function getPresetDateRanges(): PresetDateRange[] {
  const today = new Date();
  
  return [
    {
      label: 'Today',
      value: {
        from: startOfDay(today),
        to: endOfDay(today),
      },
    },
    {
      label: 'Yesterday',
      value: {
        from: startOfDay(subDays(today, 1)),
        to: endOfDay(subDays(today, 1)),
      },
    },
    {
      label: 'Last 7 days',
      value: {
        from: startOfDay(subDays(today, 6)),
        to: endOfDay(today),
      },
    },
    {
      label: 'Last 30 days',
      value: {
        from: startOfDay(subDays(today, 29)),
        to: endOfDay(today),
      },
    },
    {
      label: 'This month',
      value: {
        from: startOfMonth(today),
        to: endOfMonth(today),
      },
    },
    {
      label: 'Last month',
      value: {
        from: startOfMonth(subDays(startOfMonth(today), 1)),
        to: endOfMonth(subDays(startOfMonth(today), 1)),
      },
    },
    {
      label: 'This quarter',
      value: {
        from: new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1),
        to: new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3 + 3, 0),
      },
    },
    {
      label: 'Last quarter',
      value: {
        from: new Date(
          today.getFullYear(),
          Math.floor(today.getMonth() / 3) * 3 - 3,
          1
        ),
        to: new Date(
          today.getFullYear(),
          Math.floor(today.getMonth() / 3) * 3,
          0
        ),
      },
    },
    {
      label: 'This year',
      value: {
        from: startOfYear(today),
        to: endOfYear(today),
      },
    },
    {
      label: 'Last year',
      value: {
        from: startOfYear(subDays(startOfYear(today), 1)),
        to: endOfYear(subDays(startOfYear(today), 1)),
      },
    },
  ];
}

/**
 * Formats a date range as a human-readable string
 * @param dateRange The date range to format
 * @param format Format string to use for the dates
 * @returns Formatted date range string (e.g., 'Jan 1, 2023 - Jan 31, 2023')
 */
function formatDateRange(dateRange: DateRange, formatString: string = 'MMM d, yyyy'): string {
  if (!dateRange.from) return '';
  
  if (!dateRange.to || isSameDay(dateRange.from, dateRange.to)) {
    return format(dateRange.from, formatString);
  }
  
  return `${format(dateRange.from, formatString)} - ${format(dateRange.to, formatString)}`;
}

/**
 * A component that allows users to select date ranges for analytics filtering
 */
export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  dateRange,
  onDateRangeChange,
  className,
  showPresets = true,
  align = 'start',
  disabled = false,
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DateRange>(dateRange);
  
  // Update internal state when external dateRange changes
  useEffect(() => {
    setSelectedRange(dateRange);
  }, [dateRange]);
  
  // Get preset date ranges (memoized to avoid recalculation)
  const presets = React.useMemo(() => getPresetDateRanges(), []);
  
  // Handle date range selection
  const handleRangeSelect = useCallback((range: DateRange) => {
    setSelectedRange(range);
  }, []);
  
  // Handle preset selection
  const handlePresetSelect = useCallback((preset: PresetDateRange) => {
    setSelectedRange(preset.value);
    onDateRangeChange(preset.value);
    setIsCalendarOpen(false);
  }, [onDateRangeChange]);
  
  // Format the currently selected date range for display
  const formattedDateRange = formatDateRange(selectedRange);
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsCalendarOpen(false);
    }
  }, []);
  
  return (
    <div 
      className={cn("relative inline-block", className)}
      onKeyDown={handleKeyDown}
    >
      <DropdownMenu open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "w-full sm:w-[240px] justify-start text-left font-normal",
              !selectedRange.from && "text-gray-500"
            )}
            disabled={disabled}
            aria-expanded={isCalendarOpen}
            aria-haspopup="dialog"
            aria-label="Select date range"
          >
            <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
            <span className="truncate">
              {formattedDateRange || "Select date range"}
            </span>
            <ChevronDownIcon className="ml-auto h-4 w-4 opacity-50" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="flex w-auto flex-col space-y-2 p-2 sm:w-[500px] md:w-auto"
          align={align}
          side="bottom"
          sideOffset={4}
          role="dialog"
          aria-label="Date range selector"
        >
          {showPresets && (
            <>
              <div className="space-y-1 p-1">
                <div className="text-sm font-medium text-gray-700 pb-1">
                  Presets
                </div>
                <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
                  {presets.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="outline"
                      size="sm"
                      onClick={() => handlePresetSelect(preset)}
                      className={cn(
                        "text-xs justify-start font-normal",
                        selectedRange.from &&
                          selectedRange.to &&
                          isSameDay(selectedRange.from, preset.value.from) &&
                          isSameDay(selectedRange.to, preset.value.to) &&
                          "bg-indigo-50 text-gray-900"
                      )}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
              <DropdownMenuSeparator />
            </>
          )}
          <div className="p-1">
            <div className="text-sm font-medium text-gray-700 pb-1">
              Custom Range
            </div>
            <div className="flex flex-col sm:flex-row">
              <Calendar
                mode="range"
                selected={selectedRange}
                onSelect={handleRangeSelect as (value: DateRange) => void}
                numberOfMonths={1}
                initialFocus
                disabled={disabled}
                className="rounded-md border shadow-sm"
              />
              <div className="mt-2 sm:ml-2 sm:mt-0 hidden sm:block">
                <Calendar
                  mode="range"
                  selected={selectedRange}
                  onSelect={handleRangeSelect as (value: DateRange) => void}
                  numberOfMonths={1}
                  initialFocus={false}
                  disabled={disabled}
                  defaultMonth={selectedRange?.from ? addDays(selectedRange.from, 31) : undefined}
                  className="rounded-md border shadow-sm"
                />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCalendarOpen(false)}
                className="text-sm"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (selectedRange.from && selectedRange.to) {
                    onDateRangeChange(selectedRange);
                    setIsCalendarOpen(false);
                  }
                }}
                disabled={!selectedRange.from || !selectedRange.to}
                className="text-sm"
              >
                Apply Range
              </Button>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};