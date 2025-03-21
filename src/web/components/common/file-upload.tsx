import React, { useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Upload, File, AlertCircle } from 'lucide-react'; // ^0.284.0
import { cn } from '../../lib/utils/color';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { DOCUMENT_MAX_SIZE, ALLOWED_MIME_TYPES } from '../../types/document';

/**
 * Formats file size in bytes to a human-readable format
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${units[i]}`;
};

/**
 * Maps MIME types to user-friendly format names
 */
const getFileTypeDescriptions = (mimeTypes: string[]): string => {
  const typeMap: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/msword': 'DOC',
    'image/jpeg': 'JPEG',
    'image/png': 'PNG',
    'image/tiff': 'TIFF',
    'application/xml': 'XML',
    'application/json': 'JSON'
  };
  
  return mimeTypes.map(type => typeMap[type] || type.split('/')[1].toUpperCase()).join(', ');
};

/**
 * Methods exposed via ref
 */
export interface FileUploadHandle {
  /**
   * Opens the file selection dialog
   */
  open: () => void;
  
  /**
   * Clears the selected files
   */
  reset: () => void;
}

/**
 * Props for the FileUpload component
 */
export interface FileUploadProps {
  /**
   * Called when files are selected
   */
  onFileSelect: (files: File[]) => void;
  
  /**
   * Optional callback for tracking upload progress
   */
  onUploadProgress?: (progress: number) => void;
  
  /**
   * Allowed file types (defaults to ALLOWED_MIME_TYPES)
   */
  acceptedFileTypes?: string[];
  
  /**
   * Maximum file size in bytes (defaults to DOCUMENT_MAX_SIZE - 10MB)
   */
  maxFileSize?: number;
  
  /**
   * Whether multiple files can be selected
   */
  multiple?: boolean;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Custom content to render inside the upload area
   */
  children?: React.ReactNode;
  
  /**
   * Upload progress value (0-100)
   */
  progress?: number;
  
  /**
   * External error message to display
   */
  errorMessage?: string;
  
  /**
   * ID for the file input element
   */
  id?: string;
  
  /**
   * Disabled state
   */
  disabled?: boolean;
  
  /**
   * Selected files (for controlled component usage)
   */
  value?: File[];
  
  /**
   * Called when files are cleared
   */
  onClear?: () => void;
}

/**
 * A reusable file upload component that provides drag-and-drop functionality,
 * file selection, and upload progress tracking.
 */
