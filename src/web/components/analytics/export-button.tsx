import React, { useState } from "react"; // ^18.2.0
import { Download, FileText, FileSpreadsheet, Database } from "lucide-react"; // ^0.284.0
import { Button } from "../ui/button";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuSeparator
} from "../ui/dropdown-menu";
import { cn } from "../../lib/utils/color";
import { exportData } from "../../lib/api/analytics";
import { ExportRequestParams, ReportFormat } from "../../types/analytics";

export interface ExportButtonProps {
  /**
   * Type of data to export (e.g., 'care_plans', 'providers', 'metrics')
   */
  dataType: string;
  
  /**
   * Filters to apply to the exported data
   */
  filters?: Record<string, any>;
  
  /**
   * Available export formats
   */
  formats?: ReportFormat[];
  
  /**
   * Additional CSS class names
   */
  className?: string;
  
  /**
   * Button variant (primary, secondary, outline, etc.)
   */
  variant?: string;
  
  /**
   * Button size (default, sm, lg)
   */
  size?: string;
  
  /**
   * Whether the button is disabled
   */
  disabled?: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  dataType,
  filters = {},
  formats,
  className,
  variant = "outline",
  size = "default",
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);
  
  // Default formats if none provided
  const exportFormats = formats || ["pdf", "csv", "excel"];
  
  /**
   * Handles the export process for the selected format
   * @param format The format to export data in
   */
  const handleExport = async (format: ReportFormat) => {
    setLoading(true);
    
    try {
      // Create export request parameters
      const params: ExportRequestParams = {
        dataType,
        filters,
        format,
      };
      
      // Call API to request export
      const response = await exportData(params);
      
      if (!response.exportUrl) {
        throw new Error("Export URL not provided in response");
      }
      
      // Format filename
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const filename = `revolucare-${dataType}-${date}.${format}`;
      
      // Create download link
      const link = document.createElement("a");
      link.href = response.exportUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Get the appropriate icon for each format
  const getFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case "pdf":
        return <FileText className="mr-2 h-4 w-4" />;
      case "csv":
      case "excel":
        return <FileSpreadsheet className="mr-2 h-4 w-4" />;
      default:
        return <Database className="mr-2 h-4 w-4" />;
    }
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn("gap-2", className)}
          disabled={disabled || loading}
          aria-label="Export data"
        >
          {loading ? (
            <>
              <Download className="h-4 w-4 animate-pulse" />
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Export</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {exportFormats.map((format, index) => (
          <React.Fragment key={format}>
            <DropdownMenuItem 
              onClick={() => handleExport(format)}
              disabled={loading}
            >
              {getFormatIcon(format)}
              <span className="capitalize">{format.toUpperCase()}</span>
            </DropdownMenuItem>
            {index < exportFormats.length - 1 && <DropdownMenuSeparator />}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};