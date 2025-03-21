import React, { useState, useEffect, useCallback } from "react";
import { DayPicker, DayPickerSingleProps, DayPickerRangeProps, DayPickerMultipleProps } from "react-day-picker"; // v8.8.0
import { 
  format, 
  addMonths, 
  subMonths, 
  isSameMonth,
  addYears, 
  subYears
} from "date-fns"; // v2.30.0
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"; // v0.284.0

import { cn } from "../../lib/utils/color";
import { formatDate, getDateRangeForPeriod, getWeekDayName, getMonthName } from "../../lib/utils/date";
import { Button } from "./button";

/**
 * Interface for date range selection
 */
export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

/**
 * Props interface for the Calendar component
 */
export interface CalendarProps {
  /** Selection mode for the calendar */
  mode?: "single" | "range" | "multiple";
  /** Currently selected date(s) */
  selected?: Date | Date[] | DateRange | undefined;
  /** Callback when date selection changes */
  onSelect?: (value: Date | Date[] | DateRange | undefined) => void;
  /** Function to determine if a date should be disabled */
  disabled?: (date: Date) => boolean;
  /** Whether to focus the calendar initially */
  initialFocus?: boolean;
  /** Number of months to display */
  numberOfMonths?: number;
  /** Default month to display */
  defaultMonth?: Date;
  /** Whether to show days from previous/next months */
  showOutsideDays?: boolean;
  /** Whether to always display 6 weeks */
  fixedWeeks?: boolean;
  /** Additional CSS class names */
  className?: string;
}

/**
 * Calendar Header component for navigation controls
 */
function CalendarHeader({
  currentDate,
  onPreviousMonth,
  onNextMonth,
  onToday,
  onPreviousYear,
  onNextYear,
  view,
  onViewChange
}: {
  currentDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onPreviousYear: () => void;
  onNextYear: () => void;
  view: 'month' | 'year';
  onViewChange: (view: 'month' | 'year') => void;
}) {
  return (
    <div className="flex items-center justify-between px-2 py-2">
      <h2 className="font-medium text-lg">
        {view === "month"
          ? `${getMonthName(currentDate)} ${currentDate.getFullYear()}`
          : currentDate.getFullYear().toString()}
      </h2>
      <div className="flex items-center space-x-1">
        {view === "month" ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={onPreviousMonth}
              aria-label="Previous month"
              className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onNextMonth}
              aria-label="Next month"
              className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={onPreviousYear}
              aria-label="Previous year"
              className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onNextYear}
              aria-label="Next year"
              className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToday}
          aria-label="Today"
          className="ml-2 h-7 px-2 text-sm"
        >
          Today
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewChange(view === "month" ? "year" : "month")}
          aria-label={view === "month" ? "Show year view" : "Show month view"}
          className="ml-2 h-7 px-2 text-sm"
        >
          {view === "month" ? "Year" : "Month"}
        </Button>
      </div>
    </div>
  );
}

/**
 * Calendar Year View component for year selection
 */
function CalendarYearView({
  year,
  onSelectMonth
}: {
  year: number;
  onSelectMonth: (month: number) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: 12 }, (_, i) => (
        <Button
          key={i}
          variant="ghost"
          onClick={() => onSelectMonth(i)}
          className="flex h-10 w-full items-center justify-center rounded-md p-2 text-sm font-medium"
          aria-label={getMonthName(i)}
        >
          {getMonthName(i, "short")}
        </Button>
      ))}
    </div>
  );
}

/**
 * A reusable calendar component for date selection with various modes
 */
