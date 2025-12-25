'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import OrganizationSidebar from '@/components/OrganizationSidebar';
import {
  PlayIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  UserIcon,
  EnvelopeIcon,
  BanknotesIcon,
  ArrowLeftIcon,
  CogIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { getPaymentRequest, getUser, getOrganization } from '@/lib/database';
import toast from 'react-hot-toast';

interface WorkflowNode {
  id: string;
  type: 'start' | 'approval' | 'condition' | 'email' | 'payment' | 'end';
  position: { x: number; y: number };
  data: {
    label: string;
    approverType?: 'ROLE' | 'USER';
    approverValue?: string;
    stepOrder?: number;
  };
}

interface NodeState {
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
  approvedBy?: string;
  comments?: string;
}

export default function WorkflowStatusPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const requestId = params.id as string;

  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [requester, setRequester] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Mock workflow data - in production, this would come from database
  const [workflowNodes] = useState<WorkflowNode[]>([
    {
      id: 'start-node',
      type: 'start',
      position: { x: 100, y: 200 },
      data: { label: 'Payment Request Submitted' }
    },
    {
      id: 'approval-1',
      type: 'approval',
      position: { x: 300, y: 200 },
      data: { 
        label: 'Initial Review',
        approverType: 'ROLE',
        approverValue: 'ORG_ADMIN',
        stepOrder: 1
      }
    },
    {
      id: 'approval-2',
      type: 'approval',
      position: { x: 500, y: 200 },
      data: { 
        label: 'Budget Approval',
        approverType: 'ROLE',
        approverValue: 'ORG_FINANCE',
        stepOrder: 2
      }
    },
    {
      id: 'payment-node',
      type: 'payment',
      position: { x: 700, y: 200 },
      data: { label: 'Process Payment' }
    },
    {
      id: 'end-node',
      type: 'end',
      position: { x: 900, y: 200 },
      data: { label: 'Payment Completed' }
    }
  ]);

  const [nodeStates, setNodeStates] = useState<Record<string, NodeState>>({
    'start-node': { status: 'COMPLETED', completedAt: new Date() },
    'approval-1': { status: 'COMPLETED', completedAt: new Date(), approvedBy: 'admin-user' },
    'approval-2': { status: 'RUNNING', startedAt: new Date() },
    'payment-node': { status: 'PENDING' },
    'end-node': { status: 'PENDING' }
  });

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

      setPaymentRequest(request);
      setRequester(requesterData);
      setOrganization(orgData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load payment request');
    } finally {
      setDataLoading(false);
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'start': return PlayIcon;
      case 'approval': return CheckCircleIcon;
      case 'condition': return CogIcon;
      case 'email': return EnvelopeIcon;
      case 'payment': return BanknotesIcon;
      case 'end': return CheckCircleIcon;
      default: return CogIcon;
    }
  };

  const getNodeColor = (type: string, status: string) => {
    if (status === 'COMPLETED') return 'bg-green-500';
    if (status === 'RUNNING') return 'bg-blue-500';
    if (status === 'FAILED') return 'bg-red-500';
    
    switch (type) {
      case 'start': return 'bg-green-500';
      case 'approval': return 'bg-blue-500';
      case 'condition': return 'bg-purple-500';
      case 'email': return 'bg-yellow-500';
      case 'payment': return 'bg-orange-500';
      case 'end': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return CheckCircleIcon;
      case 'RUNNING': return ClockIcon;
      case 'FAILED': return XCircleIcon;
      case 'PENDING': return ClockIcon;
      default: return ClockIcon;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600';
      case 'RUNNING': return 'text-blue-600';
      case 'FAILED': return 'text-red-600';
      case 'PENDING': return 'text-gray-600';
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

  const currentRunningNode = workflowNodes.find(node => nodeStates[node.id]?.status === 'RUNNING');

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
                  <h1 className="text-2xl font-bold text-gray-900">Workflow Status</h1>
                  <p className="mt-1 text-sm text-gray-600">
                    Real-time workflow execution for payment request #{paymentRequest.id.slice(-8)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {currentRunningNode && (
                  <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    <div className="animate-pulse w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>Running: {currentRunningNode.data.label}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Request Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Title</p>
                  <p className="font-medium text-gray-900">{paymentRequest.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="font-medium text-gray-900">
                    {paymentRequest.currency} {paymentRequest.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Requested By</p>
                  <p className="font-medium text-gray-900">{requester?.name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-medium text-gray-900">{paymentRequest.status}</p>
                </div>
              </div>
            </div>

            {/* Visual Workflow Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Workflow Progress</h2>
              
              <div className="relative bg-gray-50 rounded-lg p-8 overflow-x-auto" style={{ minHeight: '400px' }}>
                {/* Grid Background */}
                <div 
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                      linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px'
                  }}
                />

                {/* Workflow Connections */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {workflowNodes.slice(0, -1).map((node, index) => {
                    const nextNode = workflowNodes[index + 1];
                    if (!nextNode) return null;

                    const sourceX = node.position.x + 120; // Node width
                    const sourceY = node.position.y + 40; // Half node height
                    const targetX = nextNode.position.x;
                    const targetY = nextNode.position.y + 40;

                    const midX = (sourceX + targetX) / 2;

                    const sourceState = nodeStates[node.id];
                    const isActive = sourceState?.status === 'COMPLETED';

                    return (
                      <path
                        key={`${node.id}-${nextNode.id}`}
                        d={`M ${sourceX} ${sourceY} C ${midX} ${sourceY}, ${midX} ${targetY}, ${targetX} ${targetY}`}
                        stroke={isActive ? "#10b981" : "#d1d5db"}
                        strokeWidth="3"
                        fill="none"
                        className={isActive ? "animate-pulse" : ""}
                      />
                    );
                  })}
                </svg>

                {/* Workflow Nodes */}
                {workflowNodes.map(node => {
                  const NodeIcon = getNodeIcon(node.type);
                  const nodeState = nodeStates[node.id];
                  const StatusIcon = getStatusIcon(nodeState?.status || 'PENDING');

                  return (
                    <div
                      key={node.id}
                      className="absolute bg-white rounded-lg shadow-lg border-2 border-gray-200"
                      style={{
                        left: node.position.x,
                        top: node.position.y,
                        width: '240px',
                        minHeight: '80px'
                      }}
                    >
                      {/* Node Header */}
                      <div className={`flex items-center justify-between p-3 rounded-t-lg ${getNodeColor(node.type, nodeState?.status || 'PENDING')}`}>
                        <div className="flex items-center space-x-2 text-white">
                          <NodeIcon className="w-5 h-5" />
                          <span className="font-medium text-sm">{node.data.label}</span>
                        </div>
                        
                        <StatusIcon className="w-5 h-5 text-white" />
                      </div>

                      {/* Node Content */}
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm font-medium ${getStatusColor(nodeState?.status || 'PENDING')}`}>
                            {nodeState?.status || 'PENDING'}
                          </span>
                          {nodeState?.status === 'RUNNING' && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                          )}
                        </div>
                        
                        {node.type === 'approval' && (
                          <div className="text-xs text-gray-600 space-y-1">
                            <div>Type: {node.data.approverType === 'USER' ? 'Specific User' : 'Role-Based'}</div>
                            <div>Approver: {node.data.approverValue?.replace('ORG_', '') || 'Not set'}</div>
                            {nodeState?.approvedBy && (
                              <div className="text-green-600 font-medium">
                                ✓ Approved by user
                              </div>
                            )}
                          </div>
                        )}
                        
                        {nodeState?.startedAt && (
                          <div className="text-xs text-gray-500 mt-2">
                            Started: {nodeState.startedAt.toLocaleTimeString()}
                          </div>
                        )}
                        
                        {nodeState?.completedAt && (
                          <div className="text-xs text-gray-500 mt-1">
                            Completed: {nodeState.completedAt.toLocaleTimeString()}
                          </div>
                        )}
                        
                        {nodeState?.comments && (
                          <div className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                            "{nodeState.comments}"
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Execution Log */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Execution Log</h2>
              
              <div className="space-y-3">
                {workflowNodes.map(node => {
                  const nodeState = nodeStates[node.id];
                  if (!nodeState || nodeState.status === 'PENDING') return null;

                  const StatusIcon = getStatusIcon(nodeState.status);
                  
                  return (
                    <div key={node.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <StatusIcon className={`w-5 h-5 mt-0.5 ${getStatusColor(nodeState.status)}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{node.data.label}</h4>
                          <span className="text-sm text-gray-500">
                            {nodeState.completedAt?.toLocaleString() || nodeState.startedAt?.toLocaleString()}
                          </span>
                        </div>
                        <p className={`text-sm ${getStatusColor(nodeState.status)}`}>
                          {nodeState.status === 'COMPLETED' ? 'Completed successfully' :
                           nodeState.status === 'RUNNING' ? 'Currently running...' :
                           nodeState.status === 'FAILED' ? 'Failed to execute' : 'Pending execution'}
                        </p>
                        {nodeState.comments && (
                          <p className="text-sm text-gray-600 mt-1">
                            Comment: "{nodeState.comments}"
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            {currentRunningNode && currentRunningNode.type === 'approval' && (
              <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                <div className="flex items-center space-x-3">
                  <ClockIcon className="w-6 h-6 text-blue-500" />
                  <div>
                    <h3 className="font-medium text-blue-900">Waiting for Approval</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      The workflow is currently waiting for approval at the "{currentRunningNode.data.label}" step.
                    </p>
                    <button
                      onClick={() => router.push(`/org/approvals/review/${paymentRequest.id}`)}
                      className="mt-3 btn-primary text-sm"
                    >
                      Review & Approve
                    </button>
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