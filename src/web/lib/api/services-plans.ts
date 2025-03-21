import { get, post, put, delete as deleteRequest } from './client';
import { ApiEndpoint, PaginatedResponse } from '../../types/api';
import {
  ServicesPlan,
  ServicesPlanWithClientInfo,
  NeedsAssessment,
  ServicesPlanFormData,
  NeedsAssessmentFormData,
  ServicesPlanOption,
  ServicesPlanGenerationParams,
  ServicesPlanApprovalData,
  ServicesPlanFilterParams,
  CostEstimate,
  FundingSourceInfo,
  ServiceItemFormData
} from '../../types/service-plan';

/**
 * Retrieves a specific service plan by ID
 * 
 * @param id The ID of the service plan to retrieve
 * @returns Promise resolving to the service plan data
 */
export async function getServicesPlan(id: string): Promise<ServicesPlan> {
  const url = `${ApiEndpoint.SERVICES_PLANS}/${id}`;
  return get<ServicesPlan>(url);
}

/**
 * Retrieves a paginated list of service plans with optional filtering
 * 
 * @param filterParams Filter and pagination parameters
 * @returns Promise resolving to paginated service plans with client info
 */
export async function getServicesPlansList(
  filterParams: ServicesPlanFilterParams
): Promise<PaginatedResponse<ServicesPlanWithClientInfo>> {
  const url = ApiEndpoint.SERVICES_PLANS;
  return get<PaginatedResponse<ServicesPlanWithClientInfo>>(url, filterParams);
}

/**
 * Creates a new service plan
 * 
 * @param data The service plan form data
 * @returns Promise resolving to the created service plan
 */
export async function createServicesPlan(
  data: ServicesPlanFormData
): Promise<ServicesPlan> {
  const url = ApiEndpoint.SERVICES_PLANS;
  return post<ServicesPlan>(url, data);
}

/**
 * Updates an existing service plan
 * 
 * @param id The ID of the service plan to update
 * @param data The updated service plan form data
 * @returns Promise resolving to the updated service plan
 */
export async function updateServicesPlan(
  id: string,
  data: ServicesPlanFormData
): Promise<ServicesPlan> {
  const url = `${ApiEndpoint.SERVICES_PLANS}/${id}`;
  return put<ServicesPlan>(url, data);
}

/**
 * Deletes a service plan
 * 
 * @param id The ID of the service plan to delete
 * @returns Promise resolving when the service plan is deleted
 */
export async function deleteServicesPlan(id: string): Promise<void> {
  const url = `${ApiEndpoint.SERVICES_PLANS}/${id}`;
  return deleteRequest<void>(url);
}

/**
 * Approves a service plan
 * 
 * @param id The ID of the service plan to approve
 * @param data The approval data
 * @returns Promise resolving to the approved service plan
 */
export async function approveServicesPlan(
  id: string,
  data: ServicesPlanApprovalData
): Promise<ServicesPlan> {
  const url = `${ApiEndpoint.SERVICES_PLANS}/${id}/approve`;
  return post<ServicesPlan>(url, data);
}

/**
 * Rejects a service plan
 * 
 * @param id The ID of the service plan to reject
 * @param data The rejection data
 * @returns Promise resolving to the rejected service plan
 */
export async function rejectServicesPlan(
  id: string,
  data: ServicesPlanApprovalData
): Promise<ServicesPlan> {
  const url = `${ApiEndpoint.SERVICES_PLANS}/${id}/reject`;
  return post<ServicesPlan>(url, data);
}

/**
 * Generates AI-powered service plan options based on client needs
 * 
 * @param params Parameters for service plan generation
 * @returns Promise resolving to an array of service plan options
 */
export async function generateServicesPlanOptions(
  params: ServicesPlanGenerationParams
): Promise<ServicesPlanOption[]> {
  const url = `${ApiEndpoint.SERVICES_PLANS}/generate`;
  return post<ServicesPlanOption[]>(url, params);
}

/**
 * Retrieves a specific needs assessment by ID
 * 
 * @param id The ID of the needs assessment to retrieve
 * @returns Promise resolving to the needs assessment data
 */
export async function getNeedsAssessment(id: string): Promise<NeedsAssessment> {
  const url = `${ApiEndpoint.SERVICES_PLANS}/assessments/${id}`;
  return get<NeedsAssessment>(url);
}

/**
 * Retrieves all needs assessments for a specific client
 * 
 * @param clientId The ID of the client
 * @returns Promise resolving to an array of needs assessments
 */
export async function getClientNeedsAssessments(
  clientId: string
): Promise<NeedsAssessment[]> {
  const url = `${ApiEndpoint.SERVICES_PLANS}/assessments`;
  return get<NeedsAssessment[]>(url, { clientId });
}

/**
 * Creates a new needs assessment
 * 
 * @param data The needs assessment form data
 * @returns Promise resolving to the created needs assessment
 */
export async function createNeedsAssessment(
  data: NeedsAssessmentFormData
): Promise<NeedsAssessment> {
  const url = `${ApiEndpoint.SERVICES_PLANS}/assessments`;
  return post<NeedsAssessment>(url, data);
}

/**
 * Updates an existing needs assessment
 * 
 * @param id The ID of the needs assessment to update
 * @param data The updated needs assessment form data
 * @returns Promise resolving to the updated needs assessment
 */
export async function updateNeedsAssessment(
  id: string,
  data: NeedsAssessmentFormData
): Promise<NeedsAssessment> {
  const url = `${ApiEndpoint.SERVICES_PLANS}/assessments/${id}`;
  return put<NeedsAssessment>(url, data);
}

/**
 * Deletes a needs assessment
 * 
 * @param id The ID of the needs assessment to delete
 * @returns Promise resolving when the needs assessment is deleted
 */
export async function deleteNeedsAssessment(id: string): Promise<void> {
  const url = `${ApiEndpoint.SERVICES_PLANS}/assessments/${id}`;
  return deleteRequest<void>(url);
}

/**
 * Estimates the cost of a service plan
 * 
 * @param servicesPlanId The ID of the service plan to estimate
 * @returns Promise resolving to the cost estimate data
 */
export async function estimateServicesPlanCost(
  servicesPlanId: string
): Promise<CostEstimate> {
  const url = `${ApiEndpoint.SERVICES_PLANS}/${servicesPlanId}/cost-estimate`;
  return get<CostEstimate>(url);
}

/**
 * Estimates the cost of service items for a client
 * 
 * @param clientId The ID of the client
 * @param services The service items to estimate
 * @returns Promise resolving to the cost estimate data
 */
export async function estimateServicesItemsCost(
  clientId: string,
  services: ServiceItemFormData[]
): Promise<CostEstimate> {
  const url = `${ApiEndpoint.SERVICES_PLANS}/cost-estimate`;
  return post<CostEstimate>(url, { clientId, services });
}

/**
 * Retrieves potential funding sources for a client
 * 
 * @param clientId The ID of the client
 * @returns Promise resolving to an array of funding source information
 */
export async function getClientFundingSources(
  clientId: string
): Promise<FundingSourceInfo[]> {
  const url = `${ApiEndpoint.SERVICES_PLANS}/funding-sources`;
  return get<FundingSourceInfo[]>(url, { clientId });
}

/**
 * Retrieves all service plans for a specific client
 * 
 * @param clientId The ID of the client
 * @returns Promise resolving to an array of service plans
 */
export async function getClientServicePlans(
  clientId: string
): Promise<ServicesPlan[]> {
  const url = ApiEndpoint.SERVICES_PLANS;
  return get<ServicesPlan[]>(url, { clientId });
}