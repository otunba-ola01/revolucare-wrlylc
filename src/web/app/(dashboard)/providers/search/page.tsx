import React, { useState, useEffect, useCallback } from "react"; // react ^18.2.0
import { useRouter, useSearchParams } from "next/navigation"; // next/navigation ^13.4.1
import { Metadata } from "next"; // next ^13.4.1
import { ProviderFilter } from "../../../components/providers/provider-filter";
import MatchingResults from "../../../components/providers/matching-results";
import { PageContainer } from "../../../components/layout/page-container";
import { Breadcrumbs } from "../../../components/layout/breadcrumbs";
import useAuth from "../../../hooks/use-auth";
import {
  ProviderSearchCriteria,
  ProviderMatchingCriteria,
} from "../../../types/provider";
import { SERVICE_TYPES } from "../../../config/constants";

/**
 * Breadcrumb items for the provider search page
 */
const breadcrumbItems = [
  { label: "Dashboard", href: "/" },
  { label: "Providers", href: "/providers" },
  { label: "Search", href: "/providers/search" },
];

/**
 * Initial search criteria for the provider search page
 */
const initialSearchCriteria: ProviderSearchCriteria = {
  serviceTypes: [],
  location: null,
  distance: 25,
  zipCode: null,
  availability: null,
  insurance: null,
  minRating: null,
  specializations: null,
  page: 1,
  limit: 10,
  sortBy: "compatibilityScore",
  sortOrder: "desc",
};

/**
 * Generates metadata for the provider search page
 * @returns Page metadata object
 */
export const generateMetadata = (): Metadata => {
  return {
    title: "Find Care Providers | Revolucare",
    description: "Search for qualified care providers based on your needs and preferences.",
    keywords: ["care providers", "search", "matching", "healthcare"],
    openGraph: {
      title: "Find Care Providers | Revolucare",
      description: "Search for qualified care providers based on your needs and preferences.",
      url: "/providers/search",
      siteName: "Revolucare",
    },
  };
};

/**
 * A page component that implements the provider search and matching functionality
 * @returns Rendered provider search page
 */
const ProviderSearchPage: React.FC = () => {
  // LD1: Initialize router for navigation
  const router = useRouter();

  // LD1: Get search parameters from URL using useSearchParams
  const searchParams = useSearchParams();

  // LD1: Get authenticated user information using useAuth hook
  const { user } = useAuth();

  // LD1: Initialize state for search criteria using useState
  const [searchCriteria, setSearchCriteria] = useState<ProviderSearchCriteria>(initialSearchCriteria);

  // LD1: Initialize state for matching criteria using useState
  const [matchingCriteria, setMatchingCriteria] = useState<ProviderMatchingCriteria | null>(null);

  // LD1: Parse URL search parameters to initialize search criteria on page load
  useEffect(() => {
    // Function to parse search parameters from URL
    const parseSearchParams = () => {
      const params: Partial<ProviderSearchCriteria> = {};

      // Parse service types
      const serviceTypesParam = searchParams.getAll("serviceType");
      if (serviceTypesParam && serviceTypesParam.length > 0) {
        params.serviceTypes = serviceTypesParam.filter(st => Object.values(SERVICE_TYPES).includes(st)) as any;
      }

      // Parse location and distance
      const zipCode = searchParams.get("zipCode");
      const distance = searchParams.get("distance");

      if (zipCode) {
        params.zipCode = zipCode;
        params.distance = distance ? parseInt(distance) : 25;
      }

      // Update state with parsed parameters
      setSearchCriteria((prev) => ({ ...prev, ...params }));
    };

    parseSearchParams();
  }, [searchParams]);

  // LD1: Create effect to update URL when search criteria changes
  useEffect(() => {
    const params = new URLSearchParams();

    if (searchCriteria.serviceTypes && searchCriteria.serviceTypes.length > 0) {
      searchCriteria.serviceTypes.forEach((st) => params.append("serviceType", st));
    }

    if (searchCriteria.zipCode) {
      params.set("zipCode", searchCriteria.zipCode);
      if (searchCriteria.distance) {
        params.set("distance", searchCriteria.distance.toString());
      }
    }

    router.push(`/providers/search?${params.toString()}`, { scroll: false });
  }, [searchCriteria, router]);

  // LD1: Create callback function to handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<ProviderSearchCriteria>) => {
    setSearchCriteria((prev) => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  // LD1: Create callback function to handle provider profile view
  const handleViewProfile = useCallback((providerId: string) => {
    router.push(`/providers/${providerId}`);
  }, [router]);

  // LD1: Create callback function to handle provider scheduling
  const handleSchedule = useCallback((providerId: string) => {
    router.push(`/providers/${providerId}/schedule`);
  }, [router]);

  // LD1: Transform search criteria to matching criteria by adding client ID and preferences
  useEffect(() => {
    if (user) {
      setMatchingCriteria({
        clientId: user.id,
        serviceTypes: searchCriteria.serviceTypes,
        location: searchCriteria.location,
        distance: searchCriteria.distance,
        availability: searchCriteria.availability,
        insurance: searchCriteria.insurance,
        genderPreference: null, // Add user preferences here
        languagePreference: null, // Add user preferences here
        experienceLevel: null, // Add user preferences here
        additionalPreferences: {}, // Add user preferences here
      });
    }
  }, [user, searchCriteria]);

  return (
    <PageContainer>
      {/* LD1: Render Breadcrumbs for navigation context */}
      <Breadcrumbs items={breadcrumbItems} />

      {/* LD1: Render page heading with descriptive title */}
      <h1 className="text-2xl font-bold mb-4">Find Care Providers</h1>
      <p className="text-gray-500 mb-6">
        Search for qualified care providers based on your needs and preferences.
      </p>

      {matchingCriteria && (
        <MatchingResults
          criteria={matchingCriteria}
          onViewProfile={handleViewProfile}
          onSchedule={handleSchedule}
        />
      )}
    </PageContainer>
  );
};

export default ProviderSearchPage;