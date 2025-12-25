'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import OrganizationSidebar from '@/components/OrganizationSidebar';
import VisualWorkflowBuilder from '@/components/VisualWorkflowBuilder';
import RoleGuard from '@/components/RoleGuard';
import AIEmailTemplateBuilder from '@/components/AIEmailTemplateBuilder';
import { templateManager, WorkflowEmailTemplate } from '@/lib/template-manager';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  EnvelopeIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  CogIcon,
  PlayIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { getApprovalLevelsByOrg, getUsersByOrg, saveApprovalWorkflow } from '@/lib/database';
import { ApprovalLevel, User } from '@/types';
import toast from 'react-hot-toast';

export default function ApprovalWorkflowPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [approvalLevels, setApprovalLevels] = useState<ApprovalLevel[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'visual' | 'builder' | 'preview' | 'settings'>('visual');
  const [savedTemplates, setSavedTemplates] = useState<WorkflowEmailTemplate[]>([]);
  const [selectedTemplateType, setSelectedTemplateType] = useState<'approval_request' | 'approval_update' | 'payment_status' | 'reminder'>('approval_request');

  useEffect(() => {
    if (!loading && (!user || !user.role.startsWith('ORG_'))) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.orgId) {
      fetchData();
      loadSavedTemplates();
    }
  }, [user]);

  const loadSavedTemplates = () => {
    if (user?.orgId) {
      const templates = templateManager.getTemplatesByOrg(user.orgId);
      setSavedTemplates(templates);
    }
  };

  const fetchData = async () => {
    if (!user?.orgId) return;
    
    try {
      const [levelsData, usersData] = await Promise.all([
        getApprovalLevelsByOrg(user.orgId),
        getUsersByOrg(user.orgId)
      ]);
      
      setApprovalLevels(levelsData || []);
      setUsers(usersData || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setApprovalLevels([]);
      setUsers([]);
    } finally {
      setDataLoading(false);
    }
  };

  const handleSaveWorkflow = async (workflowData: any) => {
    if (!user?.orgId) {
      toast.error('Organization ID not found');
      return;
    }

    try {
      if (workflowData.nodes) {
        // Visual workflow format - convert to approval levels
        const approvalNodes = workflowData.nodes.filter((n: any) => n.type === 'approval');
        const nodes = approvalNodes.map((node: any, index: number) => ({
          id: node.id,
          levelOrder: index + 1,
          levelName: node.data.label,
          approverType: node.data.approverType,
          approverValue: node.data.approverValue,
          conditions: node.data.conditions || null, // Handle undefined
          emailTemplate: node.data.emailTemplate || '',
          isPaymentTrigger: node.data.isPaymentTrigger || false,
          autoApprove: node.data.autoApprove || false,
          timeoutHours: node.data.timeoutHours || 24
        }));
        
        await saveApprovalWorkflow(user.orgId, nodes);
      } else {
        // Legacy format
        await saveApprovalWorkflow(user.orgId, workflowData);
      }
      
      toast.success('Approval workflow saved successfully!');
      
      // Refresh data
      await fetchData();
    } catch (error) {
      console.error('Failed to save workflow:', error);
      toast.error('Failed to save workflow');
    }
  };

  const handleTemplateGenerated = (template: any) => {
    if (!user?.orgId || !user?.id) return;
    
    // Save template to template manager
    const savedTemplate = templateManager.saveTemplate(
      template,
      user.orgId,
      user.id,
      `${selectedTemplateType.replace('_', ' ').toUpperCase()} Template`,
      selectedTemplateType
    );
    
    // Refresh saved templates
    loadSavedTemplates();
    
    toast.success('Template saved to workflow system!');
  };

  const handleQuickTemplateGenerate = (type: typeof selectedTemplateType) => {
    if (!user?.orgId) return;
    
    const template = templateManager.generateWorkflowTemplate(type, {
      organizationName: user.orgId,
      recipientRole: 'Approver',
      stepName: 'Review',
      stepNumber: 1
    });
    
    handleTemplateGenerated(template);
  };

  const handleSetActiveTemplate = (templateId: string) => {
    templateManager.setActiveTemplate(templateId);
    loadSavedTemplates();
    toast.success('Template activated successfully!');
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

  return (
    <RoleGuard 
      allowedRoles={['ORG_ADMIN', 'ORG_FINANCE']}
      fallbackMessage="You need Organization Admin or Finance role to manage approval workflows."
    >
      <div className="min-h-screen bg-gray-50">
        <OrganizationSidebar />
        
        <div className="lg:pl-72">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Approval Workflow</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Design your payment approval hierarchy with email notifications
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                {approvalLevels.length > 0 ? (
                  <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>{approvalLevels.length} Levels Active</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                    <ClockIcon className="w-4 h-4" />
                    <span>Not Configured</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approval Levels</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{approvalLevels.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500">
                  <DocumentTextIcon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Email Notifications</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {approvalLevels.length > 0 ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${approvalLevels.length > 0 ? 'bg-green-500' : 'bg-gray-400'}`}>
                  <EnvelopeIcon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Auto-Payment</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">Ready</p>
                </div>
                <div className="p-3 rounded-lg bg-green-500">
                  <BanknotesIcon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Team Members</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{users.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-500">
                  <DocumentTextIcon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {[
                  { id: 'visual', name: 'Visual Workflow', icon: PlayIcon },
                  { id: 'builder', name: 'Legacy Builder', icon: CogIcon },
                  { id: 'preview', name: 'Preview & Test', icon: EyeIcon },
                  { id: 'settings', name: 'Email Settings', icon: EnvelopeIcon }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-0">
              {/* Visual Workflow Tab */}
              {activeTab === 'visual' && (
                <div style={{ height: '700px' }}>
                  <VisualWorkflowBuilder
                    orgId={user.orgId!}
                    existingLevels={approvalLevels}
                    onSave={handleSaveWorkflow}
                    users={users}
                  />
                </div>
              )}

              {/* Legacy Workflow Builder Tab */}
              {activeTab === 'builder' && (
                <div className="p-6">
                  <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4 mb-6">
                    <div className="flex items-center space-x-3">
                      <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
                      <div>
                        <h3 className="font-medium text-yellow-900">Legacy Builder</h3>
                        <p className="text-sm text-yellow-700 mt-1">
                          This is the old workflow builder. We recommend using the Visual Workflow for better experience.
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Legacy ApprovalWorkflowBuilder would go here if needed */}
                  <div className="text-center py-12">
                    <CogIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Legacy Builder</h3>
                    <p className="text-gray-600 mb-6">
                      Use the Visual Workflow tab for the enhanced n8n-style workflow builder.
                    </p>
                  </div>
                </div>
              )}

              {/* Preview Tab */}
              {activeTab === 'preview' && (
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Workflow Preview</h3>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="text-center">
                        <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 mb-2">Workflow Preview</h4>
                        <p className="text-gray-600 mb-6">
                          Test your approval workflow with sample payment requests
                        </p>
                        <button className="btn-primary">
                          Run Test Workflow
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Sample Email Preview */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Sample Email Preview</h4>
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="border-b border-gray-200 pb-4 mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">To: approver@company.com</p>
                            <p className="text-sm text-gray-600">From: noreply@yourorg.com</p>
                          </div>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            Approval Request
                          </span>
                        </div>
                        <h5 className="text-lg font-medium text-gray-900 mt-2">
                          [Your Organization] Approval Required: Office Supplies Purchase
                        </h5>
                      </div>
                      
                      <div className="prose prose-sm max-w-none">
                        <p>Dear John Doe,</p>
                        <p>You have a new payment request requiring your approval:</p>
                        
                        <div className="bg-gray-50 p-4 rounded-lg my-4">
                          <h6 className="font-medium text-gray-900 mb-2">📋 Request Details:</h6>
                          <ul className="text-sm text-gray-700 space-y-1">
                            <li>• Title: Office Supplies Purchase</li>
                            <li>• Amount: USD 2,500</li>
                            <li>• Requested by: Jane Smith</li>
                            <li>• Category: Office Supplies</li>
                            <li>• Urgency: Medium</li>
                          </ul>
                        </div>
                        
                        <p>🔄 Approval Step: Budget Approval (Step 2)</p>
                        
                        <div className="my-4">
                          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
                            Review & Approve Request
                          </button>
                        </div>
                        
                        <p className="text-sm text-gray-600">
                          Best regards,<br />
                          Your Organization Payment System
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Email Settings Tab */}
              {activeTab === 'settings' && (
                <div className="p-6 space-y-8">
                  {/* AI Email Template Builder */}
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">AI-Powered Email Templates</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Generate professional email templates for your approval workflow using Gemini AI
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-purple-700">AI Powered</span>
                      </div>
                    </div>

                    {/* Template Type Selector */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      {[
                        {
                          type: 'approval_request' as const,
                          title: 'Approval Request',
                          description: 'Email sent to approvers',
                          icon: '📋',
                          color: 'bg-blue-50 border-blue-200 text-blue-700'
                        },
                        {
                          type: 'approval_update' as const,
                          title: 'Status Update',
                          description: 'Approval status changes',
                          icon: '✅',
                          color: 'bg-green-50 border-green-200 text-green-700'
                        },
                        {
                          type: 'payment_status' as const,
                          title: 'Payment Status',
                          description: 'Payment completion notice',
                          icon: '💰',
                          color: 'bg-yellow-50 border-yellow-200 text-yellow-700'
                        },
                        {
                          type: 'reminder' as const,
                          title: 'Reminder',
                          description: 'Pending approval reminders',
                          icon: '⏰',
                          color: 'bg-orange-50 border-orange-200 text-orange-700'
                        }
                      ].map((template) => (
                        <div
                          key={template.type}
                          onClick={() => setSelectedTemplateType(template.type)}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                            selectedTemplateType === template.type 
                              ? template.color + ' ring-2 ring-blue-500' 
                              : template.color + ' opacity-75 hover:opacity-100'
                          }`}
                        >
                          <div className="text-2xl mb-2">{template.icon}</div>
                          <h4 className="font-medium text-sm mb-1">{template.title}</h4>
                          <p className="text-xs opacity-75">{template.description}</p>
                          {selectedTemplateType === template.type && (
                            <div className="mt-2">
                              <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">Selected</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Main AI Template Builder */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                      <AIEmailTemplateBuilder
                        templateType={selectedTemplateType}
                        initialContext={{
                          organizationName: user?.orgId || 'Your Organization',
                          recipientRole: selectedTemplateType === 'approval_request' ? 'Approver' : 'Requester',
                          tone: 'professional',
                          urgency: 'medium',
                          currency: 'USD'
                        }}
                        onTemplateGenerated={handleTemplateGenerated}
                      />
                    </div>

                    {/* Quick Template Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">🚀 Quick Templates</h4>
                        <div className="space-y-2">
                          <button 
                            onClick={() => handleQuickTemplateGenerate('approval_request')}
                            className="w-full text-left text-sm text-blue-600 hover:text-blue-800 py-1"
                          >
                            Generate Approval Request Template
                          </button>
                          <button 
                            onClick={() => handleQuickTemplateGenerate('approval_update')}
                            className="w-full text-left text-sm text-green-600 hover:text-green-800 py-1"
                          >
                            Generate Status Update Template
                          </button>
                          <button 
                            onClick={() => handleQuickTemplateGenerate('reminder')}
                            className="w-full text-left text-sm text-orange-600 hover:text-orange-800 py-1"
                          >
                            Generate Reminder Template
                          </button>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">🎨 Template Styles</h4>
                        <div className="space-y-2">
                          <button className="w-full text-left text-sm text-gray-600 hover:text-gray-800 py-1">
                            Professional & Formal
                          </button>
                          <button className="w-full text-left text-sm text-gray-600 hover:text-gray-800 py-1">
                            Friendly & Approachable
                          </button>
                          <button className="w-full text-left text-sm text-gray-600 hover:text-gray-800 py-1">
                            Concise & Direct
                          </button>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">🌍 Languages</h4>
                        <div className="space-y-2">
                          <button className="w-full text-left text-sm text-gray-600 hover:text-gray-800 py-1">
                            English Templates
                          </button>
                          <button className="w-full text-left text-sm text-gray-600 hover:text-gray-800 py-1">
                            Spanish Templates
                          </button>
                          <button className="w-full text-left text-sm text-gray-600 hover:text-gray-800 py-1">
                            Hindi Templates
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Template Library */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">📚 Template Library ({savedTemplates.length})</h4>
                        <button 
                          onClick={loadSavedTemplates}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Refresh Templates
                        </button>
                      </div>
                      
                      {savedTemplates.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {savedTemplates.slice(0, 4).map((template) => (
                            <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-sm font-medium text-gray-900">{template.name}</h5>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  template.isActive 
                                    ? 'text-green-600 bg-green-100' 
                                    : 'text-gray-600 bg-gray-100'
                                }`}>
                                  {template.isActive ? 'Active' : 'Draft'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 mb-3">
                                {template.type.replace('_', ' ').toUpperCase()} • Created {template.createdAt.toLocaleDateString()}
                              </p>
                              <div className="flex space-x-2">
                                <button className="text-xs text-blue-600 hover:text-blue-800">Edit</button>
                                <button className="text-xs text-gray-600 hover:text-gray-800">Preview</button>
                                {!template.isActive && (
                                  <button 
                                    onClick={() => handleSetActiveTemplate(template.id)}
                                    className="text-xs text-green-600 hover:text-green-800"
                                  >
                                    Activate
                                  </button>
                                )}
                                <button className="text-xs text-purple-600 hover:text-purple-800">Improve with AI</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-4xl mb-4">📝</div>
                          <h5 className="text-sm font-medium text-gray-900 mb-2">No Templates Yet</h5>
                          <p className="text-xs text-gray-600 mb-4">
                            Generate your first email template using AI above
                          </p>
                          <button 
                            onClick={() => handleQuickTemplateGenerate(selectedTemplateType)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Create First Template
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          From Email Address
                        </label>
                        <input
                          type="email"
                          defaultValue="noreply@yourorg.com"
                          className="input-field"
                          placeholder="noreply@yourorg.com"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          From Name
                        </label>
                        <input
                          type="text"
                          defaultValue="Payment System"
                          className="input-field"
                          placeholder="Your Organization"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Reply-To Email
                        </label>
                        <input
                          type="email"
                          defaultValue="support@yourorg.com"
                          className="input-field"
                          placeholder="support@yourorg.com"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Provider
                        </label>
                        <select className="input-field">
                          <option value="sendgrid">SendGrid</option>
                          <option value="ses">Amazon SES</option>
                          <option value="mailgun">Mailgun</option>
                          <option value="resend">Resend</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h5 className="font-medium text-gray-900">Approval Request Notifications</h5>
                          <p className="text-sm text-gray-600">Send emails when approval is required</p>
                        </div>
                        <input
                          type="checkbox"
                          defaultChecked
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h5 className="font-medium text-gray-900">Status Update Notifications</h5>
                          <p className="text-sm text-gray-600">Notify requesters of approval status changes</p>
                        </div>
                        <input
                          type="checkbox"
                          defaultChecked
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h5 className="font-medium text-gray-900">Payment Status Notifications</h5>
                          <p className="text-sm text-gray-600">Final email when payment is processed</p>
                        </div>
                        <input
                          type="checkbox"
                          defaultChecked
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h5 className="font-medium text-gray-900">Reminder Notifications</h5>
                          <p className="text-sm text-gray-600">Send reminders for pending approvals</p>
                        </div>
                        <input
                          type="checkbox"
                          defaultChecked
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button className="btn-primary">
                      Save Email Settings
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Workflow Features Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Workflow Features</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Visual Node-Based Design</p>
                    <p className="text-gray-600">Drag-and-drop workflow builder with visual hierarchy</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <EnvelopeIcon className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Email Notifications</p>
                    <p className="text-gray-600">Automated emails at each approval step</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <BanknotesIcon className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Payment Triggers</p>
                    <p className="text-gray-600">Automatic payment processing after final approval</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <ClockIcon className="w-5 h-5 text-orange-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Timeout & Reminders</p>
                    <p className="text-gray-600">Configurable timeouts with reminder emails</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Flow</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">1</span>
                  </div>
                  <p className="text-gray-600">Payment request submitted → Email to first approver</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">2</span>
                  </div>
                  <p className="text-gray-600">Each approval → Email to next approver + status update to requester</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">3</span>
                  </div>
                  <p className="text-gray-600">Final approval → Payment processing triggered</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">4</span>
                  </div>
                  <p className="text-gray-600">Payment completed → Final status email to all stakeholders</p>
                </div>
              </div>
            </div>
          </div>
        </main>
        </div>
      </div>
    </RoleGuard>
  );
}