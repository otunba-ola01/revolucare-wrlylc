import React, { useState, useCallback } from 'react'; // React v18.0+
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../ui/card';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Checkbox } from '../ui/checkbox';
import { FileUpload } from '../common/file-upload';
import { useForm } from '../../hooks/use-form';
import { useDocumentUpload } from '../../hooks/use-documents';
import { useAuth } from '../../hooks/use-auth';
import { documentUploadSchema } from '../../lib/schemas/document';
import {
  DocumentType,
  DocumentAnalysisType,
  DOCUMENT_TYPE_LABELS,
  ALLOWED_MIME_TYPES,
} from '../../types/document';
import { cn } from '../../lib/utils/color';

/**
 * Props interface for the DocumentUpload component
 */
export interface DocumentUploadProps {
  /**
   * Callback function called when document upload is complete
   */
  onUploadComplete: (document: Document) => void;
  /**
   * Optional default document type
   */
  defaultType?: DocumentType;
  /**
   * Optional flag to show or hide the metadata form
   */
  showMetadataForm?: boolean;
  /**
   * Optional flag to automatically analyze the document after upload
   */
  autoAnalyze?: boolean;
  /**
   * Optional analysis type to use when autoAnalyze is true
   */
  analysisType?: DocumentAnalysisType;
  /**
   * Optional additional CSS classes
   */
  className?: string;
}

/**
 * Formats file size in bytes to a human-readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${units[i]}`;
}

/**
 * A component that provides a comprehensive document upload interface with metadata form
 */
const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUploadComplete,
  defaultType,
  showMetadataForm,
  autoAnalyze,
  analysisType,
  className,
}) => {
  // Get current user information from useAuth hook
  const auth = useAuth();

  // Initialize form using useForm hook with documentUploadSchema validation
  const form = useForm({
    defaultValues: {
      file: null,
      type: defaultType || DocumentType.OTHER,
      metadata: {
        title: '',
        description: '',
        tags: [],
        category: '',
        documentDate: undefined,
        source: '',
        isConfidential: false,
      },
      ownerId: auth.user?.id,
      autoAnalyze: autoAnalyze || false,
    },
    validationSchema: documentUploadSchema,
    onSubmit: async (values) => {
      try {
        // Call the document upload mutation
        await documentUpload.mutateAsync(values);
      } catch (error: any) {
        // Handle form submission error
        console.error('Document upload failed:', error);
        form.setError('file', {
          type: 'upload',
          message: error.message || 'Failed to upload document',
        });
      }
    },
  });

  // Initialize document upload mutation using useDocumentUpload hook
  const documentUpload = useDocumentUpload({
    onSuccess: (document) => {
      // Call the onUploadComplete callback
      onUploadComplete(document);
      // Reset the form after successful upload
      form.reset();
    },
  });

  // Implement handleFileSelect function to update the selected file in the form
  const handleFileSelect = useCallback(
    (file: File) => {
      form.setValue('file', file);
    },
    [form.setValue]
  );

  // Render a Card component with appropriate sections
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Upload Document</CardTitle>
        <CardDescription>
          Upload medical records and other document types with metadata.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(form.formState.handleSubmit)} className="space-y-4">
            {/* Render FileUpload component for file selection and drag-and-drop */}
            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>File</FormLabel>
                  <FormControl>
                    <FileUpload
                      onFileSelect={(files) => field.onChange(files[0])}
                      errorMessage={form.formState.errors.file?.message}
                      acceptedFileTypes={ALLOWED_MIME_TYPES}
                      maxFileSize={10 * 1024 * 1024}
                      disabled={documentUpload.isLoading}
                    />
                  </FormControl>
                  <FormMessage>{form.formState.errors.file?.message}</FormMessage>
                </FormItem>
              )}
            />

            {/* Render metadata form fields when showMetadataForm is true */}
            {showMetadataForm && (
              <>
                {/* Render document type selection dropdown */}
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a document type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage>{form.formState.errors.type?.message}</FormMessage>
                    </FormItem>
                  )}
                />

                {/* Render title and description fields for document metadata */}
                <FormField
                  control={form.control}
                  name="metadata.title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Document Title" {...field} />
                      </FormControl>
                      <FormMessage>{form.formState.errors.metadata?.title?.message}</FormMessage>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="metadata.description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Document Description" {...field} />
                      </FormControl>
                      <FormMessage>{form.formState.errors.metadata?.description?.message}</FormMessage>
                    </FormItem>
                  )}
                />

                {/* Render tags input for document categorization */}
                <FormField
                  control={form.control}
                  name="metadata.tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input placeholder="Tags (comma separated)" {...field} />
                      </FormControl>
                      <FormDescription>Separate tags with commas.</FormDescription>
                      <FormMessage>{form.formState.errors.metadata?.tags?.message}</FormMessage>
                    </FormItem>
                  )}
                />

                {/* Render confidentiality toggle for sensitive documents */}
                <FormField
                  control={form.control}
                  name="metadata.isConfidential"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Confidential</FormLabel>
                        <FormDescription>Mark as confidential.</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Render auto-analyze toggle when applicable */}
            {autoAnalyze !== false && (
              <FormField
                control={form.control}
                name="autoAnalyze"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Auto Analyze</FormLabel>
                      <FormDescription>Automatically analyze document after upload.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            {/* Render form submission button with appropriate loading state */}
            <Button type="submit" disabled={documentUpload.isLoading}>
              {documentUpload.isLoading ? 'Uploading...' : 'Upload'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export { DocumentUpload };