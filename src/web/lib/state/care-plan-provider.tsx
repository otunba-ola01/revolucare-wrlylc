import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
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
import * as carePlanApi from '../../lib/api/care-plans';
import useAuth from '../../hooks/use-auth';
import { useToast } from '../../hooks/use-toast';
import { 
  carePlanFormSchema, 
  carePlanApprovalSchema, 
  carePlanGenerationSchema, 
  carePlanFilterSchema 
} from '../../lib/schemas/care-plan';

/**
 * Interface defining the shape of the care plan context
 * Contains state variables and functions for managing care plans
 */
interface CarePlanContextType {
  // State
  currentPlan: CarePlan | null;
  planOptions: CarePlanOption[];
  isLoading: boolean;
  error: string | null;
  
  // Functions
  fetchCarePlan: (id: string) => Promise<CarePlan | null>;
  createCarePlan: (data: CarePlanFormData) => Promise<CarePlan | null>;
  updateCarePlan: (id: string, data: CarePlanFormData) => Promise<CarePlan | null>;
  deleteCarePlan: (id: string) => Promise<boolean>;
  approveCarePlan: (id: string, data: CarePlanApprovalData) => Promise<CarePlan | null>;
  generateCarePlanOptions: (params: CarePlanGenerationParams) => Promise<CarePlanOptionsResponse | null>;
  getCarePlanHistory: (id: string) => Promise<CarePlanHistoryData | null>;
  clearCurrentPlan: () => void;
  clearPlanOptions: () => void;
  selectPlanOption: (index: number) => CarePlanOption | null;
}

/**
 * Custom hook to access the care plan context
 * @returns Care plan context with state and functions
 * @throws Error if used outside of a CarePlanProvider
 */
export function useCarePlanContext(): CarePlanContextType {
  const context = useContext(CarePlanContext);
  if (!context) {
    throw new Error('useCarePlanContext must be used within a CarePlanProvider');
  }
  return context;
}

/**
 * Creates the care plan context with default values
 * @returns React context for care plans
 */
export function createCarePlanContext(): React.Context<CarePlanContextType> {
  return createContext<CarePlanContextType>({
    // Default state
    currentPlan: null,
    planOptions: [],
    isLoading: false,
    error: null,
    
    // Default function implementations (will be overridden by provider)
    fetchCarePlan: async () => null,
    createCarePlan: async () => null,
    updateCarePlan: async () => null,
    deleteCarePlan: async () => false,
    approveCarePlan: async () => null,
    generateCarePlanOptions: async () => null,
    getCarePlanHistory: async () => null,
    clearCurrentPlan: () => {},
    clearPlanOptions: () => {},
    selectPlanOption: () => null,
  });
}

// Create the context
export const CarePlanContext = createCarePlanContext();

/**
 * React context provider component that manages care plan state and provides care plan functions
 * This component serves as the central care plan management system for the Revolucare platform
 */
