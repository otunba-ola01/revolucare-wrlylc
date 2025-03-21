"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageContainer } from '../../../components/layout/page-container';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import useAuth from '../../../hooks/use-auth';
import { UserRole } from '../../../types/user';
import { get } from '../../../lib/api/client';

/**
 * Profile page component that displays user profile information based on their role
 * Shows different information depending on whether the user is a client, provider, 
 * case manager, or administrator
 */
const ProfilePage = () => {
  // Get authenticated user data
  const auth = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  /**
   * Fetches the user's profile data from the API
   */
  const fetchProfileData = async () => {
    if (!auth.isAuthenticated) return;
    
    try {
      setLoading(true);
      const userData = await get('/api/users/profile');
      
      // Create a complete profile object based on the user role
      let profileData;
      switch (auth.user?.role) {
        case UserRole.CLIENT:
          profileData = userData.clientProfile;
          break;
        case UserRole.PROVIDER:
          profileData = userData.providerProfile;
          break;
        case UserRole.CASE_MANAGER:
          profileData = userData.caseManagerProfile;
          break;
        case UserRole.ADMINISTRATOR:
          profileData = userData.adminProfile;
          break;
        default:
          profileData = {};
      }
      
      setProfile(profileData);
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch profile data on component mount
  useEffect(() => {
    fetchProfileData();
  }, [auth.isAuthenticated, auth.user?.role]);

  // If not authenticated, redirect to login
  if (!auth.isAuthenticated && !auth.isLoading) {
    router.push('/login');
    return null;
  }

  // Show loading skeleton
  if (loading || auth.isLoading) {
    return renderProfileSkeleton();
  }

  // Render actual profile once data is loaded
  return (
    <PageContainer>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-gray-500">
          View and manage your personal information and settings.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your basic information and contact details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic information always shown for all users */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Name</h3>
                <p className="mt-1 text-sm text-gray-900">{auth.user?.firstName} {auth.user?.lastName}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Email</h3>
                <p className="mt-1 text-sm text-gray-900">{auth.user?.email}</p>
              </div>
              {profile?.phone && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                  <p className="mt-1 text-sm text-gray-900">{profile.phone}</p>
                </div>
              )}
            </div>

            {/* Role-specific information */}
            {renderRoleSpecificInfo({ user: auth.user, profile })}
          </CardContent>
          <CardFooter className="flex justify-end">
            <Link href="/profile/edit">
              <Button variant="outline">Edit Profile</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Details about your Revolucare account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Role</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {auth.user?.role.charAt(0).toUpperCase() + auth.user?.role.slice(1).replace('_', ' ')}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Account Created</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(auth.user?.createdAt || '').toLocaleDateString()}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Email Verification</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {auth.user?.isVerified ? (
                    <span className="text-green-600">Verified</span>
                  ) : (
                    <span className="text-red-600">Not Verified</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

/**
 * Renders different profile information based on user role
 */
const renderRoleSpecificInfo = ({ user, profile }: { user: any, profile: any }) => {
  if (!user || !profile) return null;

  switch (user.role) {
    case UserRole.CLIENT:
      return (
        <div className="border-t border-gray-200 mt-4 pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Client Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.dateOfBirth && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Date of Birth</h4>
                <p className="mt-1 text-sm text-gray-900">{new Date(profile.dateOfBirth).toLocaleDateString()}</p>
              </div>
            )}
            {profile.gender && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Gender</h4>
                <p className="mt-1 text-sm text-gray-900">{profile.gender}</p>
              </div>
            )}
            {profile.address && (
              <div className="col-span-2">
                <h4 className="text-sm font-medium text-gray-500">Address</h4>
                <p className="mt-1 text-sm text-gray-900">
                  {profile.address.street}, {profile.address.city}, {profile.address.state} {profile.address.zipCode}
                </p>
              </div>
            )}
            {profile.emergencyContact && (
              <div className="col-span-2">
                <h4 className="text-sm font-medium text-gray-500">Emergency Contact</h4>
                <p className="mt-1 text-sm text-gray-900">
                  {profile.emergencyContact.name} ({profile.emergencyContact.relationship}) - {profile.emergencyContact.phone}
                </p>
              </div>
            )}
            {profile.medicalInformation && (
              <div className="col-span-2">
                <h4 className="text-sm font-medium text-gray-500">Medical Information</h4>
                <div className="mt-1 space-y-2 text-sm text-gray-900">
                  {profile.medicalInformation.conditions?.length > 0 && (
                    <div>
                      <span className="font-medium">Conditions:</span> {profile.medicalInformation.conditions.join(', ')}
                    </div>
                  )}
                  {profile.medicalInformation.allergies?.length > 0 && (
                    <div>
                      <span className="font-medium">Allergies:</span> {profile.medicalInformation.allergies.join(', ')}
                    </div>
                  )}
                  {profile.medicalInformation.medications?.length > 0 && (
                    <div>
                      <span className="font-medium">Medications:</span> {profile.medicalInformation.medications.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    
    case UserRole.PROVIDER:
      return (
        <div className="border-t border-gray-200 mt-4 pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Provider Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.organizationName && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Organization</h4>
                <p className="mt-1 text-sm text-gray-900">{profile.organizationName}</p>
              </div>
            )}
            {profile.licenseNumber && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">License Number</h4>
                <p className="mt-1 text-sm text-gray-900">{profile.licenseNumber}</p>
              </div>
            )}
            {profile.licenseExpiration && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">License Expiration</h4>
                <p className="mt-1 text-sm text-gray-900">{new Date(profile.licenseExpiration).toLocaleDateString()}</p>
              </div>
            )}
            {profile.serviceTypes && profile.serviceTypes.length > 0 && (
              <div className="col-span-2">
                <h4 className="text-sm font-medium text-gray-500">Services Offered</h4>
                <div className="mt-1 flex flex-wrap gap-1">
                  {profile.serviceTypes.map((service: string) => (
                    <span key={service} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {service.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {profile.specializations && profile.specializations.length > 0 && (
              <div className="col-span-2">
                <h4 className="text-sm font-medium text-gray-500">Specializations</h4>
                <div className="mt-1 flex flex-wrap gap-1">
                  {profile.specializations.map((specialization: string) => (
                    <span key={specialization} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {specialization}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {profile.insuranceAccepted && profile.insuranceAccepted.length > 0 && (
              <div className="col-span-2">
                <h4 className="text-sm font-medium text-gray-500">Insurance Accepted</h4>
                <p className="mt-1 text-sm text-gray-900">
                  {profile.insuranceAccepted.join(', ')}
                </p>
              </div>
            )}
            {profile.bio && (
              <div className="col-span-2">
                <h4 className="text-sm font-medium text-gray-500">Biography</h4>
                <p className="mt-1 text-sm text-gray-900">{profile.bio}</p>
              </div>
            )}
          </div>
        </div>
      );
    
    case UserRole.CASE_MANAGER:
      return (
        <div className="border-t border-gray-200 mt-4 pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Case Manager Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.certification && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Certification</h4>
                <p className="mt-1 text-sm text-gray-900">{profile.certification}</p>
              </div>
            )}
            {profile.specialty && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Specialty</h4>
                <p className="mt-1 text-sm text-gray-900">{profile.specialty}</p>
              </div>
            )}
            {profile.bio && (
              <div className="col-span-2">
                <h4 className="text-sm font-medium text-gray-500">Bio</h4>
                <p className="mt-1 text-sm text-gray-900">{profile.bio}</p>
              </div>
            )}
            {profile.assignedClients && profile.assignedClients.length > 0 && (
              <div className="col-span-2">
                <h4 className="text-sm font-medium text-gray-500">Client Count</h4>
                <p className="mt-1 text-sm text-gray-900">
                  Managing {profile.assignedClients.length} client{profile.assignedClients.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    
    case UserRole.ADMINISTRATOR:
      return (
        <div className="border-t border-gray-200 mt-4 pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Administrator Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.department && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Department</h4>
                <p className="mt-1 text-sm text-gray-900">{profile.department}</p>
              </div>
            )}
            {profile.permissions && profile.permissions.length > 0 && (
              <div className="col-span-2">
                <h4 className="text-sm font-medium text-gray-500">Permissions</h4>
                <div className="mt-1 flex flex-wrap gap-1">
                  {profile.permissions.map((permission: string) => (
                    <span key={permission} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {permission}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    
    default:
      return null;
  }
};

/**
 * Renders a loading skeleton for the profile page
 */
const renderProfileSkeleton = () => {
  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded-md animate-pulse"></div>
        <div className="h-4 w-96 bg-gray-200 rounded-md animate-pulse"></div>

        <div className="border rounded-lg p-6 space-y-4">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="h-4 w-72 bg-gray-200 rounded-md animate-pulse"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <div className="h-4 w-16 bg-gray-200 rounded-md animate-pulse"></div>
              <div className="h-4 w-32 bg-gray-200 rounded-md animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-16 bg-gray-200 rounded-md animate-pulse"></div>
              <div className="h-4 w-48 bg-gray-200 rounded-md animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-16 bg-gray-200 rounded-md animate-pulse"></div>
              <div className="h-4 w-24 bg-gray-200 rounded-md animate-pulse"></div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="space-y-2">
              <div className="h-5 w-48 bg-gray-200 rounded-md animate-pulse"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded-md animate-pulse"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded-md animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded-md animate-pulse"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded-md animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="h-9 w-24 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
        </div>

        <div className="border rounded-lg p-6 space-y-4">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="h-4 w-72 bg-gray-200 rounded-md animate-pulse"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-4 w-16 bg-gray-200 rounded-md animate-pulse"></div>
              <div className="h-4 w-32 bg-gray-200 rounded-md animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-16 bg-gray-200 rounded-md animate-pulse"></div>
              <div className="h-4 w-48 bg-gray-200 rounded-md animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default ProfilePage;