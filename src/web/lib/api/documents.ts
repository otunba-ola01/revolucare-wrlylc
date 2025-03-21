/**
 * API client for document management operations in the Revolucare platform.
 * Provides functions to interact with backend document API endpoints.
 * @version 1.0.0
 */

import { get, post, put, delete as deleteRequest, formatQueryParams } from './client';
import { ApiEndpoint } from '../../types/api';
import { 
  Document, 
  DocumentUploadRequest, 
  DocumentAnalysisRequest, 
  DocumentFilterOptions, 
  DocumentListResponse, 
  DocumentAnalysis, 
  SignedUrlResponse,
  DocumentMetadata,
  DocumentType
} from '../../types/document';

/**
 * Uploads a document to the server with metadata
 * 
 * @param request - The document upload request containing file and metadata
 * @returns Promise resolving to the uploaded document information
 */
export async function uploadDocument(request: DocumentUploadRequest): Promise<Document> {
  const formData = new FormData();
  
  // Append the file to the FormData
  formData.append('file', request.file);
  
  // Append document type to the FormData
  formData.append('type', request.type);
  
  // Convert metadata to JSON string and append to FormData
  formData.append('metadata', JSON.stringify(request.metadata));
  
  // If ownerId is provided, append it to FormData
  if (request.ownerId) {
    formData.append('ownerId', request.ownerId);
  }
  
  // If autoAnalyze flag is provided, append it to FormData
  if (request.autoAnalyze !== undefined) {
    formData.append('autoAnalyze', String(request.autoAnalyze));
  }
  
  // Make POST request to document upload endpoint
  const response = await post<Document>(
    `${ApiEndpoint.DOCUMENTS}/upload`,
    formData,
    {
      headers: {
        // Don't set Content-Type here as it will be set automatically with boundary for FormData
      }
    }
  );
  
  return response;
}

/**
 * Retrieves a document by its ID
 * 
 * @param documentId - The ID of the document to retrieve
 * @returns Promise resolving to the requested document information
 */
export async function getDocument(documentId: string): Promise<Document> {
  return await get<Document>(`${ApiEndpoint.DOCUMENTS}/${documentId}`);
}

/**
 * Retrieves a list of documents with optional filtering and pagination
 * 
 * @param options - Filter and pagination options
 * @returns Promise resolving to paginated list of documents matching the filter criteria
 */
export async function listDocuments(options: DocumentFilterOptions): Promise<DocumentListResponse> {
  const queryParams = formatQueryParams(options);
  return await get<DocumentListResponse>(`${ApiEndpoint.DOCUMENTS}${queryParams}`);
}

/**
 * Deletes a document by its ID
 * 
 * @param documentId - The ID of the document to delete
 * @param permanent - Optional flag to permanently delete the document (default: false)
 * @returns Promise resolving to void on successful deletion
 */
export async function deleteDocument(documentId: string, permanent?: boolean): Promise<void> {
  const queryParams = permanent ? formatQueryParams({ permanent: true }) : '';
  await deleteRequest<void>(`${ApiEndpoint.DOCUMENTS}/${documentId}${queryParams}`);
}

/**
 * Initiates analysis of a document with specified analysis type
 * 
 * @param request - The document analysis request parameters
 * @returns Promise resolving to the analysis results or status
 */
export async function analyzeDocument(request: DocumentAnalysisRequest): Promise<DocumentAnalysis> {
  const { documentId, analysisType, options } = request;
  
  return await post<DocumentAnalysis>(
    `${ApiEndpoint.DOCUMENTS}/${documentId}/analyze`,
    {
      analysisType,
      options: options || {}
    }
  );
}

/**
 * Retrieves the analysis results for a document
 * 
 * @param documentId - The ID of the document
 * @param analysisId - The ID of the analysis to retrieve
 * @returns Promise resolving to the document analysis results
 */
export async function getDocumentAnalysis(documentId: string, analysisId: string): Promise<DocumentAnalysis> {
  return await get<DocumentAnalysis>(`${ApiEndpoint.DOCUMENTS}/${documentId}/analysis/${analysisId}`);
}

/**
 * Updates the metadata of an existing document
 * 
 * @param documentId - The ID of the document to update
 * @param metadata - The metadata fields to update
 * @returns Promise resolving to the updated document information
 */
export async function updateDocumentMetadata(documentId: string, metadata: Partial<DocumentMetadata>): Promise<Document> {
  return await put<Document>(
    `${ApiEndpoint.DOCUMENTS}/${documentId}/metadata`,
    { metadata }
  );
}

/**
 * Generates a signed URL for secure document access
 * 
 * @param documentId - The ID of the document
 * @param options - Optional configuration for the signed URL (expiration, etc.)
 * @returns Promise resolving to the signed URL and expiration information
 */
export async function getSignedUrl(documentId: string, options: {
  expiresIn?: number;
  download?: boolean;
} = {}): Promise<SignedUrlResponse> {
  const queryParams = formatQueryParams(options);
  return await get<SignedUrlResponse>(`${ApiEndpoint.DOCUMENTS}/${documentId}/signedUrl${queryParams}`);
}

/**
 * Generates a URL for downloading a document
 * 
 * @param documentId - The ID of the document
 * @returns The download URL for the document
 */
export function getDownloadUrl(documentId: string): string {
  return `${ApiEndpoint.DOCUMENTS}/${documentId}/download`;
}

export {
  uploadDocument,
  getDocument,
  listDocuments,
  deleteDocument,
  analyzeDocument,
  getDocumentAnalysis,
  updateDocumentMetadata,
  getSignedUrl,
  getDownloadUrl
};