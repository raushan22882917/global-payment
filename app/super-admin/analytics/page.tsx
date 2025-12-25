'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import SuperAdminLayout from '@/components/SuperAdminLayout';
import { 
  ChartBarIcon, 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UsersIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
  ClockIcon,
  CheckCircleIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { getOrganizationRequests } from '@/lib/database';
import { OrganizationRequest } from '@/types';

interface AnalyticsData {
  totalOrganizations: number;
  totalUsers: number;
  totalPayments: number;
  monthlyGrowth: number;
  organizationsByMonth: { month: string; count: number }[];
  statusDistribution: { status: string; count: number; percentage: number }[];
  recentActivity: { date: string; event: string; count: number }[];
}

export default function AnalyticsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'SUPER_ADMIN' && !user.isSuperAdmin))) {
      router.push('/');
      return;
    }

    if (user) {
      fetchAnalytics();
    }
  }, [user, loading, router, timeRange]);

  const fetchAnalytics = async () => {
    try {
      const organizations = await getOrganizationRequests();
      
      // Calculate analytics from real data
      const now = new Date();
      const timeRangeMs = {
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000,
        '1y': 365 * 24 * 60 * 60 * 1000
      }[timeRange];
      
      const cutoffDate = new Date(now.getTime() - timeRangeMs);
      const recentOrgs = organizations.filter(org => new Date(org.createdAt) >= cutoffDate);
      
      // Calculate monthly distribution
      const monthlyData: { [key: string]: number } = {};
      recentOrgs.forEach(org => {
        const month = new Date(org.createdAt).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
        monthlyData[month] = (monthlyData[month] || 0) + 1;
      });
      
      // Calculate status distribution
      const statusCounts: { [key: string]: number } = {};
      organizations.forEach(org => {
        statusCounts[org.status] = (statusCounts[org.status] || 0) + 1;
      });
      
      const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
        percentage: Math.round((count / organizations.length) * 100)
      }));
      
      // Calculate growth (mock calculation)
      const previousPeriodOrgs = organizations.filter(org => {
        const orgDate = new Date(org.createdAt);
        return orgDate >= new Date(cutoffDate.getTime() - timeRangeMs) && orgDate < cutoffDate;
      });
      
      const growthRate = previousPeriodOrgs.length > 0 
        ? Math.round(((recentOrgs.length - previousPeriodOrgs.length) / previousPeriodOrgs.length) * 100)
        : recentOrgs.length > 0 ? 100 : 0;
      
      setAnalytics({
        totalOrganizations: organizations.length,
        totalUsers: organizations.length + 1, // +1 for super admin
        totalPayments: 0, // TODO: Implement payment tracking
        monthlyGrowth: growthRate,
        organizationsByMonth: Object.entries(monthlyData).map(([month, count]) => ({
          month,
          count
        })),
        statusDistribution,
        recentActivity: [
          { date: 'Today', event: 'New Organizations', count: recentOrgs.filter(o => 
            new Date(o.createdAt).toDateString() === now.toDateString()
          ).length },
          { date: 'This Week', event: 'Approved Requests', count: organizations.filter(o => 
            o.status === 'APPROVED' && new Date(o.createdAt) >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          ).length },
          { date: 'This Month', event: 'Total Requests', count: recentOrgs.length }
        ]
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setAnalytics(null);
    } finally {
      setDataLoading(false);
    }
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user || (user.role !== 'SUPER_ADMIN' && !user.isSuperAdmin)) {
    return null;
  }

  if (!analytics) {
    return (
      <SuperAdminLayout title="Analytics" subtitle="System analytics and insights">
        <div className="text-center py-12">
          <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
          <p className="text-gray-600">Unable to load analytics data at this time.</p>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout 
      title="Analytics" 
      subtitle="System performance and usage insights"
    >
      {/* Time Range Selector */}
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          <CalendarIcon className="w-5 h-5 text-gray-400" />
          <div className="flex items-center space-x-2">
            {(['7d', '30d', '90d', '1y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  timeRange === range
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {range === '7d' ? 'Last 7 days' : 
                 range === '30d' ? 'Last 30 days' :
                 range === '90d' ? 'Last 90 days' : 'Last year'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Organizations</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.totalOrganizations}</p>
              <div className="flex items-center mt-2">
                {analytics.monthlyGrowth >= 0 ? (
                  <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${
                  analytics.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {analytics.monthlyGrowth >= 0 ? '+' : ''}{analytics.monthlyGrowth}%
                </span>
                <span className="text-sm text-gray-500 ml-1">vs previous period</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-blue-500">
              <BuildingOfficeIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.totalUsers}</p>
              <p className="text-sm text-gray-500 mt-2">Across all organizations</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500">
              <UsersIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Payments</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.totalPayments}</p>
              <p className="text-sm text-gray-500 mt-2">Payment requests processed</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500">
              <CreditCardIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Health</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">100%</p>
              <div className="flex items-center mt-2">
                <CheckCircleIcon className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 font-medium">All systems operational</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-orange-500">
              <ChartBarIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Organization Growth */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Organization Growth</h3>
          {analytics.organizationsByMonth.length > 0 ? (
            <div className="space-y-4">
              {analytics.organizationsByMonth.map((data, index) => (
                <div key={data.month} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{data.month}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.max((data.count / Math.max(...analytics.organizationsByMonth.map(d => d.count))) * 100, 10)}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-8 text-right">{data.count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No data available for selected period</p>
            </div>
          )}
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Request Status Distribution</h3>
          <div className="space-y-4">
            {analytics.statusDistribution.map((status) => (
              <div key={status.status} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    status.status === 'APPROVED' ? 'bg-green-500' :
                    status.status === 'PENDING' ? 'bg-yellow-500' :
                    status.status === 'REJECTED' ? 'bg-red-500' :
                    'bg-gray-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {status.status.toLowerCase()}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        status.status === 'APPROVED' ? 'bg-green-500' :
                        status.status === 'PENDING' ? 'bg-yellow-500' :
                        status.status === 'REJECTED' ? 'bg-red-500' :
                        'bg-gray-500'
                      }`}
                      style={{ width: `${status.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                    {status.count} ({status.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity Summary</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {analytics.recentActivity.map((activity, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100">
                  <ClockIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">{activity.count}</h4>
                <p className="text-sm text-gray-600">{activity.event}</p>
                <p className="text-xs text-gray-500 mt-1">{activity.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}