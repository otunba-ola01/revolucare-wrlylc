import { useState, useCallback, useMemo } from 'react';
import { PaginationInfo } from '../types/api';

/**
 * Generates an array of page numbers to display in pagination controls
 * 
 * @param currentPage - The current active page
 * @param totalPages - The total number of pages
 * @param maxPageButtons - Maximum number of page buttons to show (default: 5)
 * @returns An array of page numbers to display
 */
export const getPaginationRange = (
  currentPage: number,
  totalPages: number,
  maxPageButtons: number = 5
): number[] => {
  // If we have fewer pages than the max buttons, show all pages
  if (totalPages <= maxPageButtons) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // Calculate how many buttons to show on each side of the current page
  const buttonsPerSide = Math.floor(maxPageButtons / 2);
  
  // Calculate start and end, ensuring we don't go below 1 or above totalPages
  let start = Math.max(1, currentPage - buttonsPerSide);
  let end = Math.min(totalPages, start + maxPageButtons - 1);
  
  // If we're at the end, adjust the start to ensure we show maxPageButtons
  if (end === totalPages) {
    start = Math.max(1, end - maxPageButtons + 1);
  }
  
  // If we're at the start, adjust the end to ensure we show maxPageButtons
  if (start === 1) {
    end = Math.min(totalPages, start + maxPageButtons - 1);
  }
  
  // Generate the array of page numbers
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

/**
 * Calculates pagination metadata based on current page, limit, and total items
 * 
 * @param page - Current page number
 * @param limit - Number of items per page
 * @param totalItems - Total number of items
 * @returns Object containing pagination metadata
 */
export const calculatePaginationInfo = (
  page: number,
  limit: number,
  totalItems: number
): PaginationInfo => {
  // Calculate total pages
  const totalPages = Math.ceil(totalItems / limit);
  
  // Ensure page is within valid range
  const validPage = Math.max(1, Math.min(page, totalPages || 1));
  
  // Calculate if there are next/previous pages
  const hasNextPage = validPage < totalPages;
  const hasPreviousPage = validPage > 1;
  
  return {
    page: validPage,
    limit,
    totalItems,
    totalPages,
    hasNextPage,
    hasPreviousPage
  };
};

/**
 * Options for the usePagination hook
 */
interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
  totalItems: number;
  onChange?: (page: number, limit: number) => void;
}

/**
 * Return type for the pagination hooks
 */
interface UsePaginationReturn {
  page: number;
  limit: number;
  paginationInfo: PaginationInfo;
  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  setPageSize: (pageSize: number) => void;
}

/**
 * A hook that manages pagination state and provides navigation functions
 * 
 * @param options - Configuration options for pagination
 * @returns An object containing pagination state and navigation functions
 */
export const usePagination = (
  options: UsePaginationOptions = { initialPage: 1, initialLimit: 10, totalItems: 0 }
): UsePaginationReturn => {
  const { initialPage = 1, initialLimit = 10, totalItems, onChange } = options;
  
  // State for current page and items per page
  const [page, setPage] = useState<number>(initialPage);
  const [limit, setLimit] = useState<number>(initialLimit);
  
  // Calculate pagination info based on current state
  const paginationInfo = useMemo(() => 
    calculatePaginationInfo(page, limit, totalItems),
    [page, limit, totalItems]
  );
  
  // Navigation functions
  const goToPage = useCallback((newPage: number) => {
    const validPage = Math.max(1, Math.min(newPage, paginationInfo.totalPages || 1));
    setPage(validPage);
    onChange?.(validPage, limit);
  }, [limit, onChange, paginationInfo.totalPages]);
  
  const goToNextPage = useCallback(() => {
    if (paginationInfo.hasNextPage) {
      goToPage(page + 1);
    }
  }, [goToPage, page, paginationInfo.hasNextPage]);
  
  const goToPreviousPage = useCallback(() => {
    if (paginationInfo.hasPreviousPage) {
      goToPage(page - 1);
    }
  }, [goToPage, page, paginationInfo.hasPreviousPage]);
  
  const goToFirstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);
  
  const goToLastPage = useCallback(() => {
    goToPage(paginationInfo.totalPages || 1);
  }, [goToPage, paginationInfo.totalPages]);
  
  const setPageSize = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing page size
    onChange?.(1, newLimit);
  }, [onChange]);
  
  return {
    page,
    limit,
    paginationInfo,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    setPageSize
  };
};

/**
 * Options for the usePaginationWithUrl hook
 */
interface UsePaginationWithUrlOptions {
  defaultPage?: number;
  defaultLimit?: number;
  totalItems: number;
  pageParam?: string;
  limitParam?: string;
}

/**
 * A hook that manages pagination state using URL parameters for persistence.
 * This hook is designed to work with URL parameters but does not directly 
 * manipulate the URL - that responsibility is left to the parent component.
 * 
 * @param options - Configuration options including default values and URL parameter names
 * @returns An object containing pagination state and navigation functions
 */
export const usePaginationWithUrl = (
  options: UsePaginationWithUrlOptions = { 
    defaultPage: 1, 
    defaultLimit: 10, 
    totalItems: 0,
    pageParam: 'page',
    limitParam: 'limit'
  }
): UsePaginationReturn => {
  const { 
    defaultPage = 1, 
    defaultLimit = 10, 
    totalItems,
    pageParam = 'page',
    limitParam = 'limit'
  } = options;
  
  // Helper function to extract a number from URL search params
  const getUrlParamValue = (param: string, defaultValue: number): number => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const value = urlParams.get(param);
        if (value) {
          const parsed = parseInt(value, 10);
          if (!isNaN(parsed) && parsed > 0) {
            return parsed;
          }
        }
      }
    } catch (error) {
      console.error('Error parsing URL parameter:', error);
    }
    return defaultValue;
  };
  
  // Initialize state from URL parameters or defaults
  const [page, setPage] = useState<number>(() => 
    getUrlParamValue(pageParam, defaultPage)
  );
  const [limit, setLimit] = useState<number>(() => 
    getUrlParamValue(limitParam, defaultLimit)
  );
  
  // Calculate pagination info
  const paginationInfo = useMemo(() => 
    calculatePaginationInfo(page, limit, totalItems),
    [page, limit, totalItems]
  );
  
  // Navigation functions
  const goToPage = useCallback((newPage: number) => {
    const validPage = Math.max(1, Math.min(newPage, paginationInfo.totalPages || 1));
    setPage(validPage);
    // URL synchronization should be handled by the parent component
  }, [paginationInfo.totalPages]);
  
  const goToNextPage = useCallback(() => {
    if (paginationInfo.hasNextPage) {
      goToPage(page + 1);
    }
  }, [goToPage, page, paginationInfo.hasNextPage]);
  
  const goToPreviousPage = useCallback(() => {
    if (paginationInfo.hasPreviousPage) {
      goToPage(page - 1);
    }
  }, [goToPage, page, paginationInfo.hasPreviousPage]);
  
  const goToFirstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);
  
  const goToLastPage = useCallback(() => {
    goToPage(paginationInfo.totalPages || 1);
  }, [goToPage, paginationInfo.totalPages]);
  
  const setPageSize = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing page size
    // URL synchronization should be handled by the parent component
  }, []);
  
  return {
    page,
    limit,
    paginationInfo,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    setPageSize
  };
};