const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
  (
    {
      mode = "single",
      selected,
      onSelect,
      disabled,
      initialFocus = false,
      numberOfMonths = 1,
      defaultMonth = new Date(),
      showOutsideDays = true,
      fixedWeeks = false,
      className,
      ...props
    },
    ref
  ) => {
    // Get initial month from selected date or default
    const getInitialMonth = () => {
      if (selected instanceof Date) {
        return selected;
      } else if (Array.isArray(selected) && selected.length > 0) {
        return selected[0];
      } else if (selected && "from" in selected && selected.from) {
        return selected.from;
      }
      return defaultMonth;
    };

    const [month, setMonth] = useState<Date>(getInitialMonth());
    const [view, setView] = useState<"month" | "year">("month");

    // Update month when selected changes
    useEffect(() => {
      const newMonth = getInitialMonth();
      if (newMonth && !isSameMonth(month, newMonth)) {
        setMonth(newMonth);
      }
    }, [selected, month]);

    // Navigation handlers
    const handlePreviousMonth = useCallback(() => {
      setMonth((prev) => subMonths(prev, 1));
    }, []);

    const handleNextMonth = useCallback(() => {
      setMonth((prev) => addMonths(prev, 1));
    }, []);

    const handlePreviousYear = useCallback(() => {
      setMonth((prev) => subYears(prev, 1));
    }, []);

    const handleNextYear = useCallback(() => {
      setMonth((prev) => addYears(prev, 1));
    }, []);

    const handleToday = useCallback(() => {
      setMonth(new Date());
    }, []);

    const handleSelectMonth = useCallback((monthIndex: number) => {
      setMonth((prev) => {
        const date = new Date(prev);
        date.setMonth(monthIndex);
        return date;
      });
      setView("month");
    }, []);

    const handleViewChange = useCallback((newView: 'month' | 'year') => {
      setView(newView);
    }, []);

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        switch (e.key) {
          case "PageUp":
            e.preventDefault();
            if (e.shiftKey) {
              handlePreviousYear();
            } else {
              handlePreviousMonth();
            }
            break;
          case "PageDown":
            e.preventDefault();
            if (e.shiftKey) {
              handleNextYear();
            } else {
              handleNextMonth();
            }
            break;
          case "Home":
            e.preventDefault();
            handleToday();
            break;
        }
      },
      [handlePreviousMonth, handleNextMonth, handlePreviousYear, handleNextYear, handleToday]
    );

    return (
      <div
        ref={ref}
        className={cn("p-3", className)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="application"
        aria-label="Calendar"
        {...props}
      >
        <CalendarHeader
          currentDate={month}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
          onToday={handleToday}
          onPreviousYear={handlePreviousYear}
          onNextYear={handleNextYear}
          view={view}
          onViewChange={handleViewChange}
        />
        
        <div 
          className="mt-2" 
          aria-live="polite"
        >
          {view === "month" ? (
            <DayPicker
              mode={mode}
              selected={selected}
              onSelect={onSelect}
              disabled={disabled}
              month={month}
              onMonthChange={setMonth}
              numberOfMonths={numberOfMonths}
              showOutsideDays={showOutsideDays}
              fixedWeeks={fixedWeeks}
              initialFocus={initialFocus}
              hideHead={false}
              captionLayout="buttons"
              fromYear={1900}
              toYear={2100}
              modifiers={{
                today: new Date(),
              }}
              modifiersClassNames={{
                today: "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50",
                selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                disabled: "text-gray-400 opacity-50 cursor-not-allowed",
              }}
              className="w-full border-collapse space-y-1"
              classNames={{
                months: "flex flex-col space-y-4",
                month: "space-y-4",
                caption: "flex justify-center relative items-center",
                caption_label: "hidden", // Hide default caption
                nav: "hidden", // Hide default navigation
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell: "text-xs font-medium text-center text-gray-500 w-9 rounded-md",
                row: "flex w-full mt-2",
                cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-transparent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50",
                day_disabled: "text-gray-400 opacity-50 cursor-not-allowed",
                day_outside: "text-gray-400 opacity-50",
                day_range_middle: "aria-selected:bg-gray-100 aria-selected:text-gray-900 dark:aria-selected:bg-gray-800 dark:aria-selected:text-gray-50",
                day_range_end: "aria-selected:bg-primary aria-selected:text-primary-foreground",
                day_range_start: "aria-selected:bg-primary aria-selected:text-primary-foreground",
                day_hidden: "invisible",
              }}
            />
          ) : (
            <CalendarYearView
              year={month.getFullYear()}
              onSelectMonth={handleSelectMonth}
            />
          )}
        </div>
      </div>
    );
  }
);

Calendar.displayName = "Calendar";

export { Calendar, type DateRange, type CalendarProps };