import { DocumentService } from '../../services/documents.service';
import { DocumentAnalysisService } from '../../services/ai/document-analysis.service';
import { NotificationService } from '../../services/notifications.service';
import { DocumentRepository } from '../../repositories/document.repository';
import { DocumentStatus, AnalysisStatus } from '../../types/document.types';
import { NOTIFICATION_TYPES } from '../../constants/notification-types';
import { logger } from '../../utils/logger';
import { redisClient } from '../../config/redis';
import { documentAnalysisJob } from '../../queue/jobs/document-analysis.job';
import { queueManager } from '../../queue';

// Define global instances for services
const documentService = new DocumentService(new DocumentRepository(), /* other dependencies */);
const documentAnalysisService = new DocumentAnalysisService(/* dependencies */);
const notificationService = new NotificationService(/* dependencies */);

/**
 * Handles the document.uploaded event by sending notifications and triggering analysis if needed
 * @param payload 
 */
export async function handleDocumentUploaded(payload: any): Promise<void> {
  // LD1: Extract documentId and ownerId from the payload
  const { documentId, ownerId } = payload;

  // LD1: Log the document uploaded event
  logger.info('Handling document.uploaded event', { documentId, ownerId });

  try {
    // LD1: Retrieve the document details using documentService
    const document = await documentService.getDocument(documentId);

    // LD1: Create a notification for the document owner
    await createDocumentNotification(
      ownerId,
      NOTIFICATION_TYPES.DOCUMENT_UPLOADED,
      'Document Uploaded',
      `Your document "${document.name}" has been uploaded successfully.`,
      { documentId },
      'normal'
    );

    // LD1: If document type is medical record or assessment, trigger document analysis
    if (document.type === 'medical_record' || document.type === 'assessment') {
      // LD1: Add document analysis job to the queue if auto-analysis is needed
      await triggerDocumentAnalysis(documentId, 'medical_extraction', { priority: 'high' });
    }

    // LD1: Log successful handling of the event
    logger.info('Successfully handled document.uploaded event', { documentId, ownerId });
  } catch (error: any) {
    // LD1: Catch and log any errors during processing
    logger.error('Error handling document.uploaded event', {
      error: error instanceof Error ? error.message : String(error),
      documentId,
      ownerId,
    });
  }
}

/**
 * Handles the document.analyzed event by sending notifications and triggering care plan generation if applicable
 * @param payload 
 */
export async function handleDocumentAnalyzed(payload: any): Promise<void> {
  // LD1: Extract documentId, analysisId, and status from the payload
  const { documentId, analysisId, status } = payload;

  // LD1: Log the document analyzed event
  logger.info('Handling document.analyzed event', { documentId, analysisId, status });

  try {
    // LD1: Retrieve the document and analysis details
    const document = await documentService.getDocument(documentId);
    const analysis = await documentAnalysisService.getAnalysisById(analysisId);

    // LD1: If analysis status is COMPLETED, create a success notification
    if (status === AnalysisStatus.COMPLETED) {
      await createDocumentNotification(
        document.ownerId,
        NOTIFICATION_TYPES.DOCUMENT_ANALYZED,
        'Document Analysis Complete',
        `The analysis of your document "${document.name}" is complete.`,
        { documentId, analysisId },
        'normal'
      );
    }
    // LD1: If analysis status is FAILED, create a failure notification
    else if (status === AnalysisStatus.FAILED) {
      await createDocumentNotification(
        document.ownerId,
        NOTIFICATION_TYPES.DOCUMENT_ANALYZED,
        'Document Analysis Failed',
        `The analysis of your document "${document.name}" failed. Please try again or contact support.`,
        { documentId, analysisId },
        'high'
      );
    }

    // LD1: If document is a medical record and analysis is successful, trigger care plan generation
    if (document.type === 'medical_record' && status === AnalysisStatus.COMPLETED) {
      // LD1: Publish care plan generation event if applicable
      await redisClient.publish('care-plan-generation', JSON.stringify({ documentId, clientId: document.ownerId }));
    }

    // LD1: Log successful handling of the event
    logger.info('Successfully handled document.analyzed event', { documentId, analysisId, status });
  } catch (error: any) {
    // LD1: Catch and log any errors during processing
    logger.error('Error handling document.analyzed event', {
      error: error instanceof Error ? error.message : String(error),
      documentId,
      analysisId,
      status,
    });
  }
}

