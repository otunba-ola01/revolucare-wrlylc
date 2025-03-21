import React, { useState, useEffect, useMemo, useCallback } from 'react' // React ^18.2.0
import { ArrowUpDown, ArrowUp, ArrowDown, Download, Filter, X } from 'lucide-react' // v0.284.0
import { Button } from '../ui/button' // src/web/components/ui/button.tsx
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../ui/card' // src/web/components/ui/card.tsx
import { Pagination } from '../common/pagination' // src/web/components/common/pagination.tsx
import { SearchBar } from '../common/search-bar' // src/web/components/common/search-bar.tsx
import { FilterBar } from '../common/filter-bar' // src/web/components/common/filter-bar.tsx
import { ExportButton } from './export-button' // src/web/components/analytics/export-button.tsx
import { DateRangePicker } from './date-range-picker' // src/web/components/analytics/date-range-picker.tsx
import { cn } from '../../lib/utils/color' // src/web/lib/utils/color.ts
import { formatDate } from '../../lib/utils/date' // src/web/lib/utils/date.ts
import { formatNumber } from '../../lib/utils/format' // src/web/lib/utils/format.ts
import { PaginationInfo } from '../../types/api' // src/web/types/api.ts
import { useMediaQuery } from '../../hooks/use-media-query' // src/web/hooks/use-media-query.ts

/**
 * @interface DataTableColumn
 * @description Interface for column configuration in the DataTable
 */
export interface DataTableColumn<T> {
  /**
   * @property id - Unique identifier for the column
   */
  id: string
  /**
   * @property header - Header text for the column
   */
  header: string
  /**
   * @property accessor - Key to access data in the row or a function to transform the data
   */
  accessor: string | ((row: T) => any)
  /**
   * @property cell - Custom rendering function for the cell value
   */
  cell?: (value: any, row: T) => React.ReactNode
  /**
   * @property sortable - Whether the column is sortable
   */
  sortable?: boolean
  /**
   * @property filterable - Whether the column is filterable
   */
  filterable?: boolean
  /**
   * @property type - Data type of the column ('string', 'number', 'date', 'boolean', 'custom')
   */
  type?: 'string' | 'number' | 'date' | 'boolean' | 'custom'
  /**
   * @property width - CSS width value for the column
   */
  width?: string
  /**
   * @property className - CSS class name for the column
   */
  className?: string
  /**
   * @property hidden - Whether the column is hidden
   */
  hidden?: boolean
}

/**
 * @interface DataTableProps
 * @description Props interface for the DataTable component
 */
export interface DataTableProps<T> {
  /**
   * @property data - Array of data to display in the table
   */
  data: T[]
  /**
   * @property columns - Array of column configurations
   */
  columns: DataTableColumn<T>[]
  /**
   * @property title - Title of the data table
   */
  title: string
  /**
   * @property description - Description of the data table
   */
  description?: string
  /**
   * @property pagination - Pagination information for the table
   */
  pagination?: PaginationInfo
  /**
   * @property onPageChange - Callback function when the page changes
   */
  onPageChange?: (page: number) => void
  /**
   * @property onPageSizeChange - Callback function when the page size changes
   */
  onPageSizeChange?: (pageSize: number) => void
  /**
   * @property onSort - Callback function when a column is sorted
   */
  onSort?: (column: string, direction: 'asc' | 'desc') => void
  /**
   * @property onFilter - Callback function when filters are applied
   */
  onFilter?: (filters: Record<string, any>) => void
  /**
   * @property onSearch - Callback function when a search term is entered
   */
  onSearch?: (term: string) => void
  /**
   * @property onDateRangeChange - Callback function when the date range changes
   */
  onDateRangeChange?: (range: { from: Date; to: Date }) => void
  /**
   * @property onRowClick - Callback function when a row is clicked
   */
  onRowClick?: (row: T) => void
  /**
   * @property loading - Whether the table is loading data
   */
  loading?: boolean
  /**
   * @property error - Error message to display if there is an error
   */
  error?: string | null
  /**
   * @property showSearch - Whether to show the search bar
   */
  showSearch?: boolean
  /**
   * @property showFilters - Whether to show the filter bar
   */
  showFilters?: boolean
  /**
   * @property showDateFilter - Whether to show the date range filter
   */
  showDateFilter?: boolean
  /**
   * @property showExport - Whether to show the export button
   */
  showExport?: boolean
  /**
   * @property exportOptions - Options for exporting the table data
   */
  exportOptions?: { filename: string; dataType: string }
  /**
   * @property className - CSS class name for the table
   */
  className?: string
}

/**
 * @function formatCellValue
 * @description Formats cell values based on their data type
 * @param value any
 * @param type string
 * @returns string | JSX.Element Formatted cell value
 */
