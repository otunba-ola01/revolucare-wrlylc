import { IDocumentRepository } from '../interfaces/document.interface';
import { Document } from '../models/document.model';
import { DocumentAnalysis } from '../models/document-analysis.model';
import { DocumentQueryParams, DocumentAnalysisType, AnalysisStatus } from '../types/document.types';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { errorFactory } from '../utils/error-handler';

/**
 * Repository implementation for document-related database operations
 */
export class DocumentRepository implements IDocumentRepository {
  /**
   * Creates a new document repository instance
   */
  constructor() {
    // Initialize the repository with default configuration
  }

  /**
   * Creates a new document in the database
   * @param document Document data to create
   * @returns The created document with database-generated fields
   */
  async create(document: Partial<Document>): Promise<Document> {
    logger.debug('Creating new document', { ownerId: document.ownerId, type: document.type });
    
    try {
      // Convert Document model to Prisma document input
      const documentData = {
        ownerId: document.ownerId,
        name: document.name,
        type: document.type,
        mimeType: document.mimeType,
        size: document.size,
        storageUrl: document.storageUrl,
        metadata: document.metadata,
        status: document.status
      };
      
      // Create the document in the database using Prisma
      const createdDocument = await prisma.document.create({
        data: documentData
      });
      
      logger.info('Document created successfully', { documentId: createdDocument.id });
      
      // Convert the Prisma result back to a Document model
      return this.convertToDocumentModel(createdDocument);
    } catch (err) {
      logger.error('Failed to create document', { error: err, document });
      throw errorFactory.createInternalServerError('Failed to create document', {}, err as Error);
    }
  }

  /**
   * Finds a document by its ID
   * @param id Document ID
   * @returns The found document or null if not found
   */
  async findById(id: string): Promise<Document | null> {
    logger.debug('Finding document by ID', { documentId: id });
    
    try {
      // Query the database for the document with the given ID
      const document = await prisma.document.findUnique({
        where: { id }
      });
      
      if (!document) {
        logger.info('Document not found', { documentId: id });
        return null;
      }
      
      // Convert the Prisma result to a Document model
      return this.convertToDocumentModel(document);
    } catch (err) {
      logger.error('Failed to find document by ID', { error: err, documentId: id });
      throw errorFactory.createInternalServerError('Failed to find document', {}, err as Error);
    }
  }

  /**
   * Finds documents based on query parameters with pagination
   * @param params Query parameters
   * @returns Paginated document results
   */
  async findAll(params: DocumentQueryParams): Promise<{ data: Document[]; total: number }> {
    logger.debug('Finding documents with params', params);
    
    try {
      // Build the query filter based on provided parameters
      const filter = this.buildDocumentFilter(params);
      
      // Set default pagination values if not provided
      const page = params.page || 1;
      const limit = params.limit || 20;
      const skip = (page - 1) * limit;
      
      // Set default sorting if not provided
      const orderBy = params.sortBy 
        ? { [params.sortBy]: params.sortOrder || 'desc' }
        : { createdAt: 'desc' };
      
      // Execute count query to get total matching documents
      const total = await prisma.document.count({ where: filter });
      
      // Execute find query with pagination and sorting
      const documents = await prisma.document.findMany({
        where: filter,
        skip,
        take: limit,
        orderBy
      });
      
      // Convert Prisma results to Document models
      const documentModels = documents.map(doc => this.convertToDocumentModel(doc));
      
      logger.info('Documents retrieved successfully', { count: documents.length, total });
      
      return {
        data: documentModels,
        total
      };
    } catch (err) {
      logger.error('Failed to find documents', { error: err, params });
      throw errorFactory.createInternalServerError('Failed to retrieve documents', {}, err as Error);
    }
  }

  /**
   * Updates an existing document in the database
   * @param id Document ID
   * @param data Update data
   * @returns The updated document
   */
  async update(id: string, data: Partial<Document>): Promise<Document> {
    logger.debug('Updating document', { documentId: id, updateData: data });
    
    try {
      // Check if document exists
      const existingDocument = await prisma.document.findUnique({
        where: { id }
      });
      
      if (!existingDocument) {
        logger.info('Document not found for update', { documentId: id });
        throw errorFactory.createNotFoundError('Document not found', { documentId: id });
      }
      
      // Remove readonly fields from update data
      const { id: _id, ...updateData } = data;
      if ('createdAt' in updateData) delete updateData.createdAt;
      if ('updatedAt' in updateData) delete updateData.updatedAt;
      
      // Update the document in the database
      const updatedDocument = await prisma.document.update({
        where: { id },
        data: updateData
      });
      
      logger.info('Document updated successfully', { documentId: id });
      
      // Convert the Prisma result to a Document model
      return this.convertToDocumentModel(updatedDocument);
    } catch (err) {
      if (err.name === 'AppError') {
        throw err; // Re-throw AppError (like NOT_FOUND)
      }
      logger.error('Failed to update document', { error: err, documentId: id, data });
      throw errorFactory.createInternalServerError('Failed to update document', {}, err as Error);
    }
  }

