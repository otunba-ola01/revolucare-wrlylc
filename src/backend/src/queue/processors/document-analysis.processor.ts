import { Job, DoneCallback } from 'bull'; // bull@^4.10.0
import { DocumentAnalysisParams } from '../../interfaces/document.interface';
import { DocumentAnalysisService } from '../../services/ai/document-analysis.service';
import { logger } from '../../utils/logger';
import { documentAnalysisJob } from '../jobs/document-analysis.job';
import { DocumentRepository } from '../../repositories/document.repository';
import { AnalysisStatus } from '../../types/document.types';

/**
 * Processes a document analysis job from the queue
 * @param job - The Bull job object containing document analysis parameters
 * @param done - The Bull done callback to signal job completion
 */
export const processDocumentAnalysis = async (
  job: Job<DocumentAnalysisParams>,
  done: DoneCallback
): Promise<void> => {
  // LD1: Extract job data (documentId, analysisType, options) from the job object
  const { documentId, analysisType, options } = job.data;

  // LD1: Log the start of document analysis processing
  logger.info(`Starting document analysis for document ${documentId} with analysis type ${analysisType}`, {
    documentId,
    analysisType,
    jobId: job.id,
  });

  try {
    // LD1: Create instances of required services (DocumentRepository, DocumentAnalysisService)
    const documentRepository = new DocumentRepository();
    const documentAnalysisService = new DocumentAnalysisService(
      documentRepository,
      // @ts-expect-error
      null, // TODO: Fix this
      // @ts-expect-error
      null, // TODO: Fix this
      // @ts-expect-error
      null // TODO: Fix this
    );

    // LD1: Validate that the document and analysis record exist
    const document = await documentRepository.findById(documentId);
    if (!document) {
      const errorMessage = `Document with ID ${documentId} not found`;
      logger.error(errorMessage, { documentId, jobId: job.id });
      return done(new Error(errorMessage));
    }

    const analysis = await documentRepository.findAnalysisById(documentId);
    if (!analysis) {
      const errorMessage = `Analysis record with ID ${documentId} not found`;
      logger.error(errorMessage, { documentId, jobId: job.id });
      return done(new Error(errorMessage));
    }

    // LD1: Call the document analysis service to perform the analysis
    await documentAnalysisService.analyzeDocument({
      documentId,
      analysisType,
      options,
    });

    // LD1: Log successful completion of the analysis
    logger.info(`Document analysis completed successfully for document ${documentId}`, {
      documentId,
      analysisType,
      jobId: job.id,
    });

    // LD1: Call the done callback to mark the job as completed
    done();
  } catch (err: any) {
    // LD1: Handle errors by logging them, updating the analysis status to FAILED, and calling done with the error
    logger.error(`Document analysis failed for document ${documentId}`, {
      documentId,
      analysisType,
      jobId: job.id,
      error: err instanceof Error ? err.message : String(err),
    });

    try {
      await new DocumentRepository().updateAnalysis(documentId, {
        status: AnalysisStatus.FAILED,
        results: {
          error: err instanceof Error ? err.message : String(err),
        },
      });
    } catch (updateErr: any) {
      logger.error(`Failed to update analysis status to FAILED for document ${documentId}`, {
        documentId,
        analysisType,
        jobId: job.id,
        updateError: updateErr instanceof Error ? updateErr.message : String(updateErr),
      });
    }

    done(err);
  }
};

/**
 * Creates and returns the document analysis processor function with dependency injection
 * @param documentRepository - The DocumentRepository instance to use
 * @param documentAnalysisService - The DocumentAnalysisService instance to use
 */
export const createDocumentAnalysisProcessor = (
  documentRepository: DocumentRepository,
  documentAnalysisService: DocumentAnalysisService
): Function => {
  // LD1: Return a function that processes document analysis jobs using the provided dependencies
  return async (job: Job<DocumentAnalysisParams>, done: DoneCallback): Promise<void> => {
    // LD1: Extract job data (documentId, analysisType, options) from the job object
    const { documentId, analysisType, options } = job.data;

    // LD1: Log the start of document analysis processing
    logger.info(`Starting document analysis for document ${documentId} with analysis type ${analysisType}`, {
      documentId,
      analysisType,
      jobId: job.id,
    });

    try {
      // LD1: Call the document analysis service to perform the analysis
      await documentAnalysisService.analyzeDocument({
        documentId,
        analysisType,
        options,
      });

      // LD1: Log successful completion of the analysis
      logger.info(`Document analysis completed successfully for document ${documentId}`, {
        documentId,
        analysisType,
        jobId: job.id,
      });

      // LD1: Call the done callback to mark the job as completed
      done();
    } catch (err: any) {
      // LD1: Handle errors by logging them, updating the analysis status to FAILED, and calling done with the error
      logger.error(`Document analysis failed for document ${documentId}`, {
        documentId,
        analysisType,
        jobId: job.id,
        error: err instanceof Error ? err.message : String(err),
      });

      try {
        await documentRepository.updateAnalysis(documentId, {
          status: AnalysisStatus.FAILED,
          results: {
            error: err instanceof Error ? err.message : String(err),
          },
        });
      } catch (updateErr: any) {
        logger.error(`Failed to update analysis status to FAILED for document ${documentId}`, {
          documentId,
          analysisType,
          jobId: job.id,
          updateError: updateErr instanceof Error ? updateErr.message : String(updateErr),
        });
      }

      done(err);
    }
  };
};

// IE3: Be generous about your exports so long as it doesn't create a security risk.
export default processDocumentAnalysis;