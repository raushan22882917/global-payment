'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import OrganizationSidebar from '@/components/OrganizationSidebar';
import { 
  DocumentTextIcon, 
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  CreditCardIcon,
  BanknotesIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { getOrganization, getUsersByOrg, getApprovalLevelsByOrg } from '@/lib/database';
import { dashboardService, DashboardStats, PaymentRequestWithDetails, DashboardActivity } from '@/lib/dashboard-service';
import { Organization, User, ApprovalLevel } from '@/types';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function OrganizationDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [approvalLevels, setApprovalLevels] = useState<ApprovalLevel[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [recentPaymentRequests, setRecentPaymentRequests] = useState<PaymentRequestWithDetails[]>([]);
  const [recentActivity, setRecentActivity] = useState<DashboardActivity[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PaymentRequestWithDetails[]>([]);

  useEffect(() => {
    if (!loading && (!user || (!user.role.startsWith('ORG_') || user.role === 'ORG_USER'))) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.orgId) {
      fetchOrganizationData();
    }
  }, [user]);

  const fetchOrganizationData = async () => {
    if (!user?.orgId) return;
    
    try {
      const [orgData, usersData, levelsData] = await Promise.all([
        getOrganization(user.orgId),
        getUsersByOrg(user.orgId),
        getApprovalLevelsByOrg(user.orgId)
      ]);
      
      setOrganization(orgData);
      setUsers(usersData || []);
      setApprovalLevels(levelsData || []);
      
      // Get real dashboard data
      const [stats, recentRequests, activity, approvals] = await Promise.all([
        dashboardService.getDashboardStats(user.orgId),
        dashboardService.getRecentPaymentRequests(user.orgId, 5),
        dashboardService.getRecentActivity(user.orgId, 10),
        dashboardService.getPendingApprovals(user.orgId, user.id, user.role)
      ]);
      
      setDashboardStats(stats);
      setRecentPaymentRequests(recentRequests);
      setRecentActivity(activity);
      setPendingApprovals(approvals);
      
    } catch (error) {
      console.error('Failed to fetch organization data:', error);
      toast.error('Failed to load dashboard data');
      setOrganization(null);
      setUsers([]);
      setApprovalLevels([]);
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

  if (!user || (!user.role.startsWith('ORG_') || user.role === 'ORG_USER')) {
    return null;
  }

  // Calculate real statistics from dashboard service
  const activeUsers = users.filter(u => u.active).length;
  const totalUsers = users.length;
  const approvalLevelCount = approvalLevels.length;
  
  // Use real dashboard stats
  const stats = dashboardStats || {
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    paidRequests: 0,
    rejectedRequests: 0,
    totalAmount: 0,
    pendingAmount: 0,
    approvedAmount: 0,
    paidAmount: 0,
    averageApprovalTime: 0,
    activeWorkflows: 0
  };
  
  const statCards = [
    {
      name: 'Pending Payments',
      value: stats.pendingRequests.toString(),
      amount: `₹${stats.pendingAmount.toLocaleString()}`,
      icon: ClockIcon,
      color: 'bg-orange-500',
      href: '/org/payments',
      trend: pendingApprovals.length > 0 ? `${pendingApprovals.length} need your approval` : 'No pending approvals',
      trendUp: false
    },
    {
      name: 'Approved Today',
      value: stats.approvedRequests.toString(),
      amount: `₹${stats.approvedAmount.toLocaleString()}`,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      href: '/org/approvals',
      trend: `${stats.averageApprovalTime}h avg time`,
      trendUp: true
    },
    {
      name: 'Total Processed',
      value: stats.paidRequests.toString(),
      amount: `₹${stats.paidAmount.toLocaleString()}`,
      icon: BanknotesIcon,
      color: 'bg-blue-500',
      href: '/org/finances',
      trend: `${stats.totalRequests} total requests`,
      trendUp: true
    },
    {
      name: 'Team Members',
      value: totalUsers.toString(),
      amount: `${activeUsers} active`,
      icon: UsersIcon,
      color: 'bg-purple-500',
      href: '/org/members',
      trend: `${stats.activeWorkflows} active workflows`,
      trendUp: true
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <OrganizationSidebar />
      
      {/* Main content */}
      <div className="lg:pl-72">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {organization?.name || 'Organization'} Dashboard
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Welcome back! Here's your organization overview.
                </p>
              </div>
              
              {/* Quick actions */}
              <div className="flex items-center space-x-3">
                {organization?.status === 'ACTIVE' ? (
                  <>
                    {['ORG_ADMIN', 'ORG_FINANCE', 'ORG_MEMBER'].includes(user.role) && (
                      <Link
                        href="/org/payments/new"
                        className="btn-primary"
                      >
                        New Payment Request
                      </Link>
                    )}
                    {user.role === 'ORG_MEMBER' && (
                      <Link
                        href="/request-payment"
                        className="btn-secondary"
                      >
                        Quick Payment
                      </Link>
                    )}
                  </>
                ) : (
                  <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium">
                    Setup in Progress
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>
        
        {/* Page content */}
        <main className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Organization Status Banner */}
          {organization && (
            <div className={`mb-8 p-6 rounded-xl border ${
              organization.status === 'ACTIVE' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-lg font-semibold ${
                    organization.status === 'ACTIVE' ? 'text-green-900' : 'text-yellow-900'
                  }`}>
                    Organization Status: {organization.status}
                  </h3>
                  <p className={`text-sm ${
                    organization.status === 'ACTIVE' ? 'text-green-700' : 'text-yellow-700'
                  }`}>
                    {organization.status === 'ACTIVE' 
                      ? 'Your organization is fully configured and ready for payments'
                      : 'Complete setup to activate payment processing'
                    }
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(organization.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat) => (
              <Link
                key={stat.name}
                href={stat.href}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.color} group-hover:scale-110 transition-transform`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center space-x-1">
                    {stat.trendUp ? (
                      <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
                    ) : (
                      <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.trend}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.amount}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Payment Requests */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Recent Payment Requests</h3>
                    <p className="text-sm text-gray-600">Latest payment requests requiring attention</p>
                  </div>
                  <Link
                    href="/org/payments/new"
                    className="btn-primary text-sm flex items-center space-x-2"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>New Request</span>
                  </Link>
                </div>
                <div className="p-6">
                  {recentPaymentRequests.length > 0 ? (
                    <div className="space-y-4">
                      {recentPaymentRequests.map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-start space-x-4">
                            <div className={`p-2 rounded-lg ${
                              request.status === 'PENDING' ? 'bg-orange-100' :
                              request.status === 'APPROVED' ? 'bg-green-100' :
                              request.status === 'PAID' ? 'bg-blue-100' : 'bg-gray-100'
                            }`}>
                              {request.status === 'PENDING' ? (
                                <ClockIcon className="w-5 h-5 text-orange-600" />
                              ) : request.status === 'APPROVED' ? (
                                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                              ) : (
                                <BanknotesIcon className="w-5 h-5 text-blue-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900">{request.title}</h4>
                              <p className="text-sm text-gray-600">by {request.requesterName}</p>
                              <div className="flex items-center space-x-4 mt-1">
                                <span className="text-xs text-gray-500">
                                  {new Date(request.requestedAt).toLocaleDateString()}
                                </span>
                                <span className="text-xs text-gray-500">{request.category}</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  request.urgency === 'HIGH' ? 'bg-red-100 text-red-700' :
                                  request.urgency === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {request.urgency}
                                </span>
                              </div>
                              {request.workflowStatus && (
                                <p className="text-xs text-blue-600 mt-1">{request.workflowStatus}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900">
                              {request.currency} {request.amount.toLocaleString()}
                            </p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              request.status === 'PENDING' ? 'bg-orange-100 text-orange-800' :
                              request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                              request.status === 'PAID' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {request.status}
                            </span>
                            {request.estimatedCompletion && request.status === 'PENDING' && (
                              <p className="text-xs text-gray-500 mt-1">
                                Est: {request.estimatedCompletion.toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CreditCardIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">No payment requests yet</p>
                      <Link
                        href="/org/payments/new"
                        className="btn-primary"
                      >
                        Create First Request
                      </Link>
                    </div>
                  )}
                  
                  {recentPaymentRequests.length > 0 && (
                    <div className="mt-4 text-center">
                      <Link
                        href="/org/payments"
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View all payment requests →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Activity & Quick Actions */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  {organization?.status === 'ACTIVE' ? (
                    <>
                      {['ORG_ADMIN', 'ORG_FINANCE', 'ORG_MEMBER'].includes(user.role) && (
                        <Link
                          href="/org/payments/new"
                          className="block w-full text-left px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <PlusIcon className="w-5 h-5" />
                            <div>
                              <div className="font-medium">New Payment Request</div>
                              <div className="text-sm text-blue-600">Submit a new payment</div>
                            </div>
                          </div>
                        </Link>
                      )}
                      
                      {['ORG_ADMIN', 'ORG_FINANCE', 'ORG_APPROVER'].includes(user.role) && (
                        <Link
                          href="/org/approvals"
                          className="block w-full text-left px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <CheckCircleIcon className="w-5 h-5" />
                            <div>
                              <div className="font-medium">Review Approvals</div>
                              <div className="text-sm text-green-600">{pendingApprovals.length} pending</div>
                            </div>
                          </div>
                        </Link>
                      )}

                      {['ORG_ADMIN', 'ORG_FINANCE'].includes(user.role) && (
                        <Link
                          href="/org/finances"
                          className="block w-full text-left px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <ChartBarIcon className="w-5 h-5" />
                            <div>
                              <div className="font-medium">View Finances</div>
                              <div className="text-sm text-purple-600">₹{stats.totalAmount.toLocaleString()} total</div>
                            </div>
                          </div>
                        </Link>
                      )}

                      {user.role === 'ORG_ADMIN' && (
                        <Link
                          href="/org/approvals"
                          className="block w-full text-left px-4 py-3 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <CogIcon className="w-5 h-5" />
                            <div>
                              <div className="font-medium">Workflow Builder</div>
                              <div className="text-sm text-indigo-600">Configure approval flow</div>
                            </div>
                          </div>
                        </Link>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <ExclamationTriangleIcon className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Payment features will be available once your organization is activated
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${
                        activity.status === 'PENDING' ? 'bg-orange-100' :
                        activity.status === 'APPROVED' ? 'bg-green-100' :
                        activity.status === 'PAID' ? 'bg-blue-100' :
                        'bg-gray-100'
                      }`}>
                        {activity.type === 'PAYMENT_REQUEST' ? (
                          <DocumentTextIcon className="w-4 h-4 text-blue-600" />
                        ) : activity.type === 'APPROVAL' ? (
                          <CheckCircleIcon className="w-4 h-4 text-green-600" />
                        ) : activity.type === 'PAYMENT' ? (
                          <BanknotesIcon className="w-4 h-4 text-blue-600" />
                        ) : (
                          <ClockIcon className="w-4 h-4 text-orange-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-500">
                            {activity.timestamp.toLocaleDateString()} - {activity.user.name}
                          </p>
                          {activity.amount && (
                            <p className="text-sm font-medium text-gray-900">
                              {activity.currency} {activity.amount.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <Link
                    href="/org/reports"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View all activity →
                  </Link>
                </div>
              </div>

              {/* Organization Status */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Status</h3>
                <div className="space-y-4">
                  {organization && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Organization</span>
                        <span className="text-sm font-medium text-gray-900">{organization.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Status</span>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            organization.status === 'ACTIVE' ? 'bg-green-500' : 'bg-yellow-500'
                          }`}></div>
                          <span className="text-sm font-medium text-gray-900">{organization.status}</span>
                        </div>
                      </div>
                    </>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Team Members</span>
                    <span className="text-sm font-medium text-gray-900">{activeUsers}/{totalUsers} Active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Approval Workflow</span>
                    <span className="text-sm font-medium text-gray-900">
                      {approvalLevelCount > 0 ? `${approvalLevelCount} Levels` : 'Not Configured'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Monthly Volume</span>
                    <span className="text-sm font-medium text-gray-900">₹{stats.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
                
                {organization?.status === 'ACTIVE' ? (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800 flex items-center">
                      <CheckCircleIcon className="w-4 h-4 mr-2" />
                      Your organization is fully operational
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-800 flex items-center">
                      <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                      Setup in progress - contact your administrator
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}