export const CarePlanProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter();
  const { toast } = useToast();
  
  // State management
  const [currentPlan, setCurrentPlan] = useState<CarePlan | null>(null);
  const [planOptions, setPlanOptions] = useState<CarePlanOption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Fetches a care plan by ID
   * @param id The care plan ID
   * @returns Promise resolving to the care plan or null
   */
  const fetchCarePlan = async (id: string): Promise<CarePlan | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const plan = await carePlanApi.getCarePlanById(id);
      setCurrentPlan(plan);
      return plan;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch care plan';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Creates a new care plan
   * @param data Care plan form data
   * @returns Promise resolving to the created care plan or null
   */
  const createCarePlan = async (data: CarePlanFormData): Promise<CarePlan | null> => {
    try {
      // Validate form data
      carePlanFormSchema.parse(data);
      
      setIsLoading(true);
      setError(null);
      
      const createdPlan = await carePlanApi.createCarePlan(data);
      setCurrentPlan(createdPlan);
      
      toast({
        title: 'Care plan created',
        description: 'The care plan has been created successfully.',
        variant: 'success',
      });
      
      return createdPlan;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create care plan';
      setError(errorMessage);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'error',
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Updates an existing care plan
   * @param id The care plan ID
   * @param data Updated care plan form data
   * @returns Promise resolving to the updated care plan or null
   */
  const updateCarePlan = async (id: string, data: CarePlanFormData): Promise<CarePlan | null> => {
    try {
      // Validate form data
      carePlanFormSchema.parse(data);
      
      setIsLoading(true);
      setError(null);
      
      const updatedPlan = await carePlanApi.updateCarePlan(id, data);
      setCurrentPlan(updatedPlan);
      
      toast({
        title: 'Care plan updated',
        description: 'The care plan has been updated successfully.',
        variant: 'success',
      });
      
      return updatedPlan;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update care plan';
      setError(errorMessage);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'error',
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Deletes a care plan
   * @param id The care plan ID
   * @returns Promise resolving to success status
   */
  const deleteCarePlan = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await carePlanApi.deleteCarePlan(id);
      
      if (response.success) {
        setCurrentPlan(null);
        
        toast({
          title: 'Care plan deleted',
          description: 'The care plan has been deleted successfully.',
          variant: 'success',
        });
        
        // Navigate to care plans list
        router.push('/care-plans');
        
        return true;
      } else {
        throw new Error(response.message || 'Failed to delete care plan');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete care plan';
      setError(errorMessage);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'error',
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Approves or rejects a care plan
   * @param id The care plan ID
   * @param data Approval data including status and notes
   * @returns Promise resolving to the approved care plan or null
   */
  const approveCarePlan = async (id: string, data: CarePlanApprovalData): Promise<CarePlan | null> => {
    try {
      // Validate approval data
      carePlanApprovalSchema.parse(data);
      
      setIsLoading(true);
      setError(null);
      
      const approvedPlan = await carePlanApi.approveCarePlan(id, data);
      setCurrentPlan(approvedPlan);
      
      const actionType = data.status === 'approved' ? 'approved' : 'rejected';
      
      toast({
        title: `Care plan ${actionType}`,
        description: `The care plan has been ${actionType} successfully.`,
        variant: 'success',
      });
      
      return approvedPlan;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process care plan approval';
      setError(errorMessage);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'error',
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Generates AI-powered care plan options
   * @param params Generation parameters including client ID, document IDs, and context
   * @returns Promise resolving to care plan options or null
   */
  const generateCarePlanOptions = async (params: CarePlanGenerationParams): Promise<CarePlanOptionsResponse | null> => {
    try {
      // Validate generation parameters
      carePlanGenerationSchema.parse(params);
      
      setIsLoading(true);
      setError(null);
      
      const options = await carePlanApi.generateCarePlanOptions(params);
      setPlanOptions(options.options);
      
      toast({
        title: 'Care plan options generated',
        description: `${options.options.length} care plan options have been generated.`,
        variant: 'success',
      });
      
      return options;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate care plan options';
      setError(errorMessage);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'error',
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Fetches the version history of a care plan
   * @param id The care plan ID
   * @returns Promise resolving to care plan history or null
   */
  const getCarePlanHistory = async (id: string): Promise<CarePlanHistoryData | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const history = await carePlanApi.getCarePlanHistory(id);
      return history;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch care plan history';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Clears the current care plan from state
   */
  const clearCurrentPlan = useCallback(() => {
    setCurrentPlan(null);
    setError(null);
  }, []);
  
  /**
   * Clears the care plan options from state
   */
  const clearPlanOptions = useCallback(() => {
    setPlanOptions([]);
    setError(null);
  }, []);
  
  /**
   * Selects a care plan option to use as the current plan
   * @param index The index of the option to select
   * @returns The selected care plan option or null
   */
  const selectPlanOption = useCallback((index: number): CarePlanOption | null => {
    if (index >= 0 && index < planOptions.length) {
      return planOptions[index];
    }
    return null;
  }, [planOptions]);
  
  // Create the context value
  const contextValue: CarePlanContextType = {
    currentPlan,
    planOptions,
    isLoading,
    error,
    fetchCarePlan,
    createCarePlan,
    updateCarePlan,
    deleteCarePlan,
    approveCarePlan,
    generateCarePlanOptions,
    getCarePlanHistory,
    clearCurrentPlan,
    clearPlanOptions,
    selectPlanOption,
  };
  
  return (
    <CarePlanContext.Provider value={contextValue}>
      {children}
    </CarePlanContext.Provider>
  );
};