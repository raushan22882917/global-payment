import { getOrganization } from './database';
import { User } from '@/types';

/**
 * Validates if a user has a valid organization
 */
export const validateUserOrganization = async (user: User | null): Promise<{
  isValid: boolean;
  organization: any | null;
  error?: string;
}> => {
  if (!user) {
    return {
      isValid: false,
      organization: null,
      error: 'User not authenticated'
    };
  }

  if (!user.orgId || user.orgId === 'public') {
    return {
      isValid: false,
      organization: null,
      error: 'User is not part of an organization'
    };
  }

  try {
    const organization = await getOrganization(user.orgId);
    
    if (!organization) {
      return {
        isValid: false,
        organization: null,
        error: 'Organization not found'
      };
    }

    return {
      isValid: true,
      organization,
      error: undefined
    };
  } catch (error) {
    console.error('Error validating organization:', error);
    return {
      isValid: false,
      organization: null,
      error: 'Failed to validate organization'
    };
  }
};

/**
 * Checks if a user can access organization features
 */
export const canAccessOrganizationFeatures = (user: User | null): boolean => {
  return !!(
    user && 
    user.role && 
    user.role.startsWith('ORG_') && 
    user.orgId && 
    user.orgId !== 'public'
  );
};

/**
 * Gets user-friendly error messages for organization issues
 */
export const getOrganizationErrorMessage = (error: string): string => {
  switch (error) {
    case 'User not authenticated':
      return 'Please log in to access this feature.';
    case 'User is not part of an organization':
      return 'You must be part of an organization to access this feature. Use the regular payment request form instead.';
    case 'Organization not found':
      return 'Your organization could not be found. Please contact your administrator.';
    case 'Failed to validate organization':
      return 'Unable to verify your organization. Please try again or contact support.';
    default:
      return 'An error occurred while accessing organization features.';
  }
};

/**
 * Redirects user to appropriate page based on organization status
 */
export const getRedirectPath = (user: User | null, hasOrganization: boolean): string => {
  if (!user) {
    return '/';
  }

  if (!hasOrganization || !canAccessOrganizationFeatures(user)) {
    return '/request-payment';
  }

  return '/org/dashboard';
};