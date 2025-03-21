"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, RefreshCw } from "lucide-react"; // v0.284.0

import { PageContainer } from "../../components/layout/page-container";
import { Button } from "../../components/ui/button";
import { ErrorMessage } from "../../components/common/error-message";

/**
 * Next.js error boundary component that handles runtime errors in the application.
 * Provides a user-friendly error page when unexpected errors occur during rendering or data fetching.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
    
    // In production, this would send to a monitoring service like Sentry
    // reportError(error);
  }, [error]);

  // Extract error message
  const errorMessage = error?.message || "An unexpected error occurred";

  return (
    <PageContainer className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <div 
        className="w-full max-w-md space-y-6"
        role="alert"
        aria-live="assertive"
      >
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Something went wrong
          </h1>
          <p className="text-muted-foreground text-gray-600 dark:text-gray-400">
            We've encountered an unexpected error
          </p>
        </div>

        <ErrorMessage 
          error={errorMessage} 
          className="mx-auto max-w-md"
        />

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button
            onClick={() => reset()}
            className="gap-2"
            aria-label="Try again"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try again</span>
          </Button>

          <Button
            variant="outline"
            className="gap-2"
            asChild
          >
            <Link href="/" aria-label="Return to home page">
              <Home className="h-4 w-4" />
              <span>Return to Home</span>
            </Link>
          </Button>
        </div>

        {error.digest && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-8">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </PageContainer>
  );
}