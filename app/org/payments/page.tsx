'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import OrganizationSidebar from '@/components/OrganizationSidebar';
import {
  CreditCardIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import { getPaymentRequestsByOrg } from '@/lib/database';
import Link from 'next/link';

interface PaymentRequest {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  requestedBy: string;
  requestedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  category: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
}

export default function PaymentRequestsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID'>('ALL');
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || !user.role.startsWith('ORG_'))) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.orgId) {
      fetchPaymentRequests();
    }
  }, [user]);

  const fetchPaymentRequests = async () => {
    if (!user?.orgId) return;
    
    try {
      const requests = await getPaymentRequestsByOrg(user.orgId);
      setPaymentRequests(requests || []);
    } catch (error) {
      console.error('Failed to fetch payment requests:', error);
      setPaymentRequests([]);
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

  const filteredRequests = paymentRequests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.requestedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: paymentRequests.length,
    pending: paymentRequests.filter(r => r.status === 'PENDING').length,
    approved: paymentRequests.filter(r => r.status === 'APPROVED').length,
    paid: paymentRequests.filter(r => r.status === 'PAID').length,
    totalAmount: paymentRequests.reduce((sum, r) => sum + r.amount, 0)
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <ClockIcon className="w-4 h-4 text-orange-500" />;
      case 'APPROVED':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'REJECTED':
        return <XCircleIcon className="w-4 h-4 text-red-500" />;
      case 'PAID':
        return <BanknotesIcon className="w-4 h-4 text-blue-500" />;
      default:
        return <ClockIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-orange-100 text-orange-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'PAID':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
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
                <h1 className="text-2xl font-bold text-gray-900">Payment Requests</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Manage and track all payment requests
                </p>
              </div>
              
              <Link
                href="/org/payments/new"
                className="btn-primary flex items-center space-x-2"
              >
                <PlusIcon className="w-4 h-4" />
                <span>New Request</span>
              </Link>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Requests</p>
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
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pending}</p>
                </div>
                <div className="p-3 rounded-lg bg-orange-500">
                  <ClockIcon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.approved}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-500">
                  <CheckCircleIcon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Paid</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.paid}</p>
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
                  <p className="text-3xl font-bold text-gray-900 mt-2">${stats.totalAmount.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-500">
                  <BanknotesIcon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <h3 className="text-lg font-semibold text-gray-900">All Payment Requests</h3>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  {/* Search */}
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search requests..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="ALL">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="PAID">Paid</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCardIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment Requests Found</h3>
                  <p className="text-gray-600 mb-6">
                    {searchTerm || statusFilter !== 'ALL'
                      ? 'No requests match your current filters.'
                      : 'No payment requests have been created yet.'
                    }
                  </p>
                  {!searchTerm && statusFilter === 'ALL' && (
                    <Link
                      href="/org/payments/new"
                      className="btn-primary"
                    >
                      Create First Request
                    </Link>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Request
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Urgency
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Requested By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredRequests.map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {request.title}
                              </div>
                              <div className="text-sm text-gray-500 max-w-xs truncate">
                                {request.description}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {request.category}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              ${request.amount.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {request.currency}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(request.status)}
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                                {request.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUrgencyColor(request.urgency)}`}>
                              {request.urgency}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {request.requestedBy}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {request.requestedAt.toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <Link
                                href={`/org/payments/${request.id}`}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                title="View Details"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </Link>
                              {request.status === 'PENDING' && (
                                <Link
                                  href={`/org/approvals/status/${request.id}`}
                                  className="text-green-600 hover:text-green-900 p-1 rounded"
                                  title="View Workflow Status"
                                >
                                  <ClockIcon className="w-4 h-4" />
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}