  /**
   * Deletes a document from the database
   * @param id Document ID
   * @returns True if document was deleted, false otherwise
   */
  async delete(id: string): Promise<boolean> {
    logger.debug('Deleting document', { documentId: id });
    
    try {
      // Check if document exists
      const existingDocument = await prisma.document.findUnique({
        where: { id }
      });
      
      if (!existingDocument) {
        logger.info('Document not found for deletion', { documentId: id });
        throw errorFactory.createNotFoundError('Document not found', { documentId: id });
      }
      
      // Delete the document from the database
      await prisma.document.delete({
        where: { id }
      });
      
      logger.info('Document deleted successfully', { documentId: id });
      
      return true;
    } catch (err) {
      if (err.name === 'AppError') {
        throw err; // Re-throw AppError (like NOT_FOUND)
      }
      logger.error('Failed to delete document', { error: err, documentId: id });
      throw errorFactory.createInternalServerError('Failed to delete document', {}, err as Error);
    }
  }

  /**
   * Creates a new document analysis record in the database
   * @param analysis Analysis data
   * @returns The created document analysis with database-generated fields
   */
  async createAnalysis(analysis: Partial<DocumentAnalysis>): Promise<DocumentAnalysis> {
    logger.debug('Creating document analysis', { documentId: analysis.documentId, analysisType: analysis.analysisType });
    
    try {
      // Check if the referenced document exists
      const document = await prisma.document.findUnique({
        where: { id: analysis.documentId }
      });
      
      if (!document) {
        logger.info('Document not found for analysis creation', { documentId: analysis.documentId });
        throw errorFactory.createNotFoundError('Document not found', { documentId: analysis.documentId });
      }
      
      // Convert DocumentAnalysis model to Prisma analysis input
      const analysisData = {
        documentId: analysis.documentId,
        analysisType: analysis.analysisType,
        status: analysis.status || AnalysisStatus.PENDING,
        results: analysis.results || {},
        confidence: analysis.confidence || { score: 0, level: 'low', factors: [] },
        processingTime: analysis.processingTime || 0,
        modelType: analysis.modelType
      };
      
      // Create the analysis record in the database
      const createdAnalysis = await prisma.documentAnalysis.create({
        data: analysisData
      });
      
      logger.info('Document analysis created successfully', { analysisId: createdAnalysis.id });
      
      // Convert the Prisma result to a DocumentAnalysis model
      return this.convertToAnalysisModel(createdAnalysis);
    } catch (err) {
      if (err.name === 'AppError') {
        throw err; // Re-throw AppError (like NOT_FOUND)
      }
      logger.error('Failed to create document analysis', { error: err, analysis });
      throw errorFactory.createInternalServerError('Failed to create document analysis', {}, err as Error);
    }
  }

  /**
   * Finds a document analysis by its ID
   * @param id Analysis ID
   * @returns The found analysis or null if not found
   */
  async findAnalysisById(id: string): Promise<DocumentAnalysis | null> {
    logger.debug('Finding document analysis by ID', { analysisId: id });
    
    try {
      // Query the database for the analysis with the given ID
      const analysis = await prisma.documentAnalysis.findUnique({
        where: { id }
      });
      
      if (!analysis) {
        logger.info('Document analysis not found', { analysisId: id });
        return null;
      }
      
      // Convert the Prisma result to a DocumentAnalysis model
      return this.convertToAnalysisModel(analysis);
    } catch (err) {
      logger.error('Failed to find document analysis by ID', { error: err, analysisId: id });
      throw errorFactory.createInternalServerError('Failed to find document analysis', {}, err as Error);
    }
  }

