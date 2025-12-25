'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';

// Mock data for now - in a real app, this would come from the database
interface PaymentRequest {
  id: string;
  title: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  createdAt: Date;
  description?: string;
  category?: string;
}

export default function MyRequestsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ORG_USER')) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockRequests: PaymentRequest[] = [
      {
        id: '1',
        title: 'Office Supplies',
        amount: 2500,
        currency: 'INR',
        status: 'PENDING',
        createdAt: new Date('2024-12-20'),
        description: 'Stationery and office supplies for Q1',
        category: 'Office Expenses'
      },
      {
        id: '2',
        title: 'Travel Reimbursement',
        amount: 8500,
        currency: 'INR',
        status: 'APPROVED',
        createdAt: new Date('2024-12-18'),
        description: 'Business trip to Mumbai',
        category: 'Travel'
      },
      {
        id: '3',
        title: 'Software License',
        amount: 15000,
        currency: 'INR',
        status: 'PAID',
        createdAt: new Date('2024-12-15'),
        description: 'Annual software license renewal',
        category: 'Software'
      }
    ];
    
    setRequests(mockRequests);
    setDataLoading(false);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'APPROVED':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'REJECTED':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'PAID':
        return <CheckCircleIcon className="w-5 h-5 text-blue-500" />;
      default:
        return <DocumentTextIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
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

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your requests...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'ORG_USER') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/org/user-dashboard"
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Payment Requests</h1>
                <p className="text-sm text-gray-600">Track the status of your payment requests</p>
              </div>
            </div>
            
            <Link
              href="/request-payment"
              className="btn-primary"
            >
              <CreditCardIcon className="w-4 h-4 mr-2" />
              New Request
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {requests.filter(r => r.status === 'PENDING').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {requests.filter(r => r.status === 'APPROVED').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Paid</p>
                <p className="text-2xl font-bold text-gray-900">
                  {requests.filter(r => r.status === 'PAID').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <DocumentTextIcon className="w-6 h-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Requests</h2>
          </div>
          
          {requests.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {requests.map((request) => (
                <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {getStatusIcon(request.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900">{request.title}</h3>
                        {request.description && (
                          <p className="text-sm text-gray-600 mt-1">{request.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-sm text-gray-500">
                            {request.createdAt.toLocaleDateString()}
                          </span>
                          {request.category && (
                            <span className="text-sm text-gray-500">
                              {request.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          {request.currency} {request.amount.toLocaleString()}
                        </p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payment requests yet</h3>
              <p className="text-gray-600 mb-6">Create your first payment request to get started</p>
              <Link
                href="/request-payment"
                className="btn-primary"
              >
                <CreditCardIcon className="w-4 h-4 mr-2" />
                Create Payment Request
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}