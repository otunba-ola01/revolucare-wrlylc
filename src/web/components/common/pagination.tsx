import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { getPaginationRange } from '../../hooks/use-pagination';
import { PaginationInfo } from '../../types/api';
import { cn } from '../../lib/utils/color';

/**
 * Props for the Pagination component
 */
export interface PaginationProps {
  /**
   * The pagination information object containing current page, limit, total items, etc.
   */
  pagination: PaginationInfo;
  
  /**
   * Callback function triggered when a page is changed
   */
  onPageChange: (page: number) => void;
  
  /**
   * Callback function triggered when the page size is changed
   */
  onPageSizeChange?: (pageSize: number) => void;
  
  /**
   * Available options for page size selection
   */
  pageSizeOptions?: number[];
  
  /**
   * Additional CSS class name
   */
  className?: string;
  
  /**
   * Whether to show the page size selector
   * @default true
   */
  showPageSize?: boolean;
  
  /**
   * Whether to show page information text (e.g., "Page 2 of 10")
   * @default true
   */
  showPageInfo?: boolean;
  
  /**
   * Whether to show first/last page buttons
   * @default true
   */
  showFirstLastButtons?: boolean;
  
  /**
   * Maximum number of page buttons to display
   * @default 5
   */
  maxPageButtons?: number;
}

/**
 * A reusable pagination component that provides navigation controls for paginated data.
 * Supports page numbers, navigation buttons, and page size selection.
 */
const Pagination: React.FC<PaginationProps> = ({
  pagination,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions,
  className,
  showPageSize = true,
  showPageInfo = true,
  showFirstLastButtons = true,
  maxPageButtons = 5,
}) => {
  // Extract pagination info
  const { page, limit, totalItems, totalPages, hasNextPage, hasPreviousPage } = pagination;
  
  // Generate array of page numbers to display
  const pageNumbers = getPaginationRange(page, totalPages, maxPageButtons);
  
  // Navigation handlers
  const goToFirstPage = () => {
    if (page !== 1) {
      onPageChange(1);
    }
  };
  
  const goToPreviousPage = () => {
    if (hasPreviousPage) {
      onPageChange(page - 1);
    }
  };
  
  const goToNextPage = () => {
    if (hasNextPage) {
      onPageChange(page + 1);
    }
  };
  
  const goToLastPage = () => {
    if (page !== totalPages) {
      onPageChange(totalPages);
    }
  };
  
  const goToPage = (pageNumber: number) => {
    if (page !== pageNumber) {
      onPageChange(pageNumber);
    }
  };
  
  const handlePageSizeChange = (value: string) => {
    if (onPageSizeChange) {
      onPageSizeChange(Number(value));
    }
  };
  
  // No items to paginate
  if (totalItems === 0 || totalPages <= 1) {
    return null;
  }
  
  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-4 py-2",
        className
      )}
    >
      {/* Page size selector */}
      {showPageSize && pageSizeOptions && onPageSizeChange && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">Show</span>
          <Select
            value={String(limit)}
            onValueChange={handlePageSizeChange}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={limit.toString()} />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-700">items</span>
        </div>
      )}
      
      {/* Pagination controls */}
      <div className="flex items-center space-x-1">
        {/* First page button */}
        {showFirstLastButtons && (
          <Button
            variant="outline"
            size="icon"
            className="hidden sm:flex h-8 w-8"
            onClick={goToFirstPage}
            disabled={!hasPreviousPage}
            aria-label="Go to first page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        )}
        
        {/* Previous page button */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={goToPreviousPage}
          disabled={!hasPreviousPage}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        {/* Page number buttons */}
        <div className="flex items-center space-x-1">
          {pageNumbers.map((pageNumber) => (
            <Button
              key={pageNumber}
              variant={pageNumber === page ? "primary" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(pageNumber)}
              aria-label={`Page ${pageNumber}`}
              aria-current={pageNumber === page ? "page" : undefined}
            >
              {pageNumber}
            </Button>
          ))}
        </div>
        
        {/* Next page button */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={goToNextPage}
          disabled={!hasNextPage}
          aria-label="Go to next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        {/* Last page button */}
        {showFirstLastButtons && (
          <Button
            variant="outline"
            size="icon"
            className="hidden sm:flex h-8 w-8"
            onClick={goToLastPage}
            disabled={!hasNextPage}
            aria-label="Go to last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Page info text */}
      {showPageInfo && (
        <div className="text-sm text-gray-700 hidden md:flex whitespace-nowrap">
          Page {page} of {totalPages}
          {totalItems > 0 && (
            <span className="ml-1">
              ({totalItems} {totalItems === 1 ? 'item' : 'items'})
            </span>
          )}
        </div>
      )}
    </nav>
  );
};

export default Pagination;