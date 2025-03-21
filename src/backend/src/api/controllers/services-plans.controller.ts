import { Request, Response, NextFunction } from 'express'; // express@^4.18.2
import {
  IServicesPlanService,
} from '../../interfaces/services-plan.interface';
import {
  ServicesPlanService,
} from '../../services/services-plans.service';
import {
  CreateNeedsAssessmentDTO,
  CreateServicesPlanDTO,
  UpdateServicesPlanDTO,
  ApproveServicesPlanDTO,
  GenerateServicesPlanDTO,
  ServicesPlanFilterParams,
} from '../../types/services-plan.types';
import {
  ApiResponse, ServicesPlanResponse, NeedsAssessmentResponse, PaginatedResponse
} from '../../types/response.types';
import { AuthenticatedRequest } from '../../interfaces/auth.interface';
import { logger } from '../../utils/logger';
import { errorFactory } from '../../utils/error-handler';

/**
 * Controller that handles HTTP requests for services plan operations
 */
export class ServicesPlanController {
  /**
   * Creates a new instance of the ServicesPlanController
   * @param servicesPlanService 
   */
  constructor(private servicesPlanService: IServicesPlanService = new ServicesPlanService()) {
    // Store the provided services plan service as an instance property
    this.servicesPlanService = servicesPlanService;
  }

  /**
   * Creates a new needs assessment for a client
   * @param req 
   * @param res 
   * @param next 
   */
  async createNeedsAssessment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract needs assessment data from request body
      const assessmentData: CreateNeedsAssessmentDTO = req.body;

      // Extract user ID from authenticated request
      const userId: string = req.user.userId;

      // Call service to create needs assessment
      const needsAssessment = await this.servicesPlanService.createNeedsAssessment(assessmentData, userId);

