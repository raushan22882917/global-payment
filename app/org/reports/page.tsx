'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import OrganizationSidebar from '@/components/OrganizationSidebar';
import RoleGuard from '@/components/RoleGuard';
import {
  ChartBarIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  FunnelIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

interface ReportData {
  totalPayments: number;
  approvedPayments: number;
  pendingPayments: number;
  rejectedPayments: number;
  totalAmount: number;
  averageAmount: number;
  monthlyTrend: { month: string; amount: number; count: number }[];
  categoryBreakdown: { category: string; amount: number; count: number }[];
  approvalTimes: { average: number; median: number };
}

export default function ReportsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [dateRange, setDateRange] = useState('last-30-days');
  const [reportType, setReportType] = useState('overview');
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || !user.role.startsWith('ORG_'))) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockReportData: ReportData = {
      totalPayments: 45,
      approvedPayments: 32,
      pendingPayments: 8,
      rejectedPayments: 5,
      totalAmount: 125000,
      averageAmount: 2778,
      monthlyTrend: [
        { month: 'Oct', amount: 35000, count: 12 },
        { month: 'Nov', amount: 42000, count: 15 },
        { month: 'Dec', amount: 48000, count: 18 }
      ],
      categoryBreakdown: [
        { category: 'Office Supplies', amount: 25000, count: 15 },
        { category: 'Software', amount: 35000, count: 8 },
        { category: 'Marketing', amount: 40000, count: 12 },
        { category: 'Travel', amount: 15000, count: 6 },
        { category: 'Other', amount: 10000, count: 4 }
      ],
      approvalTimes: { average: 2.5, median: 2.0 }
    };
    
    setReportData(mockReportData);
    setDataLoading(false);
  }, [dateRange, reportType]);

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user || !user.role.startsWith('ORG_')) {
    return null;
  }

  const canViewReports = user.role === 'ORG_ADMIN' || user.role === 'ORG_FINANCE';

  if (!canViewReports) {
    return (
      <div className="min-h-screen bg-gray-50">
        <OrganizationSidebar />
        <div className="lg:pl-72">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
              <p className="text-gray-600">
                You need Admin or Finance role to view reports.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const approvalRate = reportData ? (reportData.approvedPayments / reportData.totalPayments * 100) : 0;
  const pendingRate = reportData ? (reportData.pendingPayments / reportData.totalPayments * 100) : 0;

  return (
    <RoleGuard 
      allowedRoles={['ORG_ADMIN', 'ORG_FINANCE', 'ORG_AUDITOR']}
      fallbackMessage="You need Organization Admin, Finance, or Auditor role to view reports."
    >
      <div className="min-h-screen bg-gray-50">
        <OrganizationSidebar />
        
        <div className="lg:pl-72">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Track payment trends and organizational insights
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <button className="btn-secondary flex items-center space-x-2">
                  <DocumentArrowDownIcon className="w-4 h-4" />
                  <span>Export Report</span>
                </button>
                <button className="btn-primary flex items-center space-x-2">
                  <CalendarIcon className="w-4 h-4" />
                  <span>Schedule Report</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <h3 className="text-lg font-semibold text-gray-900">Report Filters</h3>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="overview">Overview Report</option>
                  <option value="payments">Payment Analysis</option>
                  <option value="approvals">Approval Metrics</option>
                  <option value="team">Team Performance</option>
                </select>

                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="last-7-days">Last 7 Days</option>
                  <option value="last-30-days">Last 30 Days</option>
                  <option value="last-90-days">Last 90 Days</option>
                  <option value="this-year">This Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
            </div>
          </div>

          {reportData && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Payments</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{reportData.totalPayments}</p>
                      <div className="flex items-center mt-2">
                        <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-600">+12% from last month</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500">
                      <BanknotesIcon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Amount</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">${reportData.totalAmount.toLocaleString()}</p>
                      <div className="flex items-center mt-2">
                        <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-600">+8% from last month</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-green-500">
                      <ChartBarIcon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Approval Rate</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{approvalRate.toFixed(1)}%</p>
                      <div className="flex items-center mt-2">
                        <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-600">+3% from last month</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-green-500">
                      <CheckCircleIcon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg. Approval Time</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{reportData.approvalTimes.average}d</p>
                      <div className="flex items-center mt-2">
                        <ArrowTrendingDownIcon className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-600">-0.5d from last month</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-orange-500">
                      <ClockIcon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts and Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Monthly Trend */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Payment Trend</h3>
                  <div className="space-y-4">
                    {reportData.monthlyTrend.map((month, index) => (
                      <div key={month.month} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 text-sm font-medium text-gray-600">{month.month}</div>
                          <div className="flex-1">
                            <div className="bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${(month.amount / 50000) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">${month.amount.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">{month.count} payments</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Category Breakdown */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Categories</h3>
                  <div className="space-y-4">
                    {reportData.categoryBreakdown.map((category, index) => {
                      const percentage = (category.amount / reportData.totalAmount) * 100;
                      const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500'];
                      return (
                        <div key={category.category} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
                            <span className="text-sm font-medium text-gray-900">{category.category}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">${category.amount.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">{percentage.toFixed(1)}% • {category.count} payments</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Payment Status Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        <span className="text-sm font-medium text-gray-900">Approved</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{reportData.approvedPayments}</div>
                        <div className="text-xs text-gray-500">{approvalRate.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <ClockIcon className="w-5 h-5 text-orange-500" />
                        <span className="text-sm font-medium text-gray-900">Pending</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{reportData.pendingPayments}</div>
                        <div className="text-xs text-gray-500">{pendingRate.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-5 h-5 rounded-full bg-red-500"></div>
                        <span className="text-sm font-medium text-gray-900">Rejected</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{reportData.rejectedPayments}</div>
                        <div className="text-xs text-gray-500">{((reportData.rejectedPayments / reportData.totalPayments) * 100).toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <p className="text-gray-600">Approval rate increased by 3% this month</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <p className="text-gray-600">Marketing expenses are trending upward</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      <p className="text-gray-600">Average approval time decreased by 0.5 days</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <p className="text-gray-600">Software category shows highest per-request value</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button className="w-full text-left px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                      <div className="font-medium">Export Full Report</div>
                      <div className="text-sm text-blue-600">Download detailed analytics</div>
                    </button>
                    <button className="w-full text-left px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                      <div className="font-medium">Schedule Monthly Report</div>
                      <div className="text-sm text-green-600">Automated email delivery</div>
                    </button>
                    <button className="w-full text-left px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
                      <div className="font-medium">Custom Report Builder</div>
                      <div className="text-sm text-purple-600">Create custom analytics</div>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
        </div>
      </div>
    </RoleGuard>
  );
}