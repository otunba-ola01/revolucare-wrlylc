import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { Home } from "lucide-react";

import { PageContainer } from "../../components/layout/page-container";
import { Button } from "../../components/ui/button";
import { ErrorMessage } from "../../components/common/error-message";
import { siteConfig } from "../../config/site";

/**
 * Defines metadata for the not-found page
 */
export const metadata: Metadata = {
  title: `Page Not Found | ${siteConfig.name}`,
  description: "We couldn't find the page you were looking for.",
};

/**
 * Next.js not-found page component that handles 404 errors
 * when users navigate to routes that don't exist
 */
export default function NotFound() {
  return (
    <PageContainer className="flex flex-col items-center justify-center min-h-[70vh] text-center py-12">
      <div className="space-y-6 max-w-lg mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          404: Page Not Found
        </h1>
        
        <ErrorMessage 
          error="We couldn't find the page you were looking for. The page might have been moved, deleted, or never existed."
          className="mx-auto max-w-md text-lg"
        />
        
        <div className="mt-8">
          <Button asChild size="lg">
            <Link href="/" aria-label="Return to home page">
              <Home className="mr-2 h-5 w-5" aria-hidden="true" />
              Return to Home
            </Link>
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}