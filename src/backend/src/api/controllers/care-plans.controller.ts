import { Request, Response } from 'express'; // express@^4.18.2
import { ICarePlanService } from '../../interfaces/care-plan.interface';
import { CarePlansService, createCarePlansService } from '../../services/care-plans.service';
import { CreateCarePlanDTO, UpdateCarePlanDTO, ApproveCarePlanDTO, GenerateCarePlanDTO, CarePlanFilterParams } from '../../types/care-plan.types';
import { ApiResponse, PaginatedResponse, CarePlanResponse, CarePlanOptionsResponse } from '../../types/response.types';
import { AuthenticatedRequest } from '../../interfaces/auth.interface';
import { logger, errorHandler } from '../../utils/logger';

/**
 * Controller class for handling care plan-related API endpoints
 */
class CarePlansController {
  private carePlanService: ICarePlanService;

  /**
   * Creates a new CarePlansController instance with the care plan service
   * @param carePlanService 
   */
  constructor(carePlanService: ICarePlanService = createCarePlansService()) {
    this.carePlanService = carePlanService;
  }

  /**
   * Creates a new care plan
   * @param req 
   * @param res 
   */
  public createCarePlan = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Extract care plan data from request body
      const carePlanData: CreateCarePlanDTO = req.body;

      // Extract user ID and role from authenticated request
      const userId: string = req.user.userId;

      // Call care plan service to create the care plan
      const createdCarePlan = await this.carePlanService.createCarePlan(carePlanData, userId);

      // Log successful care plan creation
      logger.info('Care plan created successfully', { carePlanId: createdCarePlan.id });