/**
 * Handles the document.status.changed event by sending notifications about document status changes
 * @param payload 
 */
export async function handleDocumentStatusChanged(payload: any): Promise<void> {
  // LD1: Extract documentId, ownerId, previousStatus, and newStatus from the payload
  const { documentId, ownerId, previousStatus, newStatus } = payload;

  // LD1: Log the document status changed event
  logger.info('Handling document.status.changed event', { documentId, ownerId, previousStatus, newStatus });

  try {
    // LD1: Retrieve the document details
    const document = await documentService.getDocument(documentId);

    // LD1: Create appropriate notification based on status change
    let title: string;
    let message: string;
    let priority: string = 'normal';

    // LD1: For AVAILABLE status, notify that document is ready for use
    if (newStatus === DocumentStatus.AVAILABLE) {
      title = 'Document Uploaded Successfully';
      message = `Your document "${document.name}" is now available for use.`;
    }
    // LD1: For ERROR status, notify about upload or processing failure
    else if (newStatus === DocumentStatus.ERROR) {
      title = 'Document Upload Failed';
      message = `There was an error processing your document "${document.name}". Please try again or contact support.`;
      priority = 'high';
    }
    // LD1: For other status changes, create general status update notification
    else {
      title = 'Document Status Updated';
      message = `The status of your document "${document.name}" has been updated to ${newStatus}.`;
    }

    await createDocumentNotification(
      ownerId,
      NOTIFICATION_TYPES.DOCUMENT_STATUS_CHANGED,
      title,
      message,
      { documentId, previousStatus, newStatus },
      priority
    );

    // LD1: Log successful handling of the event
    logger.info('Successfully handled document.status.changed event', { documentId, ownerId, previousStatus, newStatus });
  } catch (error: any) {
    // LD1: Catch and log any errors during processing
    logger.error('Error handling document.status.changed event', {
      error: error instanceof Error ? error.message : String(error),
      documentId,
      ownerId,
      previousStatus,
      newStatus,
    });
  }
}

/**
 * Creates a notification for document-related events
 * @param userId 
 * @param type 
 * @param title 
 * @param message 
 * @param data 
 */
async function createDocumentNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  data: Record<string, any>,
  priority: string = 'normal'
): Promise<void> {
  try {
    // LD1: Create notification DTO with provided parameters
    const notificationData = {
      userId,
      type,
      title,
      message,
      data,
      priority
    };

    // LD1: Call notificationService to create the notification
    await notificationService.createNotification(notificationData);

    // LD1: Log notification creation
    logger.info('Document notification created', { userId, type, title });
  } catch (error: any) {
    // LD1: Catch and log any errors during notification creation
    logger.error('Error creating document notification', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      type,
      title,
    });
  }
}

/**
 * Triggers asynchronous document analysis by adding a job to the queue
 * @param documentId 
 * @param analysisType 
 * @param options 
 */
async function triggerDocumentAnalysis(
  documentId: string,
  analysisType: string,
  options: any = {}
): Promise<void> {
  try {
    // LD1: Create document analysis job data with documentId, analysisType, and options
    const jobData: DocumentAnalysisParams = {
      documentId,
      analysisType,
      options,
    };

    // LD1: Add the job to the queue using queueManager
    await queueManager.addJob(documentAnalysisJob.name, jobData, documentAnalysisJob.getOptions(jobData));

    // LD1: Log job creation for document analysis
    logger.info('Document analysis job added to queue', { documentId, analysisType });
  } catch (error: any) {
    // LD1: Catch and log any errors during job creation
    logger.error('Error adding document analysis job to queue', {
      error: error instanceof Error ? error.message : String(error),
      documentId,
      analysisType,
    });
  }
}

// IE3: Be generous about your exports so long as it doesn't create a security risk
export { handleDocumentUploaded, handleDocumentAnalyzed, handleDocumentStatusChanged };