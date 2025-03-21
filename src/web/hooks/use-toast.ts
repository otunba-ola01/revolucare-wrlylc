import { createContext, useContext, useState, useCallback, ReactNode } from 'react'; // react ^18.2.0
import { v4 as uuidv4 } from 'uuid'; // uuid ^9.0.0

/**
 * Interface representing a toast notification
 */
export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Props for creating a toast notification
 */
export type ToastProps = Omit<Toast, 'id'>;

/**
 * Type definition for the toast context
 */
export interface ToastContextType {
  toasts: Toast[];
  toast: (props: ToastProps) => string;
  update: (id: string, props: ToastProps) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

/**
 * Creates the toast context with default values
 */
const createToastContext = () => {
  return createContext<ToastContextType>({
    toasts: [],
    toast: () => "",
    update: () => {},
    dismiss: () => {},
    dismissAll: () => {},
  });
};

export const ToastContext = createToastContext();

/**
 * Provider component that manages toast state and provides toast functions
 */
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  /**
   * Creates a new toast notification
   * @param props The properties of the toast
   * @returns The ID of the created toast
   */
  const toast = useCallback((props: ToastProps): string => {
    const id = uuidv4();
    const newToast: Toast = { id, ...props };
    
    setToasts((prevToasts) => [...prevToasts, newToast]);
    
    return id;
  }, []);

  /**
   * Updates an existing toast notification
   * @param id The ID of the toast to update
   * @param props The new properties to apply
   */
  const update = useCallback((id: string, props: ToastProps) => {
    setToasts((prevToasts) => 
      prevToasts.map((toast) => 
        toast.id === id ? { ...toast, ...props } : toast
      )
    );
  }, []);

  /**
   * Removes a toast notification
   * @param id The ID of the toast to remove
   */
  const dismiss = useCallback((id: string) => {
    setToasts((prevToasts) => 
      prevToasts.filter((toast) => toast.id !== id)
    );
  }, []);

  /**
   * Removes all toast notifications
   */
  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider 
      value={{ 
        toasts, 
        toast, 
        update, 
        dismiss, 
        dismissAll 
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};

/**
 * Custom hook that provides toast notification functionality
 * @returns Toast context with state and functions
 */
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  
  return context;
};