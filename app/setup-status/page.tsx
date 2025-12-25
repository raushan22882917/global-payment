'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

export default function SetupStatusPage() {
  const { user, firebaseUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // If user is properly set up, redirect to appropriate dashboard
      if (user?.active && user.role === 'SUPER_ADMIN') {
        router.push('/super-admin/dashboard');
      } else if (user?.active && user.role?.startsWith('ORG_')) {
        router.push('/org/dashboard');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const getStatusInfo = () => {
    if (!firebaseUser) {
      return {
        title: 'Authentication Required',
        description: 'Please log in to access the system.',
        status: 'error',
        icon: ExclamationTriangleIcon,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    }

    if (!user) {
      return {
        title: 'Account Setup in Progress',
        description: 'Your account is being created. Please wait a moment and refresh the page.',
        status: 'pending',
        icon: ClockIcon,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      };
    }

    if (!user.active) {
      return {
        title: 'Account Pending Activation',
        description: 'Your account has been created but needs to be activated by an administrator.',
        status: 'inactive',
        icon: ClockIcon,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      };
    }

    return {
      title: 'Account Active',
      description: 'Your account is active and ready to use.',
      status: 'active',
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Account Status</h2>
          <p className="mt-2 text-sm text-gray-600">
            Organization Management System
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Status Card */}
          <div className={`rounded-lg border p-6 ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
            <div className="flex items-center">
              <StatusIcon className={`w-8 h-8 ${statusInfo.color} mr-4`} />
              <div>
                <h3 className={`text-lg font-medium ${statusInfo.color}`}>
                  {statusInfo.title}
                </h3>
                <p className="mt-1 text-sm text-gray-700">
                  {statusInfo.description}
                </p>
              </div>
            </div>
          </div>

          {/* User Information */}
          {firebaseUser && (
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Account Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <UserIcon className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">Email:</span>
                  <span className="ml-2 font-medium">{firebaseUser.email}</span>
                </div>
                {user && (
                  <>
                    <div className="flex items-center">
                      <ShieldCheckIcon className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">Role:</span>
                      <span className="ml-2 font-medium">
                        {user.role === 'SUPER_ADMIN' ? 'Super Administrator' : 
                         user.role === 'ORG_ADMIN' ? 'Organization Administrator' :
                         user.role === 'ORG_FINANCE' ? 'Finance Manager' :
                         user.role === 'ORG_MEMBER' ? 'Organization Member' :
                         user.role === 'ORG_AUDITOR' ? 'Auditor' : user.role}
                      </span>
                    </div>
                    {user.orgId && (
                      <div className="flex items-center">
                        <BuildingOfficeIcon className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">Organization:</span>
                        <span className="ml-2 font-medium">{user.orgId}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-3 ${user.active ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                      <span className="text-gray-600">Status:</span>
                      <span className="ml-2 font-medium">
                        {user.active ? 'Active' : 'Pending Activation'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            {statusInfo.status === 'error' && (
              <Link
                href="/"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Go to Login
              </Link>
            )}

            {statusInfo.status === 'inactive' && (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Your account has been created but needs administrator approval.
                  Please contact your organization administrator or the super admin.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Refresh Status
                </button>
              </div>
            )}

            {statusInfo.status === 'pending' && (
              <button
                onClick={() => window.location.reload()}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Refresh Page
              </button>
            )}

            {statusInfo.status === 'active' && (
              <div className="space-y-2">
                {user?.role === 'SUPER_ADMIN' && (
                  <Link
                    href="/super-admin/dashboard"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Go to Super Admin Dashboard
                  </Link>
                )}
                {user?.role?.startsWith('ORG_') && (
                  <Link
                    href="/org/dashboard"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Go to Organization Dashboard
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Help Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Need help?{' '}
                <Link
                  href="/request-organization"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Request Organization Setup
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}