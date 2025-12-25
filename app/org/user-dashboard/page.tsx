'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  DocumentTextIcon, 
  CreditCardIcon,
  ClockIcon,
  CheckCircleIcon,
  UserIcon,
  BuildingOfficeIcon,
  BanknotesIcon,
  ArrowRightStartOnRectangleIcon
} from '@heroicons/react/24/outline';
import { getOrganization } from '@/lib/database';
import { Organization } from '@/types';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function OrgUserDashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Debug logging
  useEffect(() => {
    console.log('ORG_USER Dashboard - Auth state:', { 
      loading, 
      user: user ? { email: user.email, role: user.role, orgId: user.orgId } : null,
      dataLoading 
    });
  }, [loading, user, dataLoading]);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ORG_USER')) {
      console.log('ORG_USER Dashboard - Redirecting due to auth/role issue');
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Set a maximum timeout for data loading
    const maxTimeout = setTimeout(() => {
      if (dataLoading) {
        console.log('Max timeout reached, forcing dataLoading to false');
        setDataLoading(false);
      }
    }, 5000);

    if (user) {
      fetchOrganizationData();
    } else if (!loading) {
      setDataLoading(false);
    }

    return () => clearTimeout(maxTimeout);
  }, [user, loading]);

  const fetchOrganizationData = async () => {
    if (!user?.orgId) {
      console.log('No orgId found for user, skipping organization fetch');
      setOrganization(null);
      setDataLoading(false);
      return;
    }
    
    try {
      console.log('Fetching organization data for orgId:', user.orgId);
      const orgData = await getOrganization(user.orgId);
      console.log('Organization data fetched:', orgData);
      setOrganization(orgData);
    } catch (error) {
      console.error('Failed to fetch organization data:', error);
      setOrganization(null);
    } finally {
      console.log('Setting dataLoading to false');
      setDataLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Logout failed');
    }
  };

  // Show loading only while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
          <p className="text-xs text-gray-500 mt-2">Authenticating...</p>
        </div>
      </div>
    );
  }

  // If auth is done but no user or wrong role, redirect
  if (!user || user.role !== 'ORG_USER') {
    console.log('Redirecting: no user or wrong role', { user: user?.email, role: user?.role });
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Show a loading indicator for organization data if still loading
  const showOrgDataLoading = dataLoading;

  const quickActions = [
    {
      name: 'Request Payment',
      description: 'Create a new payment request',
      href: '/request-payment',
      icon: CreditCardIcon,
      color: 'bg-blue-500',
      available: !organization || organization.status === 'ACTIVE'
    },
    {
      name: 'View My Requests',
      description: 'Check status of your requests',
      href: '/org/my-requests',
      icon: DocumentTextIcon,
      color: 'bg-green-500',
      available: true
    },
    {
      name: 'Organization Info',
      description: 'View organization details',
      href: '/org/info',
      icon: BuildingOfficeIcon,
      color: 'bg-purple-500',
      available: true
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              {organization?.logoUrl ? (
                <img
                  src={organization.logoUrl}
                  alt={organization.name}
                  className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <BuildingOfficeIcon className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome, {user.name}
                </h1>
                <p className="text-sm text-gray-600">
                  {organization?.name || 'Organization'} • User Dashboard
                </p>
              </div>
            </div>
            
            {/* User menu */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md border border-gray-300 hover:border-gray-400 transition-colors flex items-center space-x-2"
              >
                <ArrowRightStartOnRectangleIcon className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Organization Status Banner */}
        <div className={`mb-8 p-6 rounded-xl border ${
          organization?.status === 'ACTIVE' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          {showOrgDataLoading ? (
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600"></div>
              <div>
                <h3 className="text-lg font-semibold text-yellow-900">Loading Organization Status...</h3>
                <p className="text-sm text-yellow-700">Please wait while we fetch your organization information.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-semibold ${
                  organization?.status === 'ACTIVE' ? 'text-green-900' : 'text-yellow-900'
                }`}>
                  Organization Status: {organization?.status || 'Not Available'}
                </h3>
                <p className={`text-sm ${
                  organization?.status === 'ACTIVE' ? 'text-green-700' : 'text-yellow-700'
                }`}>
                  {organization?.status === 'ACTIVE' 
                    ? 'You can create payment requests and access all features'
                    : organization
                    ? 'Some features may be limited until setup is complete'
                    : 'Organization information is not available at the moment'
                  }
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Member since</p>
                <p className="text-lg font-semibold text-gray-900">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                href={action.href}
                className={`block p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 ${
                  !action.available ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-300'
                }`}
                onClick={(e) => {
                  if (!action.available) {
                    e.preventDefault();
                  }
                }}
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${action.color}`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{action.name}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                    {!action.available && (
                      <p className="text-xs text-yellow-600 mt-1">Available after organization setup</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Information Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Account Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <UserIcon className="w-5 h-5 mr-2 text-gray-500" />
              Your Account
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Name</span>
                <span className="text-sm font-medium text-gray-900">{user.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Email</span>
                <span className="text-sm font-medium text-gray-900">{user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Role</span>
                <span className="text-sm font-medium text-gray-900">Organization User</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Department</span>
                <span className="text-sm font-medium text-gray-900">
                  {user.department || 'Not specified'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-600">Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Organization Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BuildingOfficeIcon className="w-5 h-5 mr-2 text-gray-500" />
              Organization Details
            </h3>
            {showOrgDataLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="ml-3 text-gray-600">Loading organization details...</p>
              </div>
            ) : organization ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Organization</span>
                  <span className="text-sm font-medium text-gray-900">{organization.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Industry</span>
                  <span className="text-sm font-medium text-gray-900">
                    {organization.industry || organization.businessType}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Country</span>
                  <span className="text-sm font-medium text-gray-900">{organization.country}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Currency</span>
                  <span className="text-sm font-medium text-gray-900">{organization.currency}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      organization.status === 'ACTIVE' ? 'bg-green-500' : 'bg-yellow-500'
                    }`}></div>
                    <span className={`text-sm font-medium ${
                      organization.status === 'ACTIVE' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {organization.status}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">Organization information not available</p>
                <button 
                  onClick={() => {
                    setDataLoading(true);
                    fetchOrganizationData();
                  }}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  Try again
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 rounded-xl border border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Need Help?</h3>
          <p className="text-sm text-blue-700 mb-4">
            As an organization user, you can create payment requests and track their status. 
            If you need additional permissions or have questions, contact your organization administrator.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/request-payment"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <CreditCardIcon className="w-4 h-4 mr-2" />
              Create Payment Request
            </Link>
            <button className="inline-flex items-center px-4 py-2 bg-white text-blue-600 text-sm font-medium rounded-lg border border-blue-300 hover:bg-blue-50 transition-colors">
              <DocumentTextIcon className="w-4 h-4 mr-2" />
              View Help Guide
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}