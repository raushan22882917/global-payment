'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import SuperAdminLayout from '@/components/SuperAdminLayout';
import { getOrganizationRequests, updateOrganizationRequest, createOrganization, createUser } from '@/lib/database';
import { OrganizationRequest } from '@/types';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  UserIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function SuperAdminRequests() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<OrganizationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== 'SUPER_ADMIN' && !user.isSuperAdmin))) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && (user.role === 'SUPER_ADMIN' || user.isSuperAdmin)) {
      loadRequests();
    }
  }, [user]);

  const loadRequests = async () => {
    try {
      const requestsData = await getOrganizationRequests();
      setRequests(requestsData);
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: OrganizationRequest) => {
    if (!user) return;
    
    setProcessingId(request.id);
    try {
      // Clean the organization data to remove undefined values
      const cleanOrgData = {
        name: request.organizationName,
        businessType: request.businessType,
        country: request.country,
        currency: 'USD', // Default, can be updated later
        timezone: 'UTC', // Default, can be updated later
        createdBy: user.id,
        status: 'DRAFT' as const,
        contactEmail: request.contactEmail,
        // Only include contactPhone if it exists and is not undefined
        ...(request.contactPhone && { contactPhone: request.contactPhone })
      };

      // Create organization
      const orgId = await createOrganization(cleanOrgData);

      if (orgId) {
        // Generate a unique ID for the admin user
        const adminUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await createUser(adminUserId, {
          email: request.contactEmail,
          name: request.contactName || request.organizationName,
          role: 'ORG_ADMIN',
          orgId: orgId,
          active: true,
          createdBy: user.id
        });

        // Update request status
        await updateOrganizationRequest(request.id, {
          status: 'APPROVED',
          processedBy: user.id,
          processedAt: new Date()
        });

        toast.success(`Organization approved! Admin account created for ${request.contactEmail}`);
        loadRequests();
      }
    } catch (error: any) {
      console.error('Error approving request:', error);
      
      // Provide specific error messages
      if (error.message?.includes('Unsupported field value: undefined')) {
        toast.error('Data validation error. Please check all required fields.');
      } else if (error.code === 'permission-denied') {
        toast.error('Permission denied. Please check your admin privileges.');
      } else {
        toast.error('Failed to approve request. Please try again.');
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request: OrganizationRequest) => {
    if (!user) return;
    
    setProcessingId(request.id);
    try {
      await updateOrganizationRequest(request.id, {
        status: 'REJECTED',
        processedBy: user.id,
        processedAt: new Date()
      });

      toast.success('Request rejected successfully');
      loadRequests();
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    } finally {
      setProcessingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user || (user.role !== 'SUPER_ADMIN' && !user.isSuperAdmin)) {
    return null;
  }

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const processedRequests = requests.filter(r => r.status !== 'PENDING');

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BuildingOfficeIcon className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Organization Requests</h1>
                <p className="text-gray-600">Review and process organization setup requests</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Review</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingRequests.length}</p>
                <p className="text-sm text-gray-500 mt-1">Awaiting approval</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <ClockIcon className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Approved</p>
                <p className="text-3xl font-bold text-green-600">
                  {requests.filter(r => r.status === 'APPROVED').length}
                </p>
                <p className="text-sm text-gray-500 mt-1">Organizations created</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Rejected</p>
                <p className="text-3xl font-bold text-red-600">
                  {requests.filter(r => r.status === 'REJECTED').length}
                </p>
                <p className="text-sm text-gray-500 mt-1">Declined requests</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircleIcon className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Pending Requests Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Pending Requests
              </h2>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                {pendingRequests.length} pending
              </span>
            </div>
          </div>
          
          <div className="p-6">
            {pendingRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <ClockIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
                <p className="text-gray-500">All organization requests have been processed.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="border border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Header */}
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="p-2 bg-yellow-100 rounded-lg">
                            <BuildingOfficeIcon className="w-6 h-6 text-yellow-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">
                              {request.organizationName}
                            </h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <ClockIcon className="w-3 h-3 mr-1" />
                                Pending Review
                              </span>
                              <span className="text-sm text-gray-500">
                                {new Date(request.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                            <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-700">Contact Email</p>
                              <p className="text-sm text-gray-900">{request.contactEmail}</p>
                            </div>
                          </div>
                          
                          {request.contactPhone && (
                            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                              <PhoneIcon className="w-5 h-5 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-700">Phone</p>
                                <p className="text-sm text-gray-900">{request.contactPhone}</p>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                            <UserIcon className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-700">Business Type</p>
                              <p className="text-sm text-gray-900">{request.businessType}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                            <GlobeAltIcon className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-700">Country</p>
                              <p className="text-sm text-gray-900">{request.country}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Message */}
                        {request.message && (
                          <div className="mb-4">
                            <div className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-gray-200">
                              <ChatBubbleLeftRightIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-700 mb-1">Message</p>
                                <p className="text-sm text-gray-900 leading-relaxed">
                                  {request.message}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Timestamp */}
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <CalendarIcon className="w-4 h-4" />
                          <span>
                            Submitted on {new Date(request.createdAt).toLocaleDateString()} at{' '}
                            {new Date(request.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-col space-y-3 ml-6">
                        <button
                          onClick={() => handleApprove(request)}
                          disabled={processingId === request.id}
                          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center space-x-2"
                        >
                          {processingId === request.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Processing...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircleIcon className="w-5 h-5" />
                              <span>Approve</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleReject(request)}
                          disabled={processingId === request.id}
                          className="px-6 py-3 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center space-x-2"
                        >
                          <XCircleIcon className="w-5 h-5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Processed Requests Section */}
        {processedRequests.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Processed Requests
                </h2>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  {processedRequests.length} processed
                </span>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-3">
                {processedRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${
                        request.status === 'APPROVED' 
                          ? 'bg-green-100' 
                          : 'bg-red-100'
                      }`}>
                        {request.status === 'APPROVED' ? (
                          <CheckCircleIcon className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircleIcon className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{request.organizationName}</p>
                        <p className="text-sm text-gray-600">{request.contactEmail}</p>
                        <p className="text-xs text-gray-500">
                          Processed on {request.processedAt && new Date(request.processedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        request.status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {request.status === 'APPROVED' ? 'Approved' : 'Rejected'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State for No Requests */}
        {requests.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <BuildingOfficeIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No organization requests</h3>
              <p className="text-gray-500 mb-4">
                When users submit organization setup requests, they will appear here for review.
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <ExclamationTriangleIcon className="w-4 h-4" />
                <span>Requests are submitted through the public organization request form</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}