      // Return success response with created needs assessment
      res.status(201).json({
        success: true,
        message: 'Needs assessment created successfully',
        data: needsAssessment,
      } as ApiResponse<NeedsAssessmentResponse>);
    } catch (error) {
      // Catch and forward any errors to error middleware
      next(error);
    }
  }

  /**
   * Retrieves a needs assessment by its ID
   * @param req 
   * @param res 
   * @param next 
   */
  async getNeedsAssessment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract needs assessment ID from request parameters
      const { id } = req.params;

      // Call service to retrieve needs assessment
      const needsAssessment = await this.servicesPlanService.getNeedsAssessment(id);

      // Return success response with needs assessment
      res.status(200).json({
        success: true,
        message: 'Needs assessment retrieved successfully',
        data: needsAssessment,
      } as ApiResponse<NeedsAssessmentResponse>);
    } catch (error) {
      // Catch and forward any errors to error middleware
      next(error);
    }
  }

  /**
   * Retrieves all needs assessments for a specific client
   * @param req 
   * @param res 
   * @param next 
   */
  async getNeedsAssessmentsByClientId(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract client ID from request parameters
      const { clientId } = req.params;

      // Call service to retrieve needs assessments for client
      const needsAssessments = await this.servicesPlanService.getNeedsAssessmentsByClientId(clientId);

      // Return success response with needs assessments
      res.status(200).json({
        success: true,
        message: 'Needs assessments retrieved successfully',
        data: needsAssessments,
      } as ApiResponse<NeedsAssessmentResponse[]>);
    } catch (error) {
      // Catch and forward any errors to error middleware
      next(error);
    }
  }

  /**
   * Creates a new services plan
   * @param req 
   * @param res 
   * @param next 
   */
  async createServicesPlan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract services plan data from request body
      const servicesPlanData: CreateServicesPlanDTO = req.body;

      // Extract user ID from authenticated request
      const userId: string = req.user.userId;

      // Call service to create services plan
      const servicesPlan = await this.servicesPlanService.createServicesPlan(servicesPlanData, userId);

      // Return success response with created services plan
      res.status(201).json({
        success: true,
        message: 'Services plan created successfully',
        data: servicesPlan,
      } as ApiResponse<ServicesPlanResponse>);
    } catch (error) {
      // Catch and forward any errors to error middleware
      next(error);
    }
  }

  /**
   * Retrieves a services plan by its ID
   * @param req 
   * @param res 
   * @param next 
   */
  async getServicesPlanById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract services plan ID from request parameters
      const { id } = req.params;

      // Call service to retrieve services plan
      const servicesPlan = await this.servicesPlanService.getServicesPlanById(id);

      // Return success response with services plan
      res.status(200).json({
        success: true,
        message: 'Services plan retrieved successfully',
        data: servicesPlan,
      } as ApiResponse<ServicesPlanResponse>);
    } catch (error) {
      // Catch and forward any errors to error middleware
      next(error);
    }
  }

  /**
   * Retrieves services plans based on filter parameters
   * @param req 
   * @param res 
   * @param next 
   */
  async getServicesPlans(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract filter parameters from request query
      const filterParams: ServicesPlanFilterParams = req.query as any;

      // Call service to retrieve filtered services plans
      const servicesPlans = await this.servicesPlanService.getServicesPlans(filterParams);

      // Return paginated response with services plans
      res.status(200).json({
        success: true,
        message: 'Services plans retrieved successfully',
        data: servicesPlans,
      } as ApiResponse<ServicesPlanResponse[]>);
    } catch (error) {
      // Catch and forward any errors to error middleware
      next(error);
    }
  }

  /**
   * Updates an existing services plan
   * @param req 
   * @param res 
   * @param next 
   */
  async updateServicesPlan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract services plan ID from request parameters
      const { id } = req.params;

      // Extract update data from request body
      const updateData: UpdateServicesPlanDTO = req.body;

      // Call service to update services plan
      const servicesPlan = await this.servicesPlanService.updateServicesPlan(id, updateData);

      // Return success response with updated services plan
      res.status(200).json({
        success: true,
        message: 'Services plan updated successfully',
        data: servicesPlan,
      } as ApiResponse<ServicesPlanResponse>);
    } catch (error) {
      // Catch and forward any errors to error middleware
      next(error);
    }
  }

  /**
   * Approves a services plan, changing its status to APPROVED
   * @param req 
   * @param res 
   * @param next 
   */
  async approveServicesPlan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract services plan ID from request parameters
      const { id } = req.params;

      // Extract approval data from request body
      const approvalData: ApproveServicesPlanDTO = req.body;

      // Extract user ID from authenticated request
      const userId: string = req.user.userId;

      // Call service to approve services plan
      const servicesPlan = await this.servicesPlanService.approveServicesPlan(id, approvalData, userId);

      // Return success response with approved services plan
      res.status(200).json({
        success: true,
        message: 'Services plan approved successfully',
        data: servicesPlan,
      } as ApiResponse<ServicesPlanResponse>);
    } catch (error) {
      // Catch and forward any errors to error middleware
      next(error);
    }
  }

  /**
   * Deletes a services plan
   * @param req 
   * @param res 
   * @param next 
   */
  async deleteServicesPlan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract services plan ID from request parameters
      const { id } = req.params;

      // Call service to delete services plan
      const success = await this.servicesPlanService.deleteServicesPlan(id);

      // Return success response confirming deletion
      res.status(200).json({
        success: true,
        message: 'Services plan deleted successfully',
        data: { deleted: success },
      } as ApiResponse<{ deleted: boolean }>);
    } catch (error) {
      // Catch and forward any errors to error middleware
      next(error);
    }
  }

  /**
   * Generates service plan options based on needs assessment and care plan
   * @param req 
   * @param res 
   * @param next 
   */
  async generateServicesPlanOptions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract generation parameters from request body
      const generationParams: GenerateServicesPlanDTO = req.body;

      // Extract user ID from authenticated request
      const userId: string = req.user.userId;

      // Call service to generate services plan options
      const servicePlanOptions = await this.servicesPlanService.generateServicesPlanOptions(generationParams);

      // Return success response with generated options and confidence scores
      res.status(200).json({
        success: true,
        message: 'Services plan options generated successfully',
        data: servicePlanOptions,
      } as ApiResponse<ServicesPlanOptionsResponse>);
    } catch (error) {
      // Catch and forward any errors to error middleware
      next(error);
    }
  }

  /**
   * Estimates costs for a services plan
   * @param req 
   * @param res 
   * @param next 
   */
  async estimateCosts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract services plan ID from request parameters
      const { id } = req.params;

      // Call service to estimate costs for services plan
      const costEstimate = await this.servicesPlanService.estimateCosts(id);

      // Return success response with cost estimate details
      res.status(200).json({
        success: true,
        message: 'Cost estimate generated successfully',
        data: costEstimate,
      } as ApiResponse<CostEstimateResponse>);
    } catch (error) {
      // Catch and forward any errors to error middleware
      next(error);
    }
  }

  /**
   * Identifies potential funding sources for a client's services plan
   * @param req 
   * @param res 
   * @param next 
   */
  async identifyFundingSources(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract client ID and services plan ID from request parameters
      const { clientId, id } = req.params;

      // Call service to identify funding sources
      const fundingSources = await this.servicesPlanService.identifyFundingSources(clientId, id);

      // Return success response with funding sources information
      res.status(200).json({
        success: true,
        message: 'Funding sources identified successfully',
        data: fundingSources,
      } as ApiResponse<FundingSourcesResponse>);
    } catch (error) {
      // Catch and forward any errors to error middleware
      next(error);
    }
  }
}