import React from 'react';
import { AlertTriangle } from 'lucide-react'; // ^0.284.0
import { cn } from '../../lib/utils/color';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
  children,
  className,
}) => {
  // Determine button variant based on dialog variant
  const buttonVariant = variant === 'danger' ? 'danger' : 'primary';
  
  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        // Prevent closing during loading state
        if (isLoading && !newOpen) return;
        onOpenChange(newOpen);
      }}
    >
      <DialogContent
        className={cn(
          'sm:max-w-md',
          variant === 'danger' && 'border-red-200',
          variant === 'warning' && 'border-amber-200',
          variant === 'info' && 'border-indigo-200',
          className
        )}
        showCloseButton={!isLoading}
        aria-labelledby="confirmation-dialog-title"
        aria-describedby="confirmation-dialog-description"
      >
        <DialogHeader>
          <div className="flex flex-row items-center gap-2">
            {variant === 'danger' && (
              <AlertTriangle className="h-6 w-6 text-red-500" aria-hidden="true" />
            )}
            {variant === 'warning' && (
              <AlertTriangle className="h-6 w-6 text-amber-500" aria-hidden="true" />
            )}
            <DialogTitle id="confirmation-dialog-title">{title}</DialogTitle>
          </div>
          <DialogDescription id="confirmation-dialog-description">
            {description}
          </DialogDescription>
        </DialogHeader>

        {children}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onCancel?.();
            }}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          
          <Button
            type="button"
            variant={buttonVariant}
            onClick={() => onConfirm()}
            isLoading={isLoading}
            autoFocus
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};