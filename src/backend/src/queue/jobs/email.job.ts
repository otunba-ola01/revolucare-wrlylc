/**
 * Email Job Configurations
 * 
 * This file defines job configurations for email processing in the Revolucare platform.
 * It includes configurations for both standard and templated emails that will
 * be processed asynchronously through the Bull queue system.
 */

import { JobOptions } from 'bull'; // bull@^4.10.0
import { EmailOptions, TemplateEmailOptions } from '../../services/email/email.service';

/**
 * Interface for standard email job data that extends EmailOptions
 */
interface StandardEmailJobData extends EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
    disposition: string;
  }>;
}

/**
 * Interface for template email job data that extends TemplateEmailOptions
 */
interface TemplateEmailJobData extends TemplateEmailOptions {
  to: string | string[];
  templateName: string;
  templateData: Record<string, any>;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
    disposition: string;
  }>;
}

/**
 * Configuration for standard email jobs with retry logic
 */
const standardEmailJob = {
  name: 'standard-email',
  options: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 60000, // 1 minute initial delay
    },
    removeOnComplete: true,
    removeOnFail: false, // Keep failed jobs for analysis
  } as JobOptions,
};

/**
 * Configuration for template email jobs with retry logic
 */
const templateEmailJob = {
  name: 'template-email',
  options: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 60000, // 1 minute initial delay
    },
    removeOnComplete: true,
    removeOnFail: false, // Keep failed jobs for analysis
  } as JobOptions,
};

/**
 * Combined export of all email job configurations
 */
const emailJob = {
  standard: standardEmailJob,
  template: templateEmailJob,
};

export {
  StandardEmailJobData,
  TemplateEmailJobData,
  standardEmailJob,
  templateEmailJob,
  emailJob,
};