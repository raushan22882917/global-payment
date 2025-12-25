'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { 
  DocumentTextIcon, 
  CreditCardIcon,
  UserIcon,
  BuildingOfficeIcon,
  ArrowRightStartOnRectangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function SimpleOrgUserDashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('Simple Dashboard - Auth state:', { 
      loading, 
      user: user ? { email: user.email, role: user.role, orgId: user.orgId } : null
    });
    
    if (!loading && (!user || user.role !== 'ORG_USER')) {
      console.log('Simple Dashboard - Redirecting due to auth/role issue');
      router.push('/');
    }
  }, [user, loading, router]);

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
        </div>
      </div>
    );
  }

  // If auth is done but no user or wrong role, redirect
  if (!user || user.role !== 'ORG_USER') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      name: 'Request Payment',
      description: 'Create a new payment request',
      href: '/request-payment',
      icon: CreditCardIcon,
      color: 'bg-blue-500'
    },
    {
      name: 'View My Requests',
      description: 'Check status of your requests',
      href: '/org/my-requests',
      icon: DocumentTextIcon,
      color: 'bg-green-500'
    },
    {
      name: 'Organization Info',
      description: 'View organization details',
      href: '/org/info',
      icon: BuildingOfficeIcon,
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                <BuildingOfficeIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome, {user.name || 'User'}
                </h1>
                <p className="text-sm text-gray-600">
                  Organization User Dashboard
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
                  <p className="text-sm font-medium text-gray-900">{user.name || 'User'}</p>
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
        {/* Welcome Banner */}
        <div className="mb-8 p-6 rounded-xl border bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">
                Welcome to Your Dashboard!
              </h3>
              <p className="text-sm text-blue-700">
                You can create payment requests and track their status. All features are available to you.
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Member since</p>
              <p className="text-lg font-semibold text-gray-900">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                href={action.href}
                className="block p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-200"
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${action.color}`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{action.name}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
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
                <span className="text-sm font-medium text-gray-900">{user.name || 'Not set'}</span>
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Organization ID</span>
                <span className="text-sm font-medium text-gray-900">{user.orgId || 'Not assigned'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">User ID</span>
                <span className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded text-xs">
                  {user.id}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Created</span>
                <span className="text-sm font-medium text-gray-900">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}
                </span>
              </div>
              <div className="text-center py-4">
                <Link
                  href="/org/info"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View Full Organization Details →
                </Link>
              </div>
            </div>
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