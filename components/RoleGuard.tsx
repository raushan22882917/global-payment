'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import OrganizationSidebar from './OrganizationSidebar';

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallbackMessage?: string;
  showSidebar?: boolean;
}

export default function RoleGuard({ 
  allowedRoles, 
  children, 
  fallbackMessage,
  showSidebar = true 
}: RoleGuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    const AccessDeniedContent = () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-orange-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600 mb-4">
            {fallbackMessage || 'You do not have permission to access this page.'}
          </p>
          <p className="text-sm text-gray-500">
            Current role: <span className="font-medium">{user?.role?.replace('ORG_', '') || 'None'}</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Required roles: <span className="font-medium">{allowedRoles.map(role => role.replace('ORG_', '')).join(', ')}</span>
          </p>
        </div>
      </div>
    );

    if (showSidebar) {
      return (
        <div className="min-h-screen bg-gray-50">
          <OrganizationSidebar />
          <div className="lg:pl-72">
            <AccessDeniedContent />
          </div>
        </div>
      );
    }

    return <AccessDeniedContent />;
  }

  return <>{children}</>;
}