  /**
   * Updates an existing document analysis in the database
   * @param id Analysis ID
   * @param data Update data
   * @returns The updated document analysis
   */
  async updateAnalysis(id: string, data: Partial<DocumentAnalysis>): Promise<DocumentAnalysis> {
    logger.debug('Updating document analysis', { analysisId: id, updateData: data });
    
    try {
      // Check if analysis exists
      const existingAnalysis = await prisma.documentAnalysis.findUnique({
        where: { id }
      });
      
      if (!existingAnalysis) {
        logger.info('Document analysis not found for update', { analysisId: id });
        throw errorFactory.createNotFoundError('Document analysis not found', { analysisId: id });
      }
      
      // Remove readonly fields from update data
      const { id: _id, documentId, ...updateData } = data;
      if ('createdAt' in updateData) delete updateData.createdAt;
      
      // Update the analysis in the database
      const updatedAnalysis = await prisma.documentAnalysis.update({
        where: { id },
        data: updateData
      });
      
      logger.info('Document analysis updated successfully', { analysisId: id });
      
      // Convert the Prisma result to a DocumentAnalysis model
      return this.convertToAnalysisModel(updatedAnalysis);
    } catch (err) {
      if (err.name === 'AppError') {
        throw err; // Re-throw AppError (like NOT_FOUND)
      }
      logger.error('Failed to update document analysis', { error: err, analysisId: id, data });
      throw errorFactory.createInternalServerError('Failed to update document analysis', {}, err as Error);
    }
  }

  /**
   * Finds all analyses for a specific document
   * @param documentId Document ID
   * @returns Array of document analyses
   */
  async findAnalysesByDocumentId(documentId: string): Promise<DocumentAnalysis[]> {
    logger.debug('Finding analyses by document ID', { documentId });
    
    try {
      // Query the database for matching analyses
      const analyses = await prisma.documentAnalysis.findMany({
        where: { documentId },
        orderBy: { createdAt: 'desc' }
      });
      
      // Convert Prisma results to DocumentAnalysis models
      const analysisModels = analyses.map(analysis => this.convertToAnalysisModel(analysis));
      
      logger.info('Document analyses retrieved successfully', { documentId, count: analyses.length });
      
      return analysisModels;
    } catch (err) {
      logger.error('Failed to find document analyses', { error: err, documentId });
      throw errorFactory.createInternalServerError('Failed to retrieve document analyses', {}, err as Error);
    }
  }

  /**
   * Converts a Prisma document result to a Document model
   * @param prismaDocument Prisma document result
   * @returns Document model instance
   */
  private convertToDocumentModel(prismaDocument: any): Document {
    return new Document({
      id: prismaDocument.id,
      ownerId: prismaDocument.ownerId,
      name: prismaDocument.name,
      type: prismaDocument.type,
      mimeType: prismaDocument.mimeType,
      size: prismaDocument.size,
      storageUrl: prismaDocument.storageUrl,
      metadata: prismaDocument.metadata,
      status: prismaDocument.status,
      createdAt: prismaDocument.createdAt,
      updatedAt: prismaDocument.updatedAt
    });
  }

  /**
   * Converts a Prisma document analysis result to a DocumentAnalysis model
   * @param prismaAnalysis Prisma analysis result
   * @returns DocumentAnalysis model instance
   */
  private convertToAnalysisModel(prismaAnalysis: any): DocumentAnalysis {
    return new DocumentAnalysis({
      id: prismaAnalysis.id,
      documentId: prismaAnalysis.documentId,
      analysisType: prismaAnalysis.analysisType,
      status: prismaAnalysis.status,
      results: prismaAnalysis.results,
      confidence: prismaAnalysis.confidence,
      processingTime: prismaAnalysis.processingTime,
      modelType: prismaAnalysis.modelType,
      createdAt: prismaAnalysis.createdAt,
      completedAt: prismaAnalysis.completedAt
    });
  }

  /**
   * Builds a Prisma filter object from query parameters
   * @param params Query parameters
   * @returns Prisma filter object
   */
  private buildDocumentFilter(params: DocumentQueryParams): Record<string, any> {
    const filter: Record<string, any> = {};
    
    // Add ownerId filter if provided
    if (params.ownerId) {
      filter.ownerId = params.ownerId;
    }
    
    // Add type filter if provided
    if (params.type) {
      filter.type = params.type;
    }
    
    // Add status filter if provided
    if (params.status) {
      filter.status = params.status;
    }
    
    // Add date range filters if provided
    if (params.dateFrom || params.dateTo) {
      filter.createdAt = {};
      
      if (params.dateFrom) {
        filter.createdAt.gte = params.dateFrom;
      }
      
      if (params.dateTo) {
        filter.createdAt.lte = params.dateTo;
      }
    }
    
    // Add search term filter if provided
    if (params.searchTerm) {
      filter.OR = [
        { name: { contains: params.searchTerm, mode: 'insensitive' } },
        { 'metadata.title': { contains: params.searchTerm, mode: 'insensitive' } },
        { 'metadata.description': { contains: params.searchTerm, mode: 'insensitive' } }
      ];
    }
    
    // Add tags filter if provided
    if (params.tags && params.tags.length > 0) {
      // Filter documents where ALL provided tags exist in the metadata.tags array
      filter['metadata.tags'] = {
        hasEvery: params.tags
      };
    }
    
    return filter;
  }
}