const formatCellValue = (value: any, type: string): string | JSX.Element => {
  if (value === null || value === undefined) {
    return '-'
  }
  if (type === 'date') {
    return formatDate(value)
  }
  if (type === 'number') {
    return formatNumber(value)
  }
  if (type === 'boolean') {
    return value ? 'Yes' : 'No'
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

/**
 * @function getSortIcon
 * @description Returns the appropriate sort icon based on sort direction
 * @param column string
 * @param sortColumn string
 * @param sortDirection 'asc' | 'desc'
 * @returns JSX.Element Sort icon component
 */
const getSortIcon = (
  column: string,
  sortColumn: string,
  sortDirection: 'asc' | 'desc'
): JSX.Element => {
  if (column !== sortColumn) {
    return <ArrowUpDown className="ml-2 h-4 w-4" aria-hidden="true" />
  }
  if (sortDirection === 'asc') {
    return <ArrowUp className="ml-2 h-4 w-4" aria-hidden="true" />
  }
  return <ArrowDown className="ml-2 h-4 w-4" aria-hidden="true" />
}

/**
 * @component DataTable
 * @description A component that displays tabular data with sorting, filtering, pagination, and export capabilities
 * @param DataTableProps<T> props
 * @returns JSX.Element Rendered data table component
 */
export const DataTable = <T extends Record<string, any>>({
  data,
  columns,
  title,
  description,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSort,
  onFilter,
  onSearch,
  onDateRangeChange,
  onRowClick,
  loading,
  error,
  showSearch = false,
  showFilters = false,
  showDateFilter = false,
  showExport = false,
  exportOptions,
  className,
}: DataTableProps<T>): JSX.Element => {
  // Track sorting state (column and direction)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Track filter state
  const [filters, setFilters] = useState<Record<string, any>>({})

  // Track search term
  const [searchTerm, setSearchTerm] = useState<string>('')

  // Track date range filter
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(
    null
  )

  // Use useMediaQuery hook to determine if the viewport is mobile
  const isMobile = useMediaQuery({ maxWidth: 768 })

  // Implement handleSort function to handle column sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
    onSort?.(column, sortDirection === 'asc' ? 'desc' : 'asc')
  }

  // Implement handleFilter function to handle advanced filtering
  const handleFilter = (filters: Record<string, any>) => {
    setFilters(filters)
    onFilter?.(filters)
  }

  // Implement handleSearch function to handle text search
  const handleSearch = (term: string) => {
    setSearchTerm(term)
    onSearch?.(term)
  }

  // Implement handleDateRangeChange function to handle date filtering
  const handleDateRangeChange = (range: { from: Date; to: Date }) => {
    setDateRange(range)
    onDateRangeChange?.(range)
  }

  // Use useMemo to generate filter configuration based on columns
  const filterConfig = useMemo(() => {
    return columns.filter((column) => column.filterable).map((column) => ({
      id: column.id,
      label: column.header,
      type: column.type || 'text',
      options: column.options,
      placeholder: `Filter by ${column.header}`,
    }))
  }, [columns])

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {/* Table Header with Search, Filter, and Export Controls */}
        <div className="flex items-center justify-between mb-4">
          {showSearch && onSearch && (
            <SearchBar placeholder="Search..." onSearch={handleSearch} />
          )}
          <div className="flex items-center space-x-2">
            {showDateFilter && onDateRangeChange && (
              <DateRangePicker dateRange={dateRange} onDateRangeChange={handleDateRangeChange} />
            )}
            {showFilters && onFilter && filterConfig.length > 0 && (
              <FilterBar
                initialFilters={filters}
                onFilterChange={handleFilter}
                filterConfig={filterConfig}
              />
            )}
            {showExport && exportOptions && (
              <ExportButton dataType={exportOptions.dataType} filters={filters} />
            )}
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="border-b">
                {columns.map((column) => (
                  <th
                    key={column.id}
                    className={cn(
                      'px-4 py-2 text-left font-medium text-gray-700',
                      column.sortable && 'cursor-pointer hover:underline',
                      column.className,
                      column.hidden && 'hidden'
                    )}
                    onClick={column.sortable ? () => handleSort(column.id) : undefined}
                    aria-sort={
                      sortColumn === column.id ? sortDirection : undefined
                    }
                  >
                    {column.header}
                    {column.sortable && getSortIcon(column.id, sortColumn || '', sortDirection)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // Skeleton placeholders for loading state
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`loading-${i}`} className="animate-pulse">
                    {columns.map((column) => (
                      <td
                        key={column.id}
                        className={cn(
                          'px-4 py-2 border-b',
                          column.className,
                          column.hidden && 'hidden'
                        )}
                      >
                        <div className="h-4 bg-gray-200 rounded-md w-3/4"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : error ? (
                // Error message if there is an error
                <tr>
                  <td colSpan={columns.length} className="text-center py-4 text-red-500">
                    {error}
                  </td>
                </tr>
              ) : data.length === 0 ? (
                // Empty data message if there is no data
                <tr>
                  <td colSpan={columns.length} className="text-center py-4">
                    No data available.
                  </td>
                </tr>
              ) : (
                // Table rows with data
                data.map((row, index) => (
                  <tr
                    key={index}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((column) => {
                      let value: any
                      if (typeof column.accessor === 'function') {
                        value = column.accessor(row)
                      } else {
                        value = row[column.accessor as string]
                      }
                      return (
                        <td
                          key={column.id}
                          className={cn(
                            'px-4 py-2',
                            column.className,
                            column.hidden && 'hidden'
                          )}
                        >
                          {column.cell ? column.cell(value, row) : formatCellValue(value, column.type || 'string')}
                        </td>
                      )
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {pagination && onPageChange && (
          <Pagination
            pagination={pagination}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            pageSizeOptions={[10, 20, 50, 100]}
          />
        )}
      </CardContent>
    </Card>
  )
}