      // Return 201 Created response with the created care plan
      const response: ApiResponse<CarePlanResponse> = {
        success: true,
        message: 'Care plan created successfully',
        data: { carePlan: createdCarePlan },
      };
      res.status(201).json(response);
    } catch (error: any) {
      // Catch and handle any errors using the error handler
      errorHandler(res, error, 'Failed to create care plan');
    }
  };

  /**
   * Retrieves a care plan by its ID
   * @param req 
   * @param res 
   */
  public getCarePlanById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Extract care plan ID from request parameters
      const carePlanId: string = req.params.id;

      // Extract user ID and role from authenticated request
      const userId: string = req.user.userId;
      const userRole: string = req.user.role;

      // Call care plan service to retrieve the care plan
      const carePlan = await this.carePlanService.getCarePlanById(carePlanId, userId, userRole);

      // Return 200 OK response with the care plan
      const response: ApiResponse<CarePlanResponse> = {
        success: true,
        message: 'Care plan retrieved successfully',
        data: { carePlan: carePlan },
      };
      res.status(200).json(response);
    } catch (error: any) {
      // Catch and handle any errors using the error handler
      errorHandler(res, error, 'Failed to retrieve care plan');
    }
  };

  /**
   * Retrieves care plans based on filter parameters
   * @param req 
   * @param res 
   */
  public getCarePlans = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Extract filter parameters from request query
      const filters: CarePlanFilterParams = req.query as any;

      // Extract user ID and role from authenticated request
      const userId: string = req.user.userId;
      const userRole: string = req.user.role;

      // Call care plan service to retrieve filtered care plans
      const { carePlans, total } = await this.carePlanService.getCarePlans(filters, userId, userRole);

      // Return 200 OK response with paginated care plans
      const response: PaginatedResponse<CarePlanResponse> = {
        success: true,
        message: 'Care plans retrieved successfully',
        data: carePlans.map(carePlan => ({ carePlan: carePlan })),
        pagination: {
          page: filters.page ? parseInt(filters.page as string, 10) : 1,
          limit: filters.limit ? parseInt(filters.limit as string, 10) : 10,
          totalItems: total,
          totalPages: Math.ceil(total / (filters.limit ? parseInt(filters.limit as string, 10) : 10)),
        },
      };
      res.status(200).json(response);
    } catch (error: any) {
      // Catch and handle any errors using the error handler
      errorHandler(res, error, 'Failed to retrieve care plans');
    }
  };

  /**
   * Updates an existing care plan
   * @param req 
   * @param res 
   */
  public updateCarePlan = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Extract care plan ID from request parameters
      const carePlanId: string = req.params.id;

      // Extract update data from request body
      const updateData: UpdateCarePlanDTO = req.body;

      // Extract user ID and role from authenticated request
      const userId: string = req.user.userId;
      const userRole: string = req.user.role;

      // Call care plan service to update the care plan
      const updatedCarePlan = await this.carePlanService.updateCarePlan(carePlanId, updateData, userId, userRole);

      // Log successful care plan update
      logger.info('Care plan updated successfully', { carePlanId: updatedCarePlan.id });

      // Return 200 OK response with the updated care plan
      const response: ApiResponse<CarePlanResponse> = {
        success: true,
        message: 'Care plan updated successfully',
        data: { carePlan: updatedCarePlan },
      };
      res.status(200).json(response);
    } catch (error: any) {
      // Catch and handle any errors using the error handler
      errorHandler(res, error, 'Failed to update care plan');
    }
  };

  /**
   * Approves a care plan, changing its status to APPROVED
   * @param req 
   * @param res 
   */
  public approveCarePlan = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Extract care plan ID from request parameters
      const carePlanId: string = req.params.id;

      // Extract approval data from request body
      const approvalData: ApproveCarePlanDTO = req.body;

      // Extract user ID and role from authenticated request
      const userId: string = req.user.userId;
      const userRole: string = req.user.role;

      // Call care plan service to approve the care plan
      const approvedCarePlan = await this.carePlanService.approveCarePlan(carePlanId, approvalData, userId, userRole);

      // Log successful care plan approval
      logger.info('Care plan approved successfully', { carePlanId: approvedCarePlan.id });

      // Return 200 OK response with the approved care plan
      const response: ApiResponse<CarePlanResponse> = {
        success: true,
        message: 'Care plan approved successfully',
        data: { carePlan: approvedCarePlan },
      };
      res.status(200).json(response);
    } catch (error: any) {
      // Catch and handle any errors using the error handler
      errorHandler(res, error, 'Failed to approve care plan');
    }
  };

  /**
   * Deletes a care plan
   * @param req 
   * @param res 
   */
  public deleteCarePlan = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Extract care plan ID from request parameters
      const carePlanId: string = req.params.id;

      // Extract user ID and role from authenticated request
      const userId: string = req.user.userId;
      const userRole: string = req.user.role;

      // Call care plan service to delete the care plan
      const success = await this.carePlanService.deleteCarePlan(carePlanId, userId, userRole);

      // Log successful care plan deletion
      logger.info('Care plan deleted successfully', { carePlanId });

      // Return 200 OK response with deletion confirmation
      const response: ApiResponse<{ success: boolean }> = {
        success: true,
        message: 'Care plan deleted successfully',
        data: { success },
      };
      res.status(200).json(response);
    } catch (error: any) {
      // Catch and handle any errors using the error handler
      errorHandler(res, error, 'Failed to delete care plan');
    }
  };

  /**
   * Retrieves the version history of a care plan
   * @param req 
   * @param res 
   */
  public getCarePlanHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Extract care plan ID from request parameters
      const carePlanId: string = req.params.id;

      // Extract user ID and role from authenticated request
      const userId: string = req.user.userId;
      const userRole: string = req.user.role;

      // Call care plan service to retrieve the care plan history
      const carePlanHistory = await this.carePlanService.getCarePlanHistory(carePlanId, userId, userRole);

      // Return 200 OK response with the care plan history
      const response: ApiResponse<CarePlanResponse> = {
        success: true,
        message: 'Care plan history retrieved successfully',
        data: carePlanHistory as any,
      };
      res.status(200).json(response);
    } catch (error: any) {
      // Catch and handle any errors using the error handler
      errorHandler(res, error, 'Failed to retrieve care plan history');
    }
  };

  /**
   * Generates care plan options using AI based on client information and documents
   * @param req 
   * @param res 
   */
  public generateCarePlanOptions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Extract generation data from request body
      const generationData: GenerateCarePlanDTO = req.body;

      // Extract user ID and role from authenticated request
      const userId: string = req.user.userId;
      const userRole: string = req.user.role;

      // Call care plan service to generate care plan options
      const carePlanOptions = await this.carePlanService.generateCarePlanOptions(generationData, userId, userRole);

      // Log successful care plan options generation
      logger.info('Care plan options generated successfully', { clientId: generationData.clientId });

      // Return 200 OK response with the generated care plan options
      const response: ApiResponse<CarePlanOptionsResponse> = {
        success: true,
        message: 'Care plan options generated successfully',
        data: carePlanOptions as any,
      };
      res.status(200).json(response);
    } catch (error: any) {
      // Catch and handle any errors using the error handler
      errorHandler(res, error, 'Failed to generate care plan options');
    }
  };
}

// Export the CarePlansController class as the default export
export default CarePlansController;