# src/backend/tests/unit/controllers/documents.controller.test.ts
```typescript
import { Request, Response } from 'express'; // express@^4.18.2
import { DocumentsController } from '../../../src/api/controllers/documents.controller';
import { DocumentService } from '../../../src/services/documents.service';
import { errorFactory } from '../../../src/utils/error-handler';
import { logger } from '../../../src/utils/logger';
import { DocumentType, DocumentStatus, DocumentAnalysisType } from '../../../src/types/document.types';
import { DOCUMENT_TYPES, DOCUMENT_MIME_TYPES, DOCUMENT_ANALYSIS_TYPES } from '../../../src/constants/document-types';
import { Roles } from '../../../src/constants/roles';
import { mockDocuments, mockDocumentAnalyses, generateMockDocument, generateMockDocumentAnalysis } from '../../fixtures/documents.fixture';

// Mock the DocumentService
jest.mock('../../../src/services/documents.service');

// Mock the logger
jest.mock('../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

// Setup mock DocumentService instance
const mockDocumentService = new DocumentService(
  null as any, // DocumentRepository is not used in these tests
  null as any, // BlobStorageService is not used in these tests
  null as any,  // DocumentAnalysisService is not used in these tests
);

// Cast the mockDocumentService to the mocked type
const mockedDocumentService = mockDocumentService as jest.Mocked<DocumentService>;

// Helper function to create a mock request object
const createMockRequest = (overrides: Partial<Request> = {}): Request => {
  const req = {
    user: {
      id: 'test-user-id',
      role: Roles.CLIENT,
    },
    query: {},
    params: {},
    body: {},
    files: {},
    ...overrides,
  } as any;
  return req;
};

// Helper function to create a mock response object
const createMockResponse = (): Response => {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    sendStatus: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
  };
  return res as Response;
};

describe('DocumentsController', () => {
  let documentsController: DocumentsController;
  let req: Request;
  let res: Response;

  beforeEach(() => {
    documentsController = new DocumentsController(mockedDocumentService);
    req = createMockRequest();
    res = createMockResponse();
    jest.clearAllMocks(); // Clear mocks before each test
  });

  describe('uploadDocument', () => {
    it('should upload a document successfully', async () => {
      const mockUploadedDocument = generateMockDocument();
      mockedDocumentService.uploadDocument.mockResolvedValue(mockUploadedDocument);

      (req.files as any) = {
        file: [{
          data: Buffer.from('test data'),
          name: 'test.pdf',
          mimetype: 'application/pdf',
          size: 1024,
        }],
      };
      req.body = {
        ownerId: 'test-user-id',
        type: DOCUMENT_TYPES.MEDICAL_RECORD,
        metadata: { title: 'Test Document' },
        autoAnalyze: true,
        analysisType: DOCUMENT_ANALYSIS_TYPES.MEDICAL_EXTRACTION,
      };

      await documentsController.uploadDocument(req, res);

      expect(mockedDocumentService.uploadDocument).toHaveBeenCalledWith(expect.objectContaining({
        ownerId: 'test-user-id',
        type: DOCUMENT_TYPES.MEDICAL_RECORD,
        metadata: { title: 'Test Document' },
        autoAnalyze: true,
        analysisType: DOCUMENT_ANALYSIS_TYPES.MEDICAL_EXTRACTION,
      }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockUploadedDocument });
    });

    it('should handle errors during document upload', async () => {
      mockedDocumentService.uploadDocument.mockRejectedValue(new Error('Upload failed'));

      (req.files as any) = {
        file: [{
          data: Buffer.from('test data'),
          name: 'test.pdf',
          mimetype: 'application/pdf',
          size: 1024,
        }],
      };
      req.body = {
        ownerId: 'test-user-id',
        type: DOCUMENT_TYPES.MEDICAL_RECORD,
        metadata: { title: 'Test Document' },
        autoAnalyze: true,
        analysisType: DOCUMENT_ANALYSIS_TYPES.MEDICAL_EXTRACTION,
      };

      await documentsController.uploadDocument(req, res);

      expect(mockedDocumentService.uploadDocument).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred while processing your request', statusCode: 500 } });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getDocument', () => {
    it('should retrieve a document successfully', async () => {
      const mockDocument = generateMockDocument();
      mockedDocumentService.getDocument.mockResolvedValue(mockDocument);
      req.params = { id: 'test-document-id' };

      await documentsController.getDocument(req, res);

      expect(mockedDocumentService.getDocument).toHaveBeenCalledWith('test-document-id');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockDocument });
    });

    it('should handle document not found error', async () => {
      mockedDocumentService.getDocument.mockRejectedValue(errorFactory.createNotFoundError('Document not found'));
      req.params = { id: 'non-existent-id' };

      await documentsController.getDocument(req, res);

      expect(mockedDocumentService.getDocument).toHaveBeenCalledWith('non-existent-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: { code: 'NOT_FOUND', message: 'The requested resource was not found', statusCode: 404 } });
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle generic errors during document retrieval', async () => {
      mockedDocumentService.getDocument.mockRejectedValue(new Error('Generic error'));
      req.params = { id: 'test-document-id' };

      await documentsController.getDocument(req, res);

      expect(mockedDocumentService.getDocument).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred while processing your request', statusCode: 500 } });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('listDocuments', () => {
    it('should list documents successfully', async () => {
      mockedDocumentService.listDocuments.mockResolvedValue({ data: mockDocuments, pagination: { page: 1, limit: 20, total: mockDocuments.length, totalPages: 1 } });
      req.query = { ownerId: 'test-user-id' };

      await documentsController.listDocuments(req, res);

      expect(mockedDocumentService.listDocuments).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 'test-user-id' }));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { data: mockDocuments, pagination: { page: 1, limit: 20, total: mockDocuments.length, totalPages: 1 } } });
    });

    it('should handle errors during document listing', async () => {
      mockedDocumentService.listDocuments.mockRejectedValue(new Error('Listing failed'));
      req.query = { ownerId: 'test-user-id' };

      await documentsController.listDocuments(req, res);

      expect(mockedDocumentService.listDocuments).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred while processing your request', statusCode: 500 } });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('deleteDocument', () => {
    it('should delete a document successfully', async () => {
      mockedDocumentService.deleteDocument.mockResolvedValue(true);
      req.params = { id: 'test-document-id' };
      req.query = { permanent: 'true' };

      await documentsController.deleteDocument(req, res);

      expect(mockedDocumentService.deleteDocument).toHaveBeenCalledWith('test-document-id', true);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { deleted: true } });
    });

    it('should handle document not found error during deletion', async () => {
      mockedDocumentService.deleteDocument.mockRejectedValue(errorFactory.createNotFoundError('Document not found'));
      req.params = { id: 'non-existent-id' };
      req.query = { permanent: 'true' };

      await documentsController.deleteDocument(req, res);

      expect(mockedDocumentService.deleteDocument).toHaveBeenCalledWith('non-existent-id', true);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: { code: 'NOT_FOUND', message: 'The requested resource was not found', statusCode: 404 } });
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle generic errors during document deletion', async () => {
      mockedDocumentService.deleteDocument.mockRejectedValue(new Error('Deletion failed'));
      req.params = { id: 'test-document-id' };
      req.query = { permanent: 'true' };

      await documentsController.deleteDocument(req, res);

      expect(mockedDocumentService.deleteDocument).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred while processing your request', statusCode: 500 } });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('analyzeDocument', () => {
    it('should analyze a document successfully', async () => {
      const mockAnalysisResult = generateMockDocumentAnalysis();
      mockedDocumentService.analyzeDocument.mockResolvedValue(mockAnalysisResult);
      req.params = { id: 'test-document-id' };
      req.body = { analysisType: DOCUMENT_ANALYSIS_TYPES.MEDICAL_EXTRACTION };

      await documentsController.analyzeDocument(req, res);

      expect(mockedDocumentService.analyzeDocument).toHaveBeenCalledWith(expect.objectContaining({
        documentId: 'test-document-id',
        analysisType: DOCUMENT_ANALYSIS_TYPES.MEDICAL_EXTRACTION,
      }));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockAnalysisResult });
    });

    it('should handle errors during document analysis', async () => {
      mockedDocumentService.analyzeDocument.mockRejectedValue(new Error('Analysis failed'));
      req.params = { id: 'test-document-id' };
      req.body = { analysisType: DOCUMENT_ANALYSIS_TYPES.MEDICAL_EXTRACTION };

      await documentsController.analyzeDocument(req, res);

      expect(mockedDocumentService.analyzeDocument).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred while processing your request', statusCode: 500 } });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getDocumentAnalysis', () => {
    it('should retrieve document analysis successfully', async () => {
      const mockAnalysisResult = generateMockDocumentAnalysis();
      mockedDocumentService.getDocumentAnalysis.mockResolvedValue(mockAnalysisResult);
      req.params = { id: 'test-document-id', analysisId: 'test-analysis-id' };

      await documentsController.getDocumentAnalysis(req, res);

      expect(mockedDocumentService.getDocumentAnalysis).toHaveBeenCalledWith('test-document-id', 'test-analysis-id');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockAnalysisResult });
    });

    it('should handle analysis not found error', async () => {
      mockedDocumentService.getDocumentAnalysis.mockRejectedValue(errorFactory.createNotFoundError('Analysis not found'));
      req.params = { id: 'test-document-id', analysisId: 'non-existent-id' };

      await documentsController.getDocumentAnalysis(req, res);

      expect(mockedDocumentService.getDocumentAnalysis).toHaveBeenCalledWith('test-document-id', 'non-existent-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: { code: 'NOT_FOUND', message: 'The requested resource was not found', statusCode: 404 } });
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle generic errors during analysis retrieval', async () => {
      mockedDocumentService.getDocumentAnalysis.mockRejectedValue(new Error('Retrieval failed'));
      req.params = { id: 'test-document-id', analysisId: 'test-analysis-id' };

      await documentsController.getDocumentAnalysis(req, res);

      expect(mockedDocumentService.getDocumentAnalysis).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred while processing your request', statusCode: 500 } });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('updateDocumentMetadata', () => {
    it('should update document metadata successfully', async () => {
      const mockUpdatedDocument = generateMockDocument();
      mockedDocumentService.updateDocumentMetadata.mockResolvedValue(mockUpdatedDocument);
      req.params = { id: 'test-document-id' };
      req.body = { title: 'Updated Title' };

      await documentsController.updateDocumentMetadata(req, res);

      expect(mockedDocumentService.updateDocumentMetadata).toHaveBeenCalledWith('test-document-id', { title: 'Updated Title' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockUpdatedDocument });
    });

    it('should handle document not found error during metadata update', async () => {
      mockedDocumentService.updateDocumentMetadata.mockRejectedValue(errorFactory.createNotFoundError('Document not found'));
      req.params = { id: 'non-existent-id' };
      req.body = { title: 'Updated Title' };

      await documentsController.updateDocumentMetadata(req, res);

      expect(mockedDocumentService.updateDocumentMetadata).toHaveBeenCalledWith('non-existent-id', { title: 'Updated Title' });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: { code: 'NOT_FOUND', message: 'The requested resource was not found', statusCode: 404 } });
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle generic errors during metadata update', async () => {
      mockedDocumentService.updateDocumentMetadata.mockRejectedValue(new Error('Update failed'));
      req.params = { id: 'test-document-id' };
      req.body = { title: 'Updated Title' };

      await documentsController.updateDocumentMetadata(req, res);

      expect(mockedDocumentService.updateDocumentMetadata).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred while processing your request', statusCode: 500 } });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('generateSignedUrl', () => {
    it('should generate a signed URL successfully', async () => {
      mockedDocumentService.generateSignedUrl.mockResolvedValue('https://example.com/signed-url');
      req.params = { id: 'test-document-id' };
      req.query = { expiresIn: '3600' };

      await documentsController.generateSignedUrl(req, res);

      expect(mockedDocumentService.generateSignedUrl).toHaveBeenCalledWith('test-document-id', { expiresIn: 3600 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { signedUrl: 'https://example.com/signed-url' } });
    });

    it('should handle document not found error during signed URL generation', async () => {
      mockedDocumentService.generateSignedUrl.mockRejectedValue(errorFactory.createNotFoundError('Document not found'));
      req.params = { id: 'non-existent-id' };
      req.query = { expiresIn: '3600' };

      await documentsController.generateSignedUrl(req, res);

      expect(mockedDocumentService.generateSignedUrl).toHaveBeenCalledWith('non-existent-id', { expiresIn: 3600 });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: { code: 'NOT_FOUND', message: 'The requested resource was not found', statusCode: 404 } });
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle generic errors during signed URL generation', async () => {
      mockedDocumentService.generateSignedUrl.mockRejectedValue(new Error('Generation failed'));
      req.params = { id: 'test-document-id' };
      req.query = { expiresIn: '3600' };

      await documentsController.generateSignedUrl(req, res);

      expect(mockedDocumentService.generateSignedUrl).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred while processing your request', statusCode: 500 } });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('downloadDocument', () => {
    it('should download a document successfully', async () => {
      mockedDocumentService.downloadDocument.mockResolvedValue({ data: Buffer.from('test data'), contentType: 'application/pdf', fileName: 'test.pdf' });
      req.params = { id: 'test-document-id' };

      await documentsController.downloadDocument(req, res);

      expect(mockedDocumentService.downloadDocument).toHaveBeenCalledWith('test-document-id');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename=test.pdf');
      expect(res.send).toHaveBeenCalledWith(Buffer.from('test data'));
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should handle document not found error during download', async () => {
      mockedDocumentService.downloadDocument.mockRejectedValue(errorFactory.createNotFoundError('Document not found'));
      req.params = { id: 'non-existent-id' };

      await documentsController.downloadDocument(req, res);

      expect(mockedDocumentService.downloadDocument).toHaveBeenCalledWith('non-existent-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: { code: 'NOT_FOUND', message: 'The requested resource was not found', statusCode: 404 } });
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle generic errors during document download', async () => {
      mockedDocumentService.downloadDocument.mockRejectedValue(new Error('Download failed'));
      req.params = { id: 'test-document-id' };

      await documentsController.downloadDocument(req, res);

      expect(mockedDocumentService.downloadDocument).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred while processing your request', statusCode: 500 } });
      expect(logger.error).toHaveBeenCalled();
    });
  });
});