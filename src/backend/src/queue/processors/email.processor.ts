/**
 * Email Processor
 * 
 * This processor handles asynchronous email delivery through the queue system,
 * supporting both standard and templated emails for the Revolucare platform.
 * It interfaces with the EmailService to send emails reliably with proper error
 * handling and retry mechanisms.
 */

import { Job } from 'bull'; // bull@^4.10.0
import { logger } from '../../utils/logger';
import { EmailService, EmailOptions, TemplateEmailOptions } from '../../services/email/email.service';
import { emailJob } from '../jobs/email.job';

// Initialize EmailService instance
const emailService = new EmailService();
let initialized = false;

/**
 * Processes email jobs from the queue, handling both standard and templated emails
 * 
 * @param job The Bull queue job containing email data
 * @returns Promise that resolves when the email is processed
 */
export async function processEmail(job: Job): Promise<void> {
  try {
    const { data, name } = job;
    
    // Initialize the email service if not already initialized
    if (!initialized) {
      await emailService.initialize();
      initialized = true;
      logger.debug('Email service initialized successfully');
    }
    
    logger.info('Processing email job', { 
      jobId: job.id, 
      jobName: name
    });
    
    let success = false;
    
    // Process based on job type
    if (name === emailJob.standard.name) {
      success = await processStandardEmail(data as EmailOptions);
    } else if (name === emailJob.template.name) {
      success = await processTemplateEmail(data as TemplateEmailOptions);
    } else {
      throw new Error(`Unknown email job type: ${name}`);
    }
    
    if (success) {
      logger.info('Email processed successfully', { 
        jobId: job.id, 
        jobName: name 
      });
    } else {
      throw new Error('Email delivery failed without specific error');
    }
  } catch (error) {
    logger.error('Error processing email job', { 
      jobId: job.id, 
      error: error instanceof Error ? error.message : String(error)
    });
    // Re-throw the error to trigger Bull's retry mechanism
    throw error;
  }
}

/**
 * Processes a standard email job
 * 
 * @param emailData The email data to process
 * @returns Promise that resolves to true if email was sent successfully
 */
async function processStandardEmail(emailData: EmailOptions): Promise<boolean> {
  // Validate required parameters
  if (!emailData.to || !emailData.subject || (!emailData.text && !emailData.html)) {
    logger.error('Invalid email data', { 
      to: !!emailData.to, 
      subject: !!emailData.subject, 
      content: !!(emailData.text || emailData.html)
    });
    throw new Error('Missing required email parameters (to, subject, and content)');
  }
  
  logger.debug('Sending standard email', {
    to: typeof emailData.to === 'string' ? emailData.to : 'multiple recipients',
    subject: emailData.subject
  });
  
  return await emailService.sendEmail(emailData);
}

/**
 * Processes a templated email job
 * 
 * @param templateData The template data to process
 * @returns Promise that resolves to true if email was sent successfully
 */
async function processTemplateEmail(templateData: TemplateEmailOptions): Promise<boolean> {
  // Validate required parameters
  if (!templateData.to || !templateData.templateId || !templateData.dynamicTemplateData) {
    logger.error('Invalid template email data', { 
      to: !!templateData.to, 
      templateId: !!templateData.templateId, 
      dynamicTemplateData: !!templateData.dynamicTemplateData
    });
    throw new Error('Missing required template email parameters (to, templateId, and dynamicTemplateData)');
  }
  
  logger.debug('Sending template email', {
    to: typeof templateData.to === 'string' ? templateData.to : 'multiple recipients',
    templateId: templateData.templateId
  });
  
  return await emailService.sendTemplateEmail(templateData);
}