const FileUpload = forwardRef<FileUploadHandle, FileUploadProps>(({
  onFileSelect,
  onUploadProgress,
  acceptedFileTypes = ALLOWED_MIME_TYPES,
  maxFileSize = DOCUMENT_MAX_SIZE,
  multiple = false,
  className,
  children,
  progress = 0,
  errorMessage,
  id,
  disabled = false,
  value,
  onClear,
  ...props
}, ref) => {
  // State
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>(value || []);
  const [internalError, setInternalError] = useState<string | null>(null);
  
  // Use provided error message or internal error
  const error = errorMessage || internalError;
  
  // Internal ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Create a unique ID if not provided
  const inputId = id || `file-upload-${React.useId()}`;
  
  // Update selected files when value changes
  React.useEffect(() => {
    if (value) {
      setSelectedFiles(value);
    }
  }, [value]);
  
  // Expose imperative methods to parent
  useImperativeHandle(ref, () => ({
    open: () => {
      if (fileInputRef.current && !disabled) {
        fileInputRef.current.click();
      }
    },
    reset: () => {
      setSelectedFiles([]);
      setInternalError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (onClear) {
        onClear();
      }
    }
  }));
  
  // Handle file selection
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setInternalError(null);
    
    // Convert FileList to array for easier manipulation
    const fileArray = Array.from(files);
    
    // Validate file types
    const invalidTypeFiles = fileArray.filter(file => !acceptedFileTypes.includes(file.type));
    if (invalidTypeFiles.length > 0) {
      setInternalError(`Invalid file type${invalidTypeFiles.length > 1 ? 's' : ''}. Accepted types: ${getFileTypeDescriptions(acceptedFileTypes)}`);
      return;
    }
    
    // Validate file size
    const oversizedFiles = fileArray.filter(file => file.size > maxFileSize);
    if (oversizedFiles.length > 0) {
      setInternalError(`File${oversizedFiles.length > 1 ? 's' : ''} exceed${oversizedFiles.length === 1 ? 's' : ''} maximum size of ${formatFileSize(maxFileSize)}`);
      return;
    }
    
    // Set selected files
    const newFiles = multiple ? fileArray : [fileArray[0]];
    setSelectedFiles(newFiles);
    
    // Call the onFileSelect callback
    onFileSelect(newFiles);
  }, [acceptedFileTypes, maxFileSize, multiple, onFileSelect]);
  
  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, [disabled]);
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  }, [isDragging, disabled]);
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, [disabled]);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const { files } = e.dataTransfer;
    handleFileSelect(files);
  }, [handleFileSelect, disabled]);
  
  // Handle button click
  const handleButtonClick = useCallback(() => {
    if (disabled) return;
    
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  // Handle clear button click
  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFiles([]);
    setInternalError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onClear) {
      onClear();
    }
  }, [onClear]);
  
  // Handle file input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  }, [handleFileSelect]);
  
  // Handle keyboard interaction for accessibility
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    
    // Trigger file selection on Enter or Space
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleButtonClick();
    }
  }, [handleButtonClick, disabled]);
  
  // Report progress to parent if callback provided
  React.useEffect(() => {
    if (onUploadProgress && progress > 0) {
      onUploadProgress(progress);
    }
  }, [progress, onUploadProgress]);
  
  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center w-full min-h-[200px] p-6 border-2 border-dashed rounded-lg transition-colors',
        isDragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' : 'border-gray-300 bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700',
        selectedFiles.length > 0 ? 'bg-white dark:bg-gray-800' : '',
        error ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : '',
        disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
        className
      )}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleButtonClick}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-disabled={disabled}
      aria-describedby={error ? `${inputId}-error` : undefined}
      aria-label={`Upload ${multiple ? 'files' : 'file'}`}
    >
      {/* Hidden file input */}
      <input
        type="file"
        id={inputId}
        ref={fileInputRef}
        className="hidden"
        accept={acceptedFileTypes.join(',')}
        multiple={multiple}
        onChange={handleInputChange}
        disabled={disabled}
        aria-hidden="true"
        {...props}
      />
      
      {/* Display area based on state */}
      {selectedFiles.length === 0 ? (
        // No files selected
        <div className="flex flex-col items-center justify-center space-y-4">
          {children || (
            <>
              <Upload
                className="w-12 h-12 text-gray-400 dark:text-gray-500"
                aria-hidden="true"
              />
              <div className="flex flex-col items-center space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Drag and drop your {multiple ? 'files' : 'file'} here
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  or
                </p>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleButtonClick();
                  }}
                  size="sm"
                  disabled={disabled}
                >
                  Browse Files
                </Button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {`Maximum file size: ${formatFileSize(maxFileSize)}`}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {`Accepted formats: ${getFileTypeDescriptions(acceptedFileTypes)}`}
                </p>
              </div>
            </>
          )}
        </div>
      ) : (
        // Files selected
        <div className="w-full space-y-4">
          {selectedFiles.map((file, index) => (
            <div 
              key={`${file.name}-${index}`} 
              className="flex items-center space-x-3 bg-white dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700"
            >
              <File 
                className="w-6 h-6 text-indigo-500 dark:text-indigo-400 flex-shrink-0"
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(file.size)}
                </p>
                {progress > 0 && progress < 100 && (
                  <Progress 
                    value={progress} 
                    className="mt-2" 
                    size="sm"
                    color="primary"
                    aria-label={`Upload progress: ${progress}%`}
                  />
                )}
              </div>
            </div>
          ))}
          
          {/* Buttons for file operations */}
          <div className="flex justify-center space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={(e) => {
                e.stopPropagation();
                handleButtonClick();
              }}
              size="sm"
              disabled={disabled}
            >
              {multiple ? 'Select Different Files' : 'Select Different File'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClear}
              size="sm"
              disabled={disabled}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div 
          id={`${inputId}-error`}
          className="absolute -bottom-10 left-0 right-0 flex items-center text-sm text-red-500 mt-2"
          aria-live="polite"
        >
          <AlertCircle 
            className="w-4 h-4 mr-1 flex-shrink-0"
            aria-hidden="true"
          />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
});

FileUpload.displayName = "FileUpload";

export { FileUpload };
export type { FileUploadProps, FileUploadHandle };