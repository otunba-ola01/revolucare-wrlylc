import React, { useState, useEffect, useCallback } from 'react'; // react ^18.2.0
import { AlertCircle, FileText, CheckCircle } from 'lucide-react'; // lucide-react: ^0.284.0
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { FileUpload } from '../common/file-upload';
import { ConfidenceScore } from './confidence-score';
import {
  useDocumentUpload,
  useDocumentAnalysis,
  useDocumentAnalysisResult,
} from '../../hooks/use-documents';
import { DocumentType, DocumentAnalysisType } from '../../types/document';
import { CarePlanOptionsResponse } from '../../types/care-plan';
// Define the props for the DocumentAnalysis component
interface DocumentAnalysisProps {
  clientId: string;
  onAnalysisComplete: (options: CarePlanOptionsResponse) => void;
  initialDocuments?: string[];
}

// Define the types for the upload, analysis, and generation statuses
type UploadStatus = 'IDLE' | 'READY' | 'UPLOADING' | 'UPLOADED' | 'ERROR';
type AnalysisStatus = 'IDLE' | 'ANALYZING' | 'ANALYZED' | 'ERROR';
type GenerationStatus = 'IDLE' | 'GENERATING' | 'GENERATED' | 'ERROR';

// Define the interface for the extracted medical information
interface ExtractedInformation {
  diagnoses: { name: string; onset?: string; details?: string }[];
  medications: { name: string; dosage: string; frequency: string }[];
  allergies: string[];
  conditions: { name: string; details?: string }[];
  confidenceScore: number;
}

/**
 * A component that handles document upload, analysis, and extraction of medical information for care plan generation
 */
