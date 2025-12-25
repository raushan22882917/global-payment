'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import OrganizationSidebar from '@/components/OrganizationSidebar';
import {
  CreditCardIcon,
  BanknotesIcon,
  ChartBarIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { getOrganization } from '@/lib/database';
import { Organization } from '@/types';
import toast from 'react-hot-toast';

interface FinancialTransaction {
  id: string;
  type: 'PAYMENT_IN' | 'PAYMENT_OUT' | 'REFUND' | 'FEE';
  amount: number;
  currency: string;
  description: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  date: string;
  reference: string;
  category: string;
}

interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  pendingPayments: number;
  completedTransactions: number;
  monthlyGrowth: number;
}

export default function OrganizationFinancesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30'); // days
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0,
    pendingPayments: 0,
    completedTransactions: 0,
    monthlyGrowth: 0
  });

  useEffect(() => {
    if (!loading && (!user || !user.role.startsWith('ORG_'))) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.orgId) {
      fetchFinancialData();
    }
  }, [user, selectedPeriod, selectedCategory]);

  const fetchFinancialData = async () => {
    if (!user?.orgId) return;
    
    try {
      const orgData = await getOrganization(user.orgId);
      setOrganization(orgData);
      
      // TODO: Implement actual financial data fetching
      // For now, using mock data
      const mockTransactions: FinancialTransaction[] = [
        {
          id: '1',
          type: 'PAYMENT_IN',
          amount: 50000,
          currency: 'INR',
          description: 'Client Payment - Project Alpha',
          status: 'COMPLETED',
          date: '2024-12-20',
          reference: 'PAY-001',
          category: 'Revenue'
        },
        {
          id: '2',
          type: 'PAYMENT_OUT',
          amount: 15000,
          currency: 'INR',
          description: 'Office Supplies',
          status: 'COMPLETED',
          date: '2024-12-18',
          reference: 'EXP-001',
          category: 'Operations'
        },
        {
          id: '3',
          type: 'PAYMENT_OUT',
          amount: 25000,
          currency: 'INR',
          description: 'Employee Salary - December',
          status: 'PENDING',
          date: '2024-12-25',
          reference: 'SAL-001',
          category: 'Payroll'
        }
      ];

      const mockSummary: FinancialSummary = {
        totalIncome: 50000,
        totalExpenses: 40000,
        netBalance: 10000,
        pendingPayments: 25000,
        completedTransactions: 2,
        monthlyGrowth: 12.5
      };

      setTransactions(mockTransactions);
      setSummary(mockSummary);
      
    } catch (error) {
      console.error('Failed to fetch financial data:', error);
      toast.error('Failed to load financial data');
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

  if (!user || !user.role.startsWith('ORG_')) {
    return null;
  }

  // Check if user has access to finances
  const canViewFinances = ['ORG_ADMIN', 'ORG_FINANCE'].includes(user.role);

  if (!canViewFinances) {
    return (
      <div className="min-h-screen bg-gray-50">
        <OrganizationSidebar />
        <div className="lg:pl-72">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <CreditCardIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
              <p className="text-gray-600 mb-4">
                You need Admin or Finance role to view financial data.
              </p>
              <p className="text-sm text-gray-500">
                Current role: <span className="font-medium">{user.role.replace('ORG_', '')}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'PAYMENT_IN':
        return <ArrowTrendingUpIcon className="w-5 h-5 text-green-600" />;
      case 'PAYMENT_OUT':
        return <ArrowTrendingDownIcon className="w-5 h-5 text-red-600" />;
      case 'REFUND':
        return <BanknotesIcon className="w-5 h-5 text-blue-600" />;
      default:
        return <CreditCardIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <OrganizationSidebar />
      
      <div className="lg:pl-72">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Financial Overview</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Track income, expenses, and financial performance
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => toast.success('Export feature coming soon!')}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <DocumentArrowDownIcon className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Financial Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Income</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {formatCurrency(summary.totalIncome)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-100">
                  <ArrowTrendingUpIcon className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600 mt-2">
                    {formatCurrency(summary.totalExpenses)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-red-100">
                  <ArrowTrendingDownIcon className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Net Balance</p>
                  <p className={`text-2xl font-bold mt-2 ${
                    summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(summary.netBalance)}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${
                  summary.netBalance >= 0 ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <BanknotesIcon className={`w-6 h-6 ${
                    summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-2">
                    {formatCurrency(summary.pendingPayments)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-yellow-100">
                  <CreditCardIcon className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Controls */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                    <select
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      className="text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="7">Last 7 days</option>
                      <option value="30">Last 30 days</option>
                      <option value="90">Last 3 months</option>
                      <option value="365">Last year</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <FunnelIcon className="w-4 h-4 text-gray-400" />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Categories</option>
                      <option value="Revenue">Revenue</option>
                      <option value="Operations">Operations</option>
                      <option value="Payroll">Payroll</option>
                      <option value="Marketing">Marketing</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Transactions List */}
            <div className="p-6">
              {transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 rounded-lg bg-white border border-gray-200">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{transaction.description}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <p className="text-sm text-gray-500">
                              {transaction.reference} • {transaction.category}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(transaction.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className={`font-semibold ${
                            transaction.type === 'PAYMENT_IN' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'PAYMENT_IN' ? '+' : '-'}
                            {formatCurrency(transaction.amount, transaction.currency)}
                          </p>
                          <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => toast.success('Transaction details coming soon!')}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Found</h3>
                  <p className="text-gray-600">
                    No financial transactions found for the selected period and filters.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Financial Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Monthly Trend */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Performance</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Growth Rate</span>
                  <div className="flex items-center space-x-2">
                    <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-green-600">
                      +{summary.monthlyGrowth}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completed Transactions</span>
                  <span className="text-sm font-medium text-gray-900">
                    {summary.completedTransactions}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Average Transaction</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(summary.totalIncome / Math.max(summary.completedTransactions, 1))}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/org/payments/new')}
                  className="w-full text-left px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <div className="font-medium">Create Payment Request</div>
                  <div className="text-sm text-blue-600">Submit a new payment for approval</div>
                </button>
                
                <button
                  onClick={() => router.push('/org/payments/release')}
                  className="w-full text-left px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <div className="font-medium">Release Payments</div>
                  <div className="text-sm text-green-600">Process approved payments</div>
                </button>
                
                <button
                  onClick={() => toast.success('Financial reports coming soon!')}
                  className="w-full text-left px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <div className="font-medium">Generate Report</div>
                  <div className="text-sm text-purple-600">Create detailed financial report</div>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}