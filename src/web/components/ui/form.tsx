import * as React from "react";
import {
  useFormContext,
  Controller,
  FieldValues,
  FieldErrors,
  FieldPath,
  UseFormRegister,
  ControllerRenderProps,
  ControllerFieldState,
  UseFormReturn,
} from "react-hook-form"; // v7.43.9
import { Label } from "@radix-ui/react-label"; // v2.0.2
import { Slot } from "@radix-ui/react-slot"; // v1.0.2

import { cn } from "../../lib/utils/color";
import { getFormErrorMessage } from "../../lib/utils/form";

/**
 * Creates a form context with typed generics for better type safety
 * @returns Form context with provider and consumer components
 */
function createFormContext<
  TFieldValues extends FieldValues = FieldValues,
  TContext = any
>() {
  const FormContext = React.createContext<UseFormReturn<TFieldValues, TContext> | null>(
    null
  );

  const FormProvider = ({
    children,
    ...props
  }: {
    children: React.ReactNode;
  } & UseFormReturn<TFieldValues, TContext>) => {
    return (
      <FormContext.Provider value={props}>{children}</FormContext.Provider>
    );
  };

  const useFormCtx = () => {
    const context = React.useContext(FormContext);
    if (!context) {
      throw new Error("useFormCtx must be used within a FormProvider");
    }
    return context;
  };

  return { FormContext, FormProvider, useFormCtx };
}

type FormFieldContextValue = {
  id: string;
  name: string;
  error?: any;
};

const FormFieldContext = React.createContext<FormFieldContextValue | undefined>(
  undefined
);

/**
 * Hook for accessing field context within custom form components
 * @returns Field context with ID, name, and error state
 */
function useFormField() {
  const context = React.useContext(FormFieldContext);
  if (!context) {
    throw new Error("useFormField must be used within a FormItem");
  }
  return context;
}

interface FormProps<TFieldValues extends FieldValues = FieldValues, TContext = any>
  extends React.FormHTMLAttributes<HTMLFormElement> {
  form: UseFormReturn<TFieldValues, TContext>;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
}

/**
 * Root form component that provides form context to children
 */
function Form<TFieldValues extends FieldValues = FieldValues, TContext = any>({
  form,
  onSubmit,
  children,
  className,
  ...props
}: FormProps<TFieldValues, TContext>) {
  return (
    <form
      onSubmit={onSubmit}
      className={cn("space-y-6", className)}
      {...props}
    >
      {children}
    </form>
  );
}

interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName;
  control: UseFormReturn<TFieldValues>["control"];
  render: (props: {
    field: ControllerRenderProps<TFieldValues, TName>;
    fieldState: ControllerFieldState;
  }) => React.ReactNode;
}

/**
 * Component for rendering form fields with validation and error handling
 */
function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  control,
  render,
}: FormFieldProps<TFieldValues, TName>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => render({ field, fieldState })}
    />
  );
}

interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {
  error?: any;
  name?: string;
}

/**
 * Container component for form field, label, and error message
 */
function FormItem({ className, error, name, ...props }: FormItemProps) {
  const id = React.useId();
  const fieldName = name || `field-${id}`;

  return (
    <FormFieldContext.Provider value={{ id, name: fieldName, error }}>
      <div
        className={cn("space-y-2", className)}
        {...props}
      />
    </FormFieldContext.Provider>
  );
}

interface FormLabelProps extends React.ComponentPropsWithoutRef<typeof Label> {
  required?: boolean;
}

/**
 * Accessible label component for form fields
 */
function FormLabel({ className, required, ...props }: FormLabelProps) {
  const { id, error } = useFormField();

  return (
    <Label
      htmlFor={id}
      className={cn(
        "text-sm font-medium leading-none",
        error && "text-destructive",
        className
      )}
      {...props}
    >
      {props.children}
      {required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
    </Label>
  );
}

interface FormControlProps extends React.ComponentPropsWithoutRef<typeof Slot> {}

/**
 * Component that provides form control props to form elements
 */
function FormControl({ ...props }: FormControlProps) {
  const { id, name, error } = useFormField();

  return (
    <Slot
      id={id}
      name={name}
      aria-describedby={
        !error
          ? `${id}-description`
          : `${id}-error`
      }
      aria-invalid={!!error}
      {...props}
    />
  );
}

interface FormDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

/**
 * Component for rendering descriptive text for form fields
 */
function FormDescription({ className, ...props }: FormDescriptionProps) {
  const { id } = useFormField();

  return (
    <p
      id={`${id}-description`}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  error?: any;
}

/**
 * Component for rendering validation error messages
 */
function FormMessage({ className, error, children, ...props }: FormMessageProps) {
  const { id, error: fieldError } = useFormField();
  const errorMessage = getFormErrorMessage(error || fieldError);

  if (!errorMessage && !children) {
    return null;
  }

  return (
    <p
      id={`${id}-error`}
      className={cn("text-sm font-medium text-destructive", className)}
      aria-live="polite"
      {...props}
    >
      {children || errorMessage}
    </p>
  );
}

interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
}

/**
 * Component for grouping related form fields into sections
 */
function FormSection({
  title,
  description,
  children,
  className,
  ...props
}: FormSectionProps) {
  return (
    <section
      className={cn("space-y-4", className)}
      {...props}
    >
      {title && <h3 className="text-lg font-medium">{title}</h3>}
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      <div className="space-y-4">{children}</div>
    </section>
  );
}

interface FormActionsProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Component for form action buttons (submit, cancel, etc.)
 */
function FormActions({ className, ...props }: FormActionsProps) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-4 sm:space-y-0 space-y-2",
        className
      )}
      {...props}
    />
  );
}

export {
  createFormContext,
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
  FormSection,
  FormActions,
};