export const DocumentAnalysis: React.FC<DocumentAnalysisProps> = ({
  clientId,
  onAnalysisComplete,
  initialDocuments,
}) => {
  // Initialize state variables
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedDocumentIds, setUploadedDocumentIds] = useState<string[]>([]);
  const [analysisIds, setAnalysisIds] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('IDLE');
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('IDLE');
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>('IDLE');
  const [extractedInformation, setExtractedInformation] = useState<ExtractedInformation | null>(null);

  // Use custom hooks for document upload, analysis, and care plan generation
  const {
    mutate: uploadDocuments,
    isLoading: isUploading,
    uploadProgress,
    error: uploadError,
    createUploadRequest,
  } = useDocumentUpload();

  const {
    mutate: analyzeDocuments,
    isLoading: isAnalyzing,
    error: analysisError,
  } = useDocumentAnalysis();

  const {
    mutate: generateCarePlanOptions,
    isLoading: isGenerating,
    error: generationError,
  } = useGenerateCarePlanOptions();

  const { data: analysisResults } = useDocumentAnalysisResult(
    uploadedDocumentIds[0] || '',
    analysisIds[0] || '',
    {
      enabled: analysisStatus === 'ANALYZED' && uploadedDocumentIds.length > 0 && analysisIds.length > 0,
      onSuccess: (data) => {
        // Extract relevant information from the analysis results
        setExtractedInformation({
          diagnoses: data?.results?.diagnoses || [],
          medications: data?.results?.medications || [],
          allergies: data?.results?.allergies || [],
          conditions: data?.results?.conditions || [],
          confidenceScore: data?.results?.confidence?.score || 0,
        });
      },
    }
  );

  // Implement useEffect to handle initialDocuments if provided
  useEffect(() => {
    if (initialDocuments && initialDocuments.length > 0) {
      setUploadedDocumentIds(initialDocuments);
      setAnalysisStatus('ANALYZED');
    }
  }, [initialDocuments]);

  // Implement handleFileSelect function to process selected files
  const handleFileSelect = (files: File[]) => {
    setSelectedFiles(files);
    setExtractedInformation(null);
    setUploadStatus('READY');
  };

  // Implement handleUpload function to upload documents
  const handleUpload = async () => {
    setUploadStatus('UPLOADING');
    try {
      const uploadPromises = selectedFiles.map((file) => {
        const uploadRequest = createUploadRequest(file, DocumentType.MEDICAL_RECORD, {
          title: file.name,
          tags: [],
          category: 'Medical Records',
          isConfidential: true,
        });
        return new Promise((resolve, reject) => {
          uploadDocuments(uploadRequest, {
            onSuccess: (data) => {
              resolve(data.id);
            },
            onError: (error) => {
              reject(error);
            },
          });
        });
      });

      const documentIds = await Promise.all(uploadPromises);
      setUploadedDocumentIds(documentIds);
      setUploadStatus('UPLOADED');
      setAnalysisStatus('IDLE');
      setAnalysisIds([]);
      handleAnalysis();
    } catch (error) {
      console.error('Error uploading documents:', error);
      setUploadStatus('ERROR');
    }
  };

  // Implement handleAnalysis function to analyze documents
  const handleAnalysis = async () => {
    setAnalysisStatus('ANALYZING');
    try {
      const analysisPromises = uploadedDocumentIds.map((documentId) => {
        const analysisRequest = {
          documentId,
          analysisType: DocumentAnalysisType.MEDICAL_EXTRACTION,
        };
        return new Promise((resolve, reject) => {
          analyzeDocuments(analysisRequest, {
            onSuccess: (data) => {
              resolve(data.id);
            },
            onError: (error) => {
              reject(error);
            },
          });
        });
      });

      const analysisIds = await Promise.all(analysisPromises);
      setAnalysisIds(analysisIds);
      setAnalysisStatus('ANALYZED');
    } catch (error) {
      console.error('Error analyzing documents:', error);
      setAnalysisStatus('ERROR');
    }
  };

  // Implement handleGenerateOptions function to generate care plan options
  const handleGenerateOptions = async () => {
    setGenerationStatus('GENERATING');
    try {
      const generationRequest = {
        clientId,
        documentIds: uploadedDocumentIds,
        additionalContext: {},
        includeOptions: true,
        optionsCount: 3,
      };

      generateCarePlanOptions(generationRequest, {
        onSuccess: (options) => {
          onAnalysisComplete(options);
          setGenerationStatus('GENERATED');
        },
        onError: (error) => {
          console.error('Error generating care plan options:', error);
          setGenerationStatus('ERROR');
        },
      });
    } catch (error) {
      console.error('Error generating care plan options:', error);
      setGenerationStatus('ERROR');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Analysis</CardTitle>
        <CardDescription>
          Upload medical records and extract relevant information for care plan generation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FileUpload onFileSelect={handleFileSelect} multiple>
          {uploadStatus === 'UPLOADING' ? (
            <Progress value={uploadProgress} />
          ) : (
            <p>Drag and drop files here or click to browse.</p>
          )}
        </FileUpload>

        {uploadedDocumentIds.length > 0 && (
          <div className="mt-4">
            <CardTitle>Uploaded Documents</CardTitle>
            {uploadedDocumentIds.map((documentId, index) => (
              <div key={documentId} className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Document {index + 1}</span>
                {analysisStatus === 'ANALYZED' && analysisResults ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
              </div>
            ))}
          </div>
        )}

        {analysisStatus === 'ANALYZING' && (
          <div className="mt-4">
            <CardTitle>Analyzing Documents</CardTitle>
            <Progress value={50} />
          </div>
        )}

        {extractedInformation && (
          <div className="mt-4">
            <CardTitle>Extracted Information</CardTitle>
            <ConfidenceScore score={extractedInformation.confidenceScore} />
            {/* Display extracted information here */}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="secondary" onClick={handleUpload} disabled={uploadStatus === 'UPLOADING'}>
          Upload Documents
        </Button>
        <Button onClick={handleGenerateOptions} disabled={generationStatus === 'GENERATING'}>
          Generate Care Plan Options
        </Button>
      </CardFooter>
    </Card>
  );
};