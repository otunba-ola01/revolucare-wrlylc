import express, { Router } from 'express'; // express@^4.18.2
import multer from 'multer'; // multer@^1.4.5-lts.1
import { DocumentsController } from '../controllers/documents.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateBody, validateParams, validateQuery, validateFile } from '../middlewares/validation.middleware';
import { 
  documentIdParamSchema,
  documentAnalysisIdParamSchema,
  documentMetadataSchema,
  documentUploadSchema,
  documentFilterSchema,
  documentAnalysisSchema,
  documentDeleteSchema,
  signedUrlOptionsSchema
} from '../validators/documents.validator';
import { Roles } from '../../constants/roles';
import { DocumentService } from '../../services/documents.service';

/**
 * Creates and configures the documents API router with all document-related endpoints
 * @param documentService - The document service for handling document-related requests
 * @returns Configured Express router with document routes
 */
export default function createDocumentsRouter(documentService: DocumentService): Router {
  // Create a new Express Router instance
  const router = express.Router();

  // Initialize DocumentsController with the provided document service
  const documentsController = new DocumentsController(documentService);

  // Configure multer for file uploads with appropriate storage and limits
  const upload = multer({ 
    storage: multer.memoryStorage(), // Store files in memory for processing
    limits: { fileSize: 25 * 1024 * 1024 } // Limit file size to 25MB
  });

  // Define routes for document operations with proper middleware chains
  // Route for uploading a new document
  router.post(
    '/',
    authenticate,
    authorize([Roles.CLIENT, Roles.PROVIDER, Roles.CASE_MANAGER]),
    upload.single('file'), // Use multer middleware to handle file upload
    validateFile, // Validate the uploaded file
    validateBody(documentUploadSchema), // Validate the request body
    documentsController.uploadDocument.bind(documentsController) // Bind the controller method to the controller instance
  );

  // Route for retrieving a document by ID
  router.get(
    '/:documentId',
    authenticate,
    authorize([Roles.CLIENT, Roles.PROVIDER, Roles.CASE_MANAGER]),
    validateParams(documentIdParamSchema), // Validate the document ID parameter
    documentsController.getDocument.bind(documentsController) // Bind the controller method to the controller instance
  );

  // Route for listing documents with filtering, sorting, and pagination
  router.get(
    '/',
    authenticate,
    authorize([Roles.CLIENT, Roles.PROVIDER, Roles.CASE_MANAGER, Roles.ADMINISTRATOR]),
    validateQuery(documentFilterSchema), // Validate the query parameters
    documentsController.listDocuments.bind(documentsController) // Bind the controller method to the controller instance
  );

  // Route for deleting a document by ID
  router.delete(
    '/:documentId',
    authenticate,
    authorize([Roles.CLIENT, Roles.PROVIDER, Roles.CASE_MANAGER, Roles.ADMINISTRATOR]),
    validateParams(documentDeleteSchema), // Validate the document ID parameter
    documentsController.deleteDocument.bind(documentsController) // Bind the controller method to the controller instance
  );

  // Route for initiating document analysis
  router.post(
    '/:documentId/analyze',
    authenticate,
    authorize([Roles.CASE_MANAGER, Roles.ADMINISTRATOR]),
    validateParams(documentIdParamSchema), // Validate the document ID parameter
    validateBody(documentAnalysisSchema), // Validate the request body
    documentsController.analyzeDocument.bind(documentsController) // Bind the controller method to the controller instance
  );

  // Route for retrieving document analysis results
  router.get(
    '/:documentId/analysis/:analysisId',
    authenticate,
    authorize([Roles.CASE_MANAGER, Roles.ADMINISTRATOR]),
    validateParams(documentAnalysisIdParamSchema), // Validate the document and analysis ID parameters
    documentsController.getDocumentAnalysis.bind(documentsController) // Bind the controller method to the controller instance
  );

  // Route for updating document metadata
  router.put(
    '/:documentId',
    authenticate,
    authorize([Roles.CLIENT, Roles.PROVIDER, Roles.CASE_MANAGER]),
    validateParams(documentIdParamSchema), // Validate the document ID parameter
    validateBody(documentMetadataSchema), // Validate the request body
    documentsController.updateDocumentMetadata.bind(documentsController) // Bind the controller method to the controller instance
  );

  // Route for generating a signed URL for document access
  router.get(
    '/:documentId/signed-url',
    authenticate,
    authorize([Roles.CLIENT, Roles.PROVIDER, Roles.CASE_MANAGER]),
    validateParams(documentIdParamSchema), // Validate the document ID parameter
    validateQuery(signedUrlOptionsSchema), // Validate the query parameters
    documentsController.generateSignedUrl.bind(documentsController) // Bind the controller method to the controller instance
  );

  // Route for downloading a document
  router.get(
    '/:documentId/download',
    authenticate,
    authorize([Roles.CLIENT, Roles.PROVIDER, Roles.CASE_MANAGER]),
    validateParams(documentIdParamSchema), // Validate the document ID parameter
    documentsController.downloadDocument.bind(documentsController) // Bind the controller method to the controller instance
  );

  // Return the configured router
  return router;
}