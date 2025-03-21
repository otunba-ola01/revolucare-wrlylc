import { get, post, put, delete as deleteRequest } from './client';
import { formatQueryParams } from './client';
import {
  CarePlan,
  CarePlanFormData,
  CarePlanOption,
  CarePlanOptionsResponse,
  CarePlanGenerationParams,
  CarePlanFilterParams,
  CarePlanWithClientInfo,
  PaginatedCarePlansResponse,
  CarePlanHistoryData,
  CarePlanApprovalData
} from '../../types/care-plan';

/**
 * Fetches care plans with optional filtering and pagination
 * 
 * @param filterParams Filter and pagination parameters
 * @returns Promise resolving to paginated care plans response
 */
export async function getCarePlans(filterParams: CarePlanFilterParams): Promise<PaginatedCarePlansResponse> {
  const queryParams = formatQueryParams(filterParams);
  return get<PaginatedCarePlansResponse>(`/api/care-plans${queryParams}`);
}

/**
 * Fetches a single care plan by its ID
 * 
 * @param id The care plan ID
 * @returns Promise resolving to the care plan
 */
export async function getCarePlanById(id: string): Promise<CarePlan> {
  return get<CarePlan>(`/api/care-plans/${id}`);
}

/**
 * Creates a new care plan
 * 
 * @param data Care plan form data
 * @returns Promise resolving to the created care plan
 */
export async function createCarePlan(data: CarePlanFormData): Promise<CarePlan> {
  return post<CarePlan>('/api/care-plans', data);
}

/**
 * Updates an existing care plan
 * 
 * @param id The care plan ID
 * @param data Updated care plan form data
 * @returns Promise resolving to the updated care plan
 */
export async function updateCarePlan(id: string, data: CarePlanFormData): Promise<CarePlan> {
  return put<CarePlan>(`/api/care-plans/${id}`, data);
}

/**
 * Deletes a care plan
 * 
 * @param id The care plan ID
 * @returns Promise resolving to success response
 */
export async function deleteCarePlan(id: string): Promise<{ success: boolean; message: string }> {
  return deleteRequest<{ success: boolean; message: string }>(`/api/care-plans/${id}`);
}

/**
 * Approves or rejects a care plan
 * 
 * @param id The care plan ID
 * @param data Approval data including status and notes
 * @returns Promise resolving to the approved care plan
 */
export async function approveCarePlan(id: string, data: CarePlanApprovalData): Promise<CarePlan> {
  return post<CarePlan>(`/api/care-plans/${id}/approve`, data);
}

/**
 * Fetches the version history of a care plan
 * 
 * @param id The care plan ID
 * @returns Promise resolving to care plan history data
 */
export async function getCarePlanHistory(id: string): Promise<CarePlanHistoryData> {
  return get<CarePlanHistoryData>(`/api/care-plans/${id}/history`);
}

/**
 * Generates AI-powered care plan options based on client information and documents
 * 
 * @param params Generation parameters including client ID, document IDs, and context
 * @returns Promise resolving to care plan options
 */
export async function generateCarePlanOptions(params: CarePlanGenerationParams): Promise<CarePlanOptionsResponse> {
  return post<CarePlanOptionsResponse>('/api/care-plans/generate', params);
}