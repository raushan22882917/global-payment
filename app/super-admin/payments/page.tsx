'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import SuperAdminLayout from '@/components/SuperAdminLayout';
import { 
  CreditCardIcon, 
  BanknotesIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CogIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

interface PaymentProvider {
  id: string;
  name: string;
  type: 'GATEWAY' | 'BANK' | 'UPI' | 'WALLET';
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  organizations: number;
  totalTransactions: number;
  successRate: number;
  lastUpdated: Date;
  config: {
    apiKey?: string;
    webhookUrl?: string;
    supportedCurrencies: string[];
    fees: {
      percentage: number;
      fixed: number;
    };
  };
}

export default function PaymentSystemsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'>('ALL');

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'SUPER_ADMIN' && !user.isSuperAdmin))) {
      router.push('/');
      return;
    }

    if (user) {
      fetchPaymentProviders();
    }
  }, [user, loading, router]);

  const fetchPaymentProviders = async () => {
    try {
      // Mock payment providers data - in real app, fetch from database
      const mockProviders: PaymentProvider[] = [
        {
          id: '1',
          name: 'Razorpay',
          type: 'GATEWAY',
          status: 'ACTIVE',
          organizations: 5,
          totalTransactions: 1250,
          successRate: 98.5,
          lastUpdated: new Date(),
          config: {
            apiKey: 'rzp_test_***',
            webhookUrl: 'https://api.yourapp.com/webhooks/razorpay',
            supportedCurrencies: ['INR', 'USD'],
            fees: { percentage: 2.0, fixed: 0 }
          }
        },
        {
          id: '2',
          name: 'PayPal',
          type: 'GATEWAY',
          status: 'ACTIVE',
          organizations: 3,
          totalTransactions: 850,
          successRate: 97.2,
          lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          config: {
            apiKey: 'paypal_***',
            webhookUrl: 'https://api.yourapp.com/webhooks/paypal',
            supportedCurrencies: ['USD', 'EUR', 'GBP'],
            fees: { percentage: 2.9, fixed: 0.30 }
          }
        },
        {
          id: '3',
          name: 'UPI Gateway',
          type: 'UPI',
          status: 'ACTIVE',
          organizations: 8,
          totalTransactions: 2100,
          successRate: 99.1,
          lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          config: {
            supportedCurrencies: ['INR'],
            fees: { percentage: 0.5, fixed: 0 }
          }
        },
        {
          id: '4',
          name: 'Bank Transfer',
          type: 'BANK',
          status: 'MAINTENANCE',
          organizations: 2,
          totalTransactions: 150,
          successRate: 95.0,
          lastUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          config: {
            supportedCurrencies: ['INR'],
            fees: { percentage: 0, fixed: 5.0 }
          }
        }
      ];
      
      setProviders(mockProviders);
    } catch (error) {
      console.error('Failed to fetch payment providers:', error);
      setProviders([]);
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

  const filteredProviders = providers.filter(provider => {
    if (filter === 'ALL') return true;
    return provider.status === filter;
  });

  const stats = {
    total: providers.length,
    active: providers.filter(p => p.status === 'ACTIVE').length,
    inactive: providers.filter(p => p.status === 'INACTIVE').length,
    maintenance: providers.filter(p => p.status === 'MAINTENANCE').length,
    totalTransactions: providers.reduce((sum, p) => sum + p.totalTransactions, 0),
    avgSuccessRate: providers.length > 0 
      ? Math.round(providers.reduce((sum, p) => sum + p.successRate, 0) / providers.length * 10) / 10
      : 0
  };

  return (
    <SuperAdminLayout 
      title="Payment Systems" 
      subtitle="Manage payment providers and configurations"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Providers</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500">
              <CreditCardIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Providers</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.active}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500">
              <CheckCircleIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Transactions</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalTransactions.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500">
              <BanknotesIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Success Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.avgSuccessRate}%</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-500">
              <ShieldCheckIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* System Health Alert */}
      {stats.maintenance > 0 && (
        <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">System Maintenance</h3>
              <p className="text-sm text-yellow-700 mt-1">
                {stats.maintenance} payment provider{stats.maintenance > 1 ? 's are' : ' is'} currently under maintenance. 
                Some payment methods may be temporarily unavailable.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Providers List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-semibold text-gray-900">Payment Providers</h3>
              <div className="flex items-center space-x-2">
                {(['ALL', 'ACTIVE', 'INACTIVE', 'MAINTENANCE'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      filter === status
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
            
            <button className="btn-primary flex items-center space-x-2">
              <PlusIcon className="w-4 h-4" />
              <span>Add Provider</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          {filteredProviders.length === 0 ? (
            <div className="text-center py-12">
              <CreditCardIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment Providers Found</h3>
              <p className="text-gray-600 mb-6">
                {filter === 'ALL' 
                  ? 'No payment providers have been configured yet.'
                  : `No providers with status "${filter}" found.`
                }
              </p>
              <button className="btn-primary">
                Add First Provider
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredProviders.map((provider) => (
                <div key={provider.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        provider.type === 'GATEWAY' ? 'bg-blue-100' :
                        provider.type === 'UPI' ? 'bg-green-100' :
                        provider.type === 'BANK' ? 'bg-purple-100' :
                        'bg-orange-100'
                      }`}>
                        <CreditCardIcon className={`w-5 h-5 ${
                          provider.type === 'GATEWAY' ? 'text-blue-600' :
                          provider.type === 'UPI' ? 'text-green-600' :
                          provider.type === 'BANK' ? 'text-purple-600' :
                          'text-orange-600'
                        }`} />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{provider.name}</h4>
                        <p className="text-sm text-gray-500">{provider.type} Provider</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        provider.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800'
                          : provider.status === 'MAINTENANCE'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {provider.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Organizations</p>
                      <p className="text-lg font-semibold text-gray-900">{provider.organizations}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Transactions</p>
                      <p className="text-lg font-semibold text-gray-900">{provider.totalTransactions.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Success Rate</p>
                      <p className="text-lg font-semibold text-gray-900">{provider.successRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Fees</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {provider.config.fees.percentage}%
                        {provider.config.fees.fixed > 0 && ` + ₹${provider.config.fees.fixed}`}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Supported Currencies</p>
                    <div className="flex flex-wrap gap-1">
                      {provider.config.supportedCurrencies.map((currency) => (
                        <span key={currency} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {currency}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Updated {provider.lastUpdated.toLocaleDateString()}
                    </p>
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 p-1 rounded">
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900 p-1 rounded">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900 p-1 rounded">
                        <CogIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
}