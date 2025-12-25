'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import OrganizationSidebar from '@/components/OrganizationSidebar';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  BanknotesIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { getPaymentRequest, getWorkflowInstance, updateWorkflowInstance, getUser, getOrganization } from '@/lib/database';
import { visualWorkflowEngine } from '@/lib/visual-workflow-engine';
import toast from 'react-hot-toast';

interface PaymentRequest {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  requestedBy: string;
  requestedAt: Date;
  category: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  currentApprovalLevel: number;
  orgId: string;
  attachments?: string[];
  metadata?: Record<string, any>;
}

interface WorkflowInstance {
  id: string;
  paymentRequestId: string;
  orgId: string;
  currentStep: number;
  totalSteps: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  steps: any[];
  createdAt: Date;
  completedAt?: Date;
  metadata: Record<string, any>;
}

export default function ApprovalReviewPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const requestId = params.id as string;

  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [workflowInstance, setWorkflowInstance] = useState<WorkflowInstance | null>(null);
  const [requester, setRequester] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [comments, setComments] = useState('');
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    if (!loading && (!user || !user.role.startsWith('ORG_'))) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && requestId) {
      fetchData();
    }
  }, [user, requestId]);

  const fetchData = async () => {
    if (!user?.orgId || !requestId) return;
    
    try {
      // Get payment request
      const request = await getPaymentRequest(requestId);
      if (!request) {
        toast.error('Payment request not found');
        router.push('/org/approvals');
        return;
      }

      // Get requester info
      const requesterData = await getUser(request.requestedBy);
      
      // Get organization info
      const orgData = await getOrganization(request.orgId);

      // Mock workflow instance for now (in production, you'd fetch this)
      const mockWorkflow: WorkflowInstance = {
        id: `workflow-${requestId}`,
        paymentRequestId: requestId,
        orgId: request.orgId,
        currentStep: request.currentApprovalLevel,
        totalSteps: 3,
        status: 'PENDING',
        steps: [
          {
            stepNumber: 1,
            stepName: 'Initial Review',
            approverType: 'ROLE',
            approverValue: 'ORG_ADMIN',
            status: request.currentApprovalLevel > 1 ? 'APPROVED' : 'PENDING'
          },
          {
            stepNumber: 2,
            stepName: 'Budget Approval',
            approverType: 'ROLE',
            approverValue: 'ORG_FINANCE',
            status: request.currentApprovalLevel > 2 ? 'APPROVED' : request.currentApprovalLevel === 2 ? 'PENDING' : 'PENDING'
          },
          {
            stepNumber: 3,
            stepName: 'Final Authorization',
            approverType: 'ROLE',
            approverValue: 'ORG_ADMIN',
            status: request.currentApprovalLevel > 3 ? 'APPROVED' : request.currentApprovalLevel === 3 ? 'PENDING' : 'PENDING'
          }
        ],
        createdAt: request.requestedAt,
        metadata: {
          requesterId: request.requestedBy,
          requesterEmail: requesterData?.email || '',
          totalAmount: request.amount,
          currency: request.currency
        }
      };

      setPaymentRequest(request);
      setWorkflowInstance(mockWorkflow);
      setRequester(requesterData);
      setOrganization(orgData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load payment request');
    } finally {
      setDataLoading(false);
    }
  };

  const handleApproval = async (isApproved: boolean) => {
    if (!paymentRequest || !workflowInstance || !user) return;

    setProcessing(true);
    try {
      // For now, use a mock workflow instance ID
      const mockWorkflowInstanceId = `visual-workflow-${paymentRequest.id}`;
      const mockNodeId = `approval-step-${paymentRequest.currentApprovalLevel}`;
      
      // Process the approval through visual workflow engine
      await visualWorkflowEngine.processNodeApproval(
        mockWorkflowInstanceId,
        mockNodeId,
        isApproved,
        user,
        comments
      );

      toast.success(isApproved ? 'Request approved successfully!' : 'Request rejected');
      router.push('/org/approvals');
    } catch (error) {
      console.error('Failed to process approval:', error);
      toast.error('Failed to process approval');
    } finally {
      setProcessing(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'text-green-600';
      case 'REJECTED': return 'text-red-600';
      case 'PENDING': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user || !user.role.startsWith('ORG_') || !paymentRequest) {
    return null;
  }

  const currentStep = workflowInstance?.steps.find(step => step.stepNumber === workflowInstance.currentStep);
  const canApprove = currentStep && (
    (currentStep.approverType === 'ROLE' && user.role === currentStep.approverValue) ||
    (currentStep.approverType === 'USER' && user.id === currentStep.approverValue)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <OrganizationSidebar />
      
      <div className="lg:pl-72">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/org/approvals')}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Payment Request Review</h1>
                  <p className="mt-1 text-sm text-gray-600">
                    Review and approve payment request #{paymentRequest.id.slice(-8)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(paymentRequest.urgency)}`}>
                  {paymentRequest.urgency} Priority
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  Step {workflowInstance?.currentStep} of {workflowInstance?.totalSteps}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Request Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Request Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <p className="text-gray-900 font-medium">{paymentRequest.title}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                  <p className="text-2xl font-bold text-gray-900">
                    {paymentRequest.currency} {paymentRequest.amount.toLocaleString()}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <p className="text-gray-900">{paymentRequest.category}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Requested By</label>
                  <div className="flex items-center space-x-2">
                    <UserIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{requester?.name || 'Unknown'}</span>
                    <span className="text-gray-500">({requester?.email})</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Requested Date</label>
                  <p className="text-gray-900">{paymentRequest.requestedAt.toLocaleDateString()}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <p className={`font-medium ${getStatusColor(paymentRequest.status)}`}>
                    {paymentRequest.status}
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{paymentRequest.description}</p>
              </div>
            </div>

            {/* Approval Workflow Progress */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Approval Progress</h2>
              
              <div className="space-y-4">
                {workflowInstance?.steps.map((step, index) => (
                  <div key={step.stepNumber} className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step.status === 'APPROVED' ? 'bg-green-500 text-white' :
                      step.status === 'PENDING' && step.stepNumber === workflowInstance.currentStep ? 'bg-blue-500 text-white' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {step.status === 'APPROVED' ? (
                        <CheckCircleIcon className="w-4 h-4" />
                      ) : step.status === 'REJECTED' ? (
                        <XCircleIcon className="w-4 h-4" />
                      ) : (
                        <span className="text-xs font-bold">{step.stepNumber}</span>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{step.stepName}</h4>
                      <p className="text-sm text-gray-600">
                        {step.approverType === 'ROLE' ? `Role: ${step.approverValue.replace('ORG_', '')}` : 'Specific User'}
                      </p>
                    </div>
                    
                    <div className={`text-sm font-medium ${getStatusColor(step.status)}`}>
                      {step.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Approval Actions */}
            {canApprove && paymentRequest.status === 'PENDING' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Your Decision</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Comments (Optional)</label>
                    <textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Add any comments about your decision..."
                    />
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setDecision('approve')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                        decision === 'approve' 
                          ? 'border-green-500 bg-green-50 text-green-700' 
                          : 'border-gray-300 text-gray-700 hover:border-green-300'
                      }`}
                    >
                      <CheckCircleIcon className="w-5 h-5" />
                      <span>Approve</span>
                    </button>
                    
                    <button
                      onClick={() => setDecision('reject')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                        decision === 'reject' 
                          ? 'border-red-500 bg-red-50 text-red-700' 
                          : 'border-gray-300 text-gray-700 hover:border-red-300'
                      }`}
                    >
                      <XCircleIcon className="w-5 h-5" />
                      <span>Reject</span>
                    </button>
                  </div>
                  
                  {decision && (
                    <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => setDecision(null)}
                        className="btn-secondary"
                        disabled={processing}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleApproval(decision === 'approve')}
                        disabled={processing}
                        className={`btn-primary ${
                          decision === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        {processing ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Processing...</span>
                          </div>
                        ) : (
                          `Confirm ${decision === 'approve' ? 'Approval' : 'Rejection'}`
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Access Denied */}
            {!canApprove && (
              <div className="bg-orange-50 rounded-xl border border-orange-200 p-6">
                <div className="flex items-center space-x-3">
                  <ExclamationTriangleIcon className="w-6 h-6 text-orange-500" />
                  <div>
                    <h3 className="font-medium text-orange-900">Cannot Approve This Request</h3>
                    <p className="text-sm text-orange-700 mt-1">
                      You don't have permission to approve this step, or the request is not at your approval level.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}