import { DocumentType, DocumentMimeType, DocumentStatus, DocumentMetadata } from '../types/document.types';
import { DOCUMENT_TYPES } from '../constants/document-types';

/**
 * Represents a document in the system, such as medical records, assessments, care plans,
 * and other files uploaded by users.
 */
export class Document {
  /** Unique identifier for the document */
  id: string;
  
  /** ID of the user who owns this document */
  ownerId: string;
  
  /** Filename of the document */
  name: string;
  
  /** Type of document (e.g., medical_record, assessment) */
  type: DocumentType;
  
  /** MIME type of the document (e.g., application/pdf) */
  mimeType: DocumentMimeType;
  
  /** Size of the document in bytes */
  size: number;
  
  /** URL or path where the document is stored */
  storageUrl: string;
  
  /** Document metadata including title, description, tags, etc. */
  metadata: DocumentMetadata;
  
  /** Current status of the document (uploading, processing, available, error) */
  status: DocumentStatus;
  
  /** Timestamp when the document was created */
  createdAt: Date;
  
  /** Timestamp when the document was last updated */
  updatedAt: Date;
  
  /**
   * Creates a new document instance
   * @param data Optional partial document data to initialize with
   */
  constructor(data: Partial<Document> = {}) {
    // Initialize with provided data or defaults
    this.id = data.id || '';
    this.ownerId = data.ownerId || '';
    this.name = data.name || '';
    this.type = data.type || DOCUMENT_TYPES.OTHER;
    this.mimeType = data.mimeType || 'application/octet-stream';
    this.size = data.size || 0;
    this.storageUrl = data.storageUrl || '';
    this.status = data.status || DocumentStatus.UPLOADING;
    
    // Initialize metadata with defaults if not provided
    this.metadata = data.metadata || {
      title: this.name || 'Untitled',
      description: '',
      tags: [],
      category: '',
      isConfidential: false
    };
    
    // Set timestamps
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }
  
  /**
   * Converts the document object to a plain JSON object for serialization
   * @returns A plain JavaScript object representation of the document
   */
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      ownerId: this.ownerId,
      name: this.name,
      type: this.type,
      mimeType: this.mimeType,
      size: this.size,
      storageUrl: this.storageUrl,
      metadata: { ...this.metadata },
      status: this.status,
      createdAt: this.createdAt instanceof Date ? this.createdAt.toISOString() : this.createdAt,
      updatedAt: this.updatedAt instanceof Date ? this.updatedAt.toISOString() : this.updatedAt
    };
  }
  
  /**
   * Updates the status of the document
   * @param status New status to set
   */
  updateStatus(status: DocumentStatus): void {
    this.status = status;
    this.updatedAt = new Date();
  }
  
  /**
   * Updates the metadata of the document
   * @param metadata Partial metadata to update
   */
  updateMetadata(metadata: Partial<DocumentMetadata>): void {
    this.metadata = { ...this.metadata, ...metadata };
    this.updatedAt = new Date();
  }
  
  /**
   * Checks if the document is available for use
   * @returns True if the document is available, false otherwise
   */
  isAvailable(): boolean {
    return this.status === DocumentStatus.AVAILABLE;
  }
  
  /**
   * Checks if the document is currently being processed
   * @returns True if the document is being processed, false otherwise
   */
  isProcessing(): boolean {
    return this.status === DocumentStatus.PROCESSING;
  }
  
  /**
   * Checks if the document has an error
   * @returns True if the document has an error, false otherwise
   */
  hasError(): boolean {
    return this.status === DocumentStatus.ERROR;
  }
  
  /**
   * Gets the file extension based on the MIME type
   * @returns The file extension (e.g., 'pdf', 'docx')
   */
  getFileExtension(): string {
    const mimeToExtension: Record<string, string> = {
      'application/pdf': 'pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/msword': 'doc',
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/tiff': 'tiff',
      'application/xml': 'xml',
      'application/json': 'json'
    };
    
    return mimeToExtension[this.mimeType] || 'bin';
  }
  
  /**
   * Gets the formatted file size in KB, MB, etc.
   * @returns The formatted file size (e.g., '2.5 MB')
   */
  getFormattedSize(): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = this.size;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(size < 10 && unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
  }
  
  /**
   * Checks if the document is marked as confidential
   * @returns True if the document is confidential, false otherwise
   */
  isConfidential(): boolean {
    return this.metadata?.isConfidential || false;
  }
}