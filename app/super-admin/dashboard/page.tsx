'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import SuperAdminLayout from '@/components/SuperAdminLayout';
import { 
  BuildingOfficeIcon, 
  UsersIcon, 
  DocumentTextIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { getOrganizationRequests, getOrganizationsByCreator } from '@/lib/database';
import { getAutoReplyStatus } from '@/lib/auto-reply';
import Link from 'next/link';

export default function SuperAdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<{
    totalOrganizations: number;
    pendingRequests: number;
    activeUsers: number;
    recentActivity: Array<{
      id: string;
      type: string;
      description: string;
      time: Date;
      status: 'PENDING' | 'APPROVED' | 'REJECTED';
    }>;
  }>({
    totalOrganizations: 0,
    pendingRequests: 0,
    activeUsers: 0,
    recentActivity: []
  });
  const [autoReplyStatus, setAutoReplyStatus] = useState(getAutoReplyStatus());

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'SUPER_ADMIN' && !user.isSuperAdmin))) {
      router.push('/');
      return;
    }

    if (user) {
      fetchDashboardData();
    }
  }, [user, loading, router]);

  const fetchDashboardData = async () => {
    try {
      // Fetch organization requests
      const requests = await getOrganizationRequests();
      const pendingRequests = requests.filter(req => req.status === 'PENDING').length;
      const approvedRequests = requests.filter(req => req.status === 'APPROVED').length;
      
      // Calculate real stats from actual data
      setStats({
        totalOrganizations: approvedRequests, // Only count approved organizations
        pendingRequests,
        activeUsers: 0, // Will be calculated from actual user data
        recentActivity: requests.slice(0, 5).map(req => ({
          id: req.id,
          type: 'Organization Request',
          description: `${req.organizationName} requested setup`,
          time: req.createdAt,
          status: req.status
        }))
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Set empty state on error
      setStats({
        totalOrganizations: 0,
        pendingRequests: 0,
        activeUsers: 0,
        recentActivity: []
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user || (user.role !== 'SUPER_ADMIN' && !user.isSuperAdmin)) {
    return null;
  }

  const statCards = [
    {
      name: 'Total Organizations',
      value: stats.totalOrganizations,
      icon: BuildingOfficeIcon,
      color: 'bg-blue-500',
      href: '/super-admin/organizations'
    },
    {
      name: 'Pending Requests',
      value: stats.pendingRequests,
      icon: DocumentTextIcon,
      color: 'bg-orange-500',
      href: '/super-admin/requests'
    },
    {
      name: 'Active Users',
      value: stats.activeUsers,
      icon: UsersIcon,
      color: 'bg-green-500',
      href: '/super-admin/users'
    },
    {
      name: 'System Health',
      value: stats.totalOrganizations > 0 ? '100%' : 'Setup',
      icon: ChartBarIcon,
      color: 'bg-purple-500',
      href: '/super-admin/analytics'
    }
  ];

  return (
    <SuperAdminLayout 
      title="Dashboard" 
      subtitle="Welcome back! Here's what's happening with your organizations."
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <p className="text-sm text-gray-600">Latest organization requests and system events</p>
            </div>
            <div className="p-6">
              {stats.recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentActivity.map((activity, index) => (
                    <div key={activity.id || index} className="flex items-start space-x-4">
                      <div className={`p-2 rounded-lg ${
                        activity.status === 'PENDING' ? 'bg-orange-100' :
                        activity.status === 'APPROVED' ? 'bg-green-100' :
                        'bg-gray-100'
                      }`}>
                        {activity.status === 'PENDING' ? (
                          <ClockIcon className="w-4 h-4 text-orange-600" />
                        ) : activity.status === 'APPROVED' ? (
                          <CheckCircleIcon className="w-4 h-4 text-green-600" />
                        ) : (
                          <ExclamationTriangleIcon className="w-4 h-4 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.type}</p>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.time ? new Date(activity.time).toLocaleString() : 'Just now'}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        activity.status === 'PENDING' ? 'bg-orange-100 text-orange-800' :
                        activity.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {activity.status}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          {/* Auto-Reply Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Auto-Reply System</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-600">Active</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Response Time</span>
                <span className="text-sm font-medium text-gray-900">~{autoReplyStatus.delayMinutes} minutes</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Success Rate</span>
                <span className="text-sm font-medium text-gray-900">{autoReplyStatus.successRate}%</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                {autoReplyStatus.enabled 
                  ? '✅ Auto-replies are being sent to new organization requests'
                  : '⚠️ Auto-reply system is currently disabled'
                }
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                href="/super-admin/requests"
                className="block w-full text-left px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="font-medium">Review Requests</div>
                <div className="text-sm text-blue-600">
                  {stats.pendingRequests} pending
                </div>
              </Link>
              
              <Link
                href="/super-admin/organizations"
                className="block w-full text-left px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
              >
                <div className="font-medium">Manage Organizations</div>
                <div className="text-sm text-green-600">
                  {stats.totalOrganizations} active
                </div>
              </Link>
              
              <Link
                href="/super-admin/analytics"
                className="block w-full text-left px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <div className="font-medium">View Analytics</div>
                <div className="text-sm text-purple-600">
                  System insights
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}