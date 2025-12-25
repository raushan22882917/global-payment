'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import OrganizationSidebar from '@/components/OrganizationSidebar';
import {
  BanknotesIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  PaperClipIcon,
  ExclamationTriangleIcon,
  CreditCardIcon,
  QrCodeIcon,
  BuildingLibraryIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  InboxArrowDownIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { createPaymentRequest, getApprovalLevelsByOrg, getOrganization, createWorkflowInstance } from '@/lib/database';
import { visualWorkflowEngine } from '@/lib/visual-workflow-engine';
import { collectionEmailService } from '@/lib/collection-email-service';
import { validateUserOrganization, getOrganizationErrorMessage } from '@/lib/organization-utils';
import toast from 'react-hot-toast';

export default function NewPaymentRequestPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    currency: 'USD',
    category: '',
    urgency: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    attachments: [] as string[],
    // Payment Collection Details
    collectionType: 'PAYMENT_TO_PAYEE' as 'PAYMENT_TO_PAYEE' | 'COLLECT_FROM_EMAIL',
    collectionEmail: '', // Email from which to collect payment
    collectionMessage: '', // Custom message for collection request
    // Payee Information
    payeeName: '',
    payeeEmail: '',
    payeePhone: '',
    // Bank Details
    bankDetails: {
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      accountHolderName: '',
      accountType: 'SAVINGS' as 'SAVINGS' | 'CURRENT'
    },
    // UPI Details
    upiDetails: {
      upiId: '',
      qrCodeImage: null as File | null
    },
    // Payment Method Preference
    preferredPaymentMethod: 'BANK' as 'BANK' | 'UPI' | 'BOTH',
    // Additional Details
    invoiceNumber: '',
    dueDate: '',
    taxDetails: {
      gstNumber: '',
      panNumber: '',
      taxAmount: '',
      taxType: 'GST' as 'GST' | 'TDS' | 'NONE'
    }
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [approvalLevels, setApprovalLevels] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [qrCodePreview, setQrCodePreview] = useState<string | null>(null);

  const steps = [
    { id: 1, name: 'Request Type', icon: DocumentTextIcon },
    { id: 2, name: 'Request Details', icon: BanknotesIcon },
    { id: 3, name: 'Payee Information', icon: UserIcon },
    { id: 4, name: 'Payment Details', icon: CreditCardIcon },
    { id: 5, name: 'Review & Submit', icon: CheckCircleIcon }
  ];

  useEffect(() => {
    if (!loading && (!user || !user.role.startsWith('ORG_'))) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.orgId && user.orgId !== 'public') {
      validateAndFetchData();
    } else if (user && (!user.orgId || user.orgId === 'public')) {
      // User doesn't have a valid organization
      toast.error('You must be part of an organization to create payment requests here. Use the regular payment request form instead.');
      router.push('/request-payment');
    }
  }, [user, router]);

  const validateAndFetchData = async () => {
    if (!user) return;

    const validation = await validateUserOrganization(user);
    
    if (!validation.isValid) {
      const errorMessage = getOrganizationErrorMessage(validation.error || 'Unknown error');
      toast.error(errorMessage);
      router.push('/request-payment');
      return;
    }

    // If validation passes, fetch approval levels
    fetchApprovalLevels();
  };

  const fetchApprovalLevels = async () => {
    if (!user?.orgId || user.orgId === 'public') return;
    
    try {
      // First check if organization exists
      const organization = await getOrganization(user.orgId);
      if (!organization) {
        toast.error('Organization not found. Please contact your administrator.');
        router.push('/request-payment');
        return;
      }

      const levels = await getApprovalLevelsByOrg(user.orgId);
      setApprovalLevels(levels || []);
    } catch (error) {
      console.error('Failed to fetch approval levels:', error);
      toast.error('Failed to load organization data. Please try again.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested object updates
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleQrCodeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }

      setFormData(prev => ({
        ...prev,
        upiDetails: {
          ...prev.upiDetails,
          qrCodeImage: file
        }
      }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setQrCodePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      toast.success('QR Code uploaded successfully!');
    }
  };

  const removeQrCode = () => {
    setFormData(prev => ({
      ...prev,
      upiDetails: {
        ...prev.upiDetails,
        qrCodeImage: null
      }
    }));
    setQrCodePreview(null);
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate user and organization
    const validation = await validateUserOrganization(user);
    if (!validation.isValid) {
      const errorMessage = getOrganizationErrorMessage(validation.error || 'Unknown error');
      toast.error(errorMessage);
      router.push('/request-payment');
      return;
    }

    // Enhanced validation
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (!formData.category.trim()) {
      toast.error('Please select a category');
      return;
    }

    // Collection-specific validation
    if (formData.collectionType === 'COLLECT_FROM_EMAIL') {
      if (!formData.collectionEmail.trim()) {
        toast.error('Please enter the email to collect payment from');
        return;
      }
      
      if (!formData.payeeName.trim()) {
        toast.error('Please enter client/customer name');
        return;
      }
    } else {
      // Regular payment validation
      if (!formData.payeeName.trim()) {
        toast.error('Please enter payee name');
        return;
      }
    }

    // Validate payment method details
    if (formData.preferredPaymentMethod === 'BANK' || formData.preferredPaymentMethod === 'BOTH') {
      if (!formData.bankDetails.accountNumber || !formData.bankDetails.ifscCode || !formData.bankDetails.bankName) {
        toast.error('Please fill all bank details');
        return;
      }
    }

    if (formData.preferredPaymentMethod === 'UPI' || formData.preferredPaymentMethod === 'BOTH') {
      if (!formData.upiDetails.upiId) {
        toast.error('Please enter UPI ID');
        return;
      }
    }

    if (approvalLevels.length === 0) {
      toast.error('No approval workflow configured. Please contact your administrator.');
      return;
    }

    setSubmitting(true);
    try {
      // Create enhanced payment request data object
      const paymentRequestData: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        category: formData.category.trim(),
        urgency: formData.urgency,
        status: 'PENDING',
        currentApprovalLevel: 1,
        orgId: user?.orgId || '',
        requestedBy: user?.id || '',
        attachments: formData.attachments,
        // Collection-specific fields
        collectionType: formData.collectionType,
        collectionEmail: formData.collectionType === 'COLLECT_FROM_EMAIL' ? formData.collectionEmail : undefined,
        collectionMessage: formData.collectionType === 'COLLECT_FROM_EMAIL' ? formData.collectionMessage : undefined,
        // Enhanced fields
        payeeDetails: {
          name: formData.payeeName.trim(),
          email: formData.payeeEmail.trim(),
          phone: formData.payeePhone.trim()
        },
        preferredPaymentMethod: formData.preferredPaymentMethod,
        metadata: {
          submittedVia: 'web',
          userAgent: navigator.userAgent,
          stepCompleted: currentStep,
          isCollectionRequest: formData.collectionType === 'COLLECT_FROM_EMAIL'
        }
      };

      // Add bank details only if needed
      if (formData.preferredPaymentMethod === 'BANK' || formData.preferredPaymentMethod === 'BOTH') {
        paymentRequestData.bankDetails = {
          accountNumber: formData.bankDetails.accountNumber,
          ifscCode: formData.bankDetails.ifscCode,
          bankName: formData.bankDetails.bankName,
          accountHolderName: formData.bankDetails.accountHolderName,
          accountType: formData.bankDetails.accountType
        };
      }

      // Add UPI details only if needed
      if (formData.preferredPaymentMethod === 'UPI' || formData.preferredPaymentMethod === 'BOTH') {
        const upiDetails: any = {
          upiId: formData.upiDetails.upiId
        };
        
        if (formData.upiDetails.qrCodeImage) {
          upiDetails.qrCodeImage = 'uploaded';
        }
        
        paymentRequestData.upiDetails = upiDetails;
      }

      // Add optional fields only if they have values
      if (formData.invoiceNumber) {
        paymentRequestData.invoiceNumber = formData.invoiceNumber;
      }

      if (formData.dueDate) {
        paymentRequestData.dueDate = new Date(formData.dueDate);
      }

      // Add tax details only if not NONE
      if (formData.taxDetails.taxType !== 'NONE') {
        paymentRequestData.taxDetails = {
          gstNumber: formData.taxDetails.gstNumber,
          panNumber: formData.taxDetails.panNumber,
          taxAmount: formData.taxDetails.taxAmount ? parseFloat(formData.taxDetails.taxAmount) : 0,
          taxType: formData.taxDetails.taxType
        };
      }

      // Create enhanced payment request
      const requestId = await createPaymentRequest(paymentRequestData);

      // Use the organization from validation (we know it exists)
      const organization = validation.organization;

      // Start approval workflow (same as before)
      const paymentRequest = {
        id: requestId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        requestedBy: user?.id || '',
        requestedAt: new Date(),
        category: formData.category.trim(),
        urgency: formData.urgency,
        status: 'PENDING' as const,
        currentApprovalLevel: 1,
        orgId: user?.orgId || ''
      };

      // Create mock visual workflow from approval levels
      const mockWorkflowDefinition = {
        nodes: [
          {
            id: 'start-node',
            type: 'start' as const,
            position: { x: 100, y: 200 },
            data: { label: 'Payment Request Submitted' },
            inputs: [],
            outputs: ['output']
          },
          ...approvalLevels.map((level, index) => ({
            id: `approval-${level.id}`,
            type: 'approval' as const,
            position: { x: 300 + (index * 200), y: 200 },
            data: {
              label: level.levelName,
              approverType: level.approverType,
              approverValue: level.approverValue,
              emailTemplate: 'Please review and approve the payment request: {{requestTitle}}',
              timeoutHours: 24,
              stepOrder: level.levelOrder
            },
            inputs: ['input'],
            outputs: ['output']
          })),
          {
            id: 'payment-node',
            type: 'payment' as const,
            position: { x: 300 + (approvalLevels.length * 200), y: 200 },
            data: { label: 'Process Payment' },
            inputs: ['input'],
            outputs: ['output']
          },
          {
            id: 'end-node',
            type: 'end' as const,
            position: { x: 500 + (approvalLevels.length * 200), y: 200 },
            data: { label: 'Payment Completed' },
            inputs: ['input'],
            outputs: []
          }
        ],
        connections: [
          { id: 'start-to-first', source: 'start-node', target: `approval-${approvalLevels[0]?.id}` },
          ...approvalLevels.slice(0, -1).map((level, index) => ({
            id: `approval-${index}-to-${index + 1}`,
            source: `approval-${level.id}`,
            target: `approval-${approvalLevels[index + 1].id}`
          })),
          {
            id: 'last-approval-to-payment',
            source: `approval-${approvalLevels[approvalLevels.length - 1]?.id}`,
            target: 'payment-node'
          },
          { id: 'payment-to-end', source: 'payment-node', target: 'end-node' }
        ]
      };

      await visualWorkflowEngine.startWorkflow(
        paymentRequest,
        mockWorkflowDefinition,
        user!,
        organization
      );

      // Handle collection request email
      if (formData.collectionType === 'COLLECT_FROM_EMAIL') {
        const collectionRequest = {
          id: requestId,
          title: formData.title.trim(),
          description: formData.description.trim(),
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          collectionEmail: formData.collectionEmail,
          collectionMessage: formData.collectionMessage,
          invoiceNumber: formData.invoiceNumber,
          dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
          requestedBy: user?.id || '',
          requestedAt: new Date(),
          orgId: user?.orgId || '',
          status: 'SENT' as const
        };

        const organizationPaymentDetails = {
          bankDetails: (formData.preferredPaymentMethod === 'BANK' || formData.preferredPaymentMethod === 'BOTH') ? {
            accountNumber: formData.bankDetails.accountNumber,
            ifscCode: formData.bankDetails.ifscCode,
            bankName: formData.bankDetails.bankName,
            accountHolderName: formData.bankDetails.accountHolderName,
            accountType: formData.bankDetails.accountType
          } : undefined,
          upiDetails: (formData.preferredPaymentMethod === 'UPI' || formData.preferredPaymentMethod === 'BOTH') ? {
            upiId: formData.upiDetails.upiId,
            qrCodeImage: formData.upiDetails.qrCodeImage ? 'uploaded' : undefined
          } : undefined,
          preferredPaymentMethod: formData.preferredPaymentMethod
        };

        // Send collection email
        const emailSent = await collectionEmailService.sendCollectionRequest(
          collectionRequest,
          organization,
          user!,
          organizationPaymentDetails
        );

        if (emailSent) {
          toast.success('Payment collection request sent successfully!');
        } else {
          toast.error('Payment request created but failed to send collection email');
        }
      } else {
        toast.success('Payment request submitted successfully!');
      }

      router.push('/org/payments');
    } catch (error) {
      console.error('Failed to submit payment request:', error);
      toast.error('Failed to submit payment request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user || !user.role.startsWith('ORG_')) {
    return null;
  }

  const categories = [
    'Office Supplies',
    'Equipment',
    'Software',
    'Travel',
    'Marketing',
    'Utilities',
    'Professional Services',
    'Training',
    'Other'
  ];

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
                  onClick={() => router.push('/org/payments')}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">New Payment Request</h1>
                  <p className="mt-1 text-sm text-gray-600">
                    Submit a new payment request for approval
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <BanknotesIcon className="w-6 h-6 text-blue-500" />
                <span className="text-sm font-medium text-gray-600">
                  {approvalLevels.length} approval levels configured
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Warning if no approval levels */}
            {approvalLevels.length === 0 && (
              <div className="bg-orange-50 rounded-lg border border-orange-200 p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />
                  <div>
                    <h3 className="font-medium text-orange-900">No Approval Workflow Configured</h3>
                    <p className="text-sm text-orange-700 mt-1">
                      Contact your administrator to set up the approval workflow before submitting requests.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Progress Steps */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = currentStep === step.id;
                  const isCompleted = currentStep > step.id;
                  
                  return (
                    <div key={step.id} className="flex items-center">
                      <div className={`flex items-center space-x-3 ${
                        isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isActive ? 'bg-blue-100' : isCompleted ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{step.name}</p>
                          <p className="text-xs">Step {step.id}</p>
                        </div>
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`w-16 h-0.5 mx-4 ${
                          isCompleted ? 'bg-green-300' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
              
              {/* Step 1: Request Type */}
              {currentStep === 1 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Payment Request Type</h2>
                  <p className="text-gray-600 mb-6">Choose how you want to handle this payment request</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Payment to Payee Option */}
                    <div 
                      className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.collectionType === 'PAYMENT_TO_PAYEE' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, collectionType: 'PAYMENT_TO_PAYEE' }))}
                    >
                      <div className="flex items-center space-x-4 mb-4">
                        <div className={`p-3 rounded-lg ${
                          formData.collectionType === 'PAYMENT_TO_PAYEE' ? 'bg-blue-500' : 'bg-gray-400'
                        }`}>
                          <BanknotesIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Make Payment</h3>
                          <p className="text-sm text-gray-600">Pay money to someone</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">
                        Create a payment request to send money to a vendor, employee, or service provider. 
                        You'll provide their bank details or UPI information.
                      </p>
                      <div className="mt-4 flex items-center space-x-2 text-sm text-gray-600">
                        <ArrowRightIcon className="w-4 h-4" />
                        <span>Outgoing payment from your organization</span>
                      </div>
                    </div>

                    {/* Collect from Email Option */}
                    <div 
                      className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.collectionType === 'COLLECT_FROM_EMAIL' 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, collectionType: 'COLLECT_FROM_EMAIL' }))}
                    >
                      <div className="flex items-center space-x-4 mb-4">
                        <div className={`p-3 rounded-lg ${
                          formData.collectionType === 'COLLECT_FROM_EMAIL' ? 'bg-green-500' : 'bg-gray-400'
                        }`}>
                          <InboxArrowDownIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Collect Payment</h3>
                          <p className="text-sm text-gray-600">Request money from someone</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">
                        Send a payment collection request to a client, customer, or debtor. 
                        They'll receive an email with payment instructions and your organization's details.
                      </p>
                      <div className="mt-4 flex items-center space-x-2 text-sm text-gray-600">
                        <ArrowRightIcon className="w-4 h-4" />
                        <span>Incoming payment to your organization</span>
                      </div>
                    </div>
                  </div>

                  {/* Collection Email Field */}
                  {formData.collectionType === 'COLLECT_FROM_EMAIL' && (
                    <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-medium text-green-900 mb-4">Collection Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="collectionEmail" className="block text-sm font-medium text-gray-700 mb-2">
                            Email to Collect From *
                          </label>
                          <input
                            type="email"
                            id="collectionEmail"
                            name="collectionEmail"
                            value={formData.collectionEmail}
                            onChange={handleInputChange}
                            className="input-field"
                            placeholder="client@company.com"
                            required={formData.collectionType === 'COLLECT_FROM_EMAIL'}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            The person/company you want to collect payment from
                          </p>
                        </div>
                        <div>
                          <label htmlFor="collectionMessage" className="block text-sm font-medium text-gray-700 mb-2">
                            Custom Message
                          </label>
                          <textarea
                            id="collectionMessage"
                            name="collectionMessage"
                            value={formData.collectionMessage}
                            onChange={handleInputChange}
                            className="input-field"
                            rows={3}
                            placeholder="Please pay the outstanding invoice amount..."
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Optional message to include in the collection email
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Request Details */}
              {currentStep === 2 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Request Details</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                        Request Title *
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="input-field"
                        placeholder="e.g., Office Supplies Purchase"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                        Amount *
                      </label>
                      <input
                        type="number"
                        id="amount"
                        name="amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        className="input-field"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                        Currency
                      </label>
                      <select
                        id="currency"
                        name="currency"
                        value={formData.currency}
                        onChange={handleInputChange}
                        className="input-field"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="INR">INR</option>
                        <option value="CAD">CAD</option>
                        <option value="AUD">AUD</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="input-field"
                        required
                      >
                        <option value="">Select a category</option>
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-2">
                        Urgency
                      </label>
                      <select
                        id="urgency"
                        name="urgency"
                        value={formData.urgency}
                        onChange={handleInputChange}
                        className="input-field"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700 mb-2">
                        Invoice Number
                      </label>
                      <input
                        type="text"
                        id="invoiceNumber"
                        name="invoiceNumber"
                        value={formData.invoiceNumber}
                        onChange={handleInputChange}
                        className="input-field"
                        placeholder="INV-2024-001"
                      />
                    </div>

                    <div>
                      <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                        Due Date
                      </label>
                      <input
                        type="date"
                        id="dueDate"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleInputChange}
                        className="input-field"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={4}
                        className="input-field"
                        placeholder="Provide details about this payment request..."
                      />
                    </div>

                    {/* File Attachments */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Attachments (Optional)
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <PaperClipIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          Upload invoices, receipts, or supporting documents
                        </p>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          className="hidden"
                          id="attachments"
                        />
                        <label
                          htmlFor="attachments"
                          className="btn-secondary cursor-pointer"
                        >
                          Choose Files
                        </label>
                        <p className="text-xs text-gray-500 mt-2">
                          PDF, Images, Word documents (max 10MB each)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Payee Information */}
              {currentStep === 3 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">
                    {formData.collectionType === 'COLLECT_FROM_EMAIL' ? 'Collection Information' : 'Payee Information'}
                  </h2>
                  
                  {formData.collectionType === 'COLLECT_FROM_EMAIL' ? (
                    /* Collection Information */
                    <div className="space-y-6">
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <h3 className="font-medium text-green-900 mb-2">Collection Request Details</h3>
                        <p className="text-sm text-green-700">
                          This request will send a payment collection email to <strong>{formData.collectionEmail}</strong> with your organization's payment details.
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="payeeName" className="block text-sm font-medium text-gray-700 mb-2">
                            Client/Customer Name *
                          </label>
                          <input
                            type="text"
                            id="payeeName"
                            name="payeeName"
                            value={formData.payeeName}
                            onChange={handleInputChange}
                            className="input-field"
                            placeholder="Name of the person/company paying you"
                            required
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700 mb-2">
                            Invoice/Reference Number
                          </label>
                          <input
                            type="text"
                            id="invoiceNumber"
                            name="invoiceNumber"
                            value={formData.invoiceNumber}
                            onChange={handleInputChange}
                            className="input-field"
                            placeholder="INV-2024-001"
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <label htmlFor="collectionMessage" className="block text-sm font-medium text-gray-700 mb-2">
                            Collection Message
                          </label>
                          <textarea
                            id="collectionMessage"
                            name="collectionMessage"
                            value={formData.collectionMessage}
                            onChange={handleInputChange}
                            className="input-field"
                            rows={4}
                            placeholder="Dear Client, Please find the payment request for the services provided. Kindly process the payment at your earliest convenience."
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            This message will be included in the collection email sent to the client
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Regular Payee Information */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label htmlFor="payeeName" className="block text-sm font-medium text-gray-700 mb-2">
                          Payee Name *
                        </label>
                        <input
                          type="text"
                          id="payeeName"
                          name="payeeName"
                          value={formData.payeeName}
                          onChange={handleInputChange}
                          className="input-field"
                          placeholder="Full name of the person/company to be paid"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="payeeEmail" className="block text-sm font-medium text-gray-700 mb-2">
                          Payee Email
                        </label>
                        <input
                          type="email"
                          id="payeeEmail"
                          name="payeeEmail"
                          value={formData.payeeEmail}
                          onChange={handleInputChange}
                          className="input-field"
                          placeholder="payee@example.com"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="payeePhone" className="block text-sm font-medium text-gray-700 mb-2">
                          Payee Phone
                        </label>
                        <input
                          type="tel"
                          id="payeePhone"
                          name="payeePhone"
                          value={formData.payeePhone}
                          onChange={handleInputChange}
                          className="input-field"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>
                  )}

                  {/* Tax Details - Show for both types */}
                  <div className="mt-6">
                    <h3 className="text-md font-medium text-gray-900 mb-4">Tax Information (Optional)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="taxDetails.taxType" className="block text-sm font-medium text-gray-700 mb-2">
                          Tax Type
                        </label>
                        <select
                          id="taxDetails.taxType"
                          name="taxDetails.taxType"
                            value={formData.taxDetails.taxType}
                            onChange={handleInputChange}
                            className="input-field"
                          >
                            <option value="NONE">No Tax</option>
                            <option value="GST">GST</option>
                            <option value="TDS">TDS</option>
                          </select>
                        </div>

                        {formData.taxDetails.taxType !== 'NONE' && (
                          <>
                            <div>
                              <label htmlFor="taxDetails.gstNumber" className="block text-sm font-medium text-gray-700 mb-2">
                                GST Number
                              </label>
                              <input
                                type="text"
                                id="taxDetails.gstNumber"
                                name="taxDetails.gstNumber"
                                value={formData.taxDetails.gstNumber}
                                onChange={handleInputChange}
                                className="input-field"
                                placeholder="22AAAAA0000A1Z5"
                              />
                            </div>

                            <div>
                              <label htmlFor="taxDetails.panNumber" className="block text-sm font-medium text-gray-700 mb-2">
                                PAN Number
                              </label>
                              <input
                                type="text"
                                id="taxDetails.panNumber"
                                name="taxDetails.panNumber"
                                value={formData.taxDetails.panNumber}
                                onChange={handleInputChange}
                                className="input-field"
                                placeholder="AAAAA0000A"
                              />
                            </div>

                            <div>
                              <label htmlFor="taxDetails.taxAmount" className="block text-sm font-medium text-gray-700 mb-2">
                                Tax Amount
                              </label>
                              <input
                                type="number"
                                id="taxDetails.taxAmount"
                                name="taxDetails.taxAmount"
                                value={formData.taxDetails.taxAmount}
                                onChange={handleInputChange}
                                className="input-field"
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Payment Details */}
              {currentStep === 4 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">
                    {formData.collectionType === 'COLLECT_FROM_EMAIL' ? 'Your Organization Payment Details' : 'Payment Details'}
                  </h2>
                  
                  {formData.collectionType === 'COLLECT_FROM_EMAIL' ? (
                    /* Organization's payment details for collection */
                    <div className="space-y-6">
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <h3 className="font-medium text-blue-900 mb-2">Collection Setup</h3>
                        <p className="text-sm text-blue-700">
                          Provide your organization's payment details that will be shared with the client for payment collection.
                        </p>
                      </div>
                      
                      {/* Organization Payment Method Selection */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          How should clients pay you? *
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[
                            { value: 'BANK', label: 'Bank Transfer', icon: BuildingLibraryIcon },
                            { value: 'UPI', label: 'UPI Payment', icon: QrCodeIcon },
                            { value: 'BOTH', label: 'Both Options', icon: CreditCardIcon }
                          ].map((method) => {
                            const Icon = method.icon;
                            return (
                              <button
                                key={method.value}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, preferredPaymentMethod: method.value as any }))}
                                className={`p-4 rounded-lg border text-left transition-all ${
                                  formData.preferredPaymentMethod === method.value
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className="flex items-center space-x-3">
                                  <Icon className="w-6 h-6" />
                                  <span className="font-medium">{method.label}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Organization Bank Details */}
                      {(formData.preferredPaymentMethod === 'BANK' || formData.preferredPaymentMethod === 'BOTH') && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                          <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center space-x-2">
                            <BuildingLibraryIcon className="w-5 h-5" />
                            <span>Your Organization's Bank Details</span>
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="bankDetails.accountHolderName" className="block text-sm font-medium text-gray-700 mb-2">
                                Account Holder Name *
                              </label>
                              <input
                                type="text"
                                id="bankDetails.accountHolderName"
                                name="bankDetails.accountHolderName"
                                value={formData.bankDetails.accountHolderName}
                                onChange={handleInputChange}
                                className="input-field"
                                placeholder="Your Organization Name"
                                required={formData.preferredPaymentMethod === 'BANK' || formData.preferredPaymentMethod === 'BOTH'}
                              />
                            </div>

                            <div>
                              <label htmlFor="bankDetails.accountNumber" className="block text-sm font-medium text-gray-700 mb-2">
                                Account Number *
                              </label>
                              <input
                                type="text"
                                id="bankDetails.accountNumber"
                                name="bankDetails.accountNumber"
                                value={formData.bankDetails.accountNumber}
                                onChange={handleInputChange}
                                className="input-field"
                                placeholder="1234567890"
                                required={formData.preferredPaymentMethod === 'BANK' || formData.preferredPaymentMethod === 'BOTH'}
                              />
                            </div>

                            <div>
                              <label htmlFor="bankDetails.ifscCode" className="block text-sm font-medium text-gray-700 mb-2">
                                IFSC Code *
                              </label>
                              <input
                                type="text"
                                id="bankDetails.ifscCode"
                                name="bankDetails.ifscCode"
                                value={formData.bankDetails.ifscCode}
                                onChange={handleInputChange}
                                className="input-field"
                                placeholder="SBIN0001234"
                                required={formData.preferredPaymentMethod === 'BANK' || formData.preferredPaymentMethod === 'BOTH'}
                              />
                            </div>

                            <div>
                              <label htmlFor="bankDetails.bankName" className="block text-sm font-medium text-gray-700 mb-2">
                                Bank Name *
                              </label>
                              <input
                                type="text"
                                id="bankDetails.bankName"
                                name="bankDetails.bankName"
                                value={formData.bankDetails.bankName}
                                onChange={handleInputChange}
                                className="input-field"
                                placeholder="State Bank of India"
                                required={formData.preferredPaymentMethod === 'BANK' || formData.preferredPaymentMethod === 'BOTH'}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Organization UPI Details */}
                      {(formData.preferredPaymentMethod === 'UPI' || formData.preferredPaymentMethod === 'BOTH') && (
                        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                          <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center space-x-2">
                            <QrCodeIcon className="w-5 h-5" />
                            <span>Your Organization's UPI Details</span>
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="upiDetails.upiId" className="block text-sm font-medium text-gray-700 mb-2">
                                UPI ID *
                              </label>
                              <input
                                type="text"
                                id="upiDetails.upiId"
                                name="upiDetails.upiId"
                                value={formData.upiDetails.upiId}
                                onChange={handleInputChange}
                                className="input-field"
                                placeholder="organization@paytm"
                                required={formData.preferredPaymentMethod === 'UPI' || formData.preferredPaymentMethod === 'BOTH'}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                QR Code Image
                              </label>
                              <div className="space-y-2">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleQrCodeUpload}
                                  className="input-field"
                                />
                                <p className="text-xs text-gray-500">
                                  Upload your organization's UPI QR code (PNG, JPG, max 5MB)
                                </p>
                              </div>
                            </div>

                            {qrCodePreview && (
                              <div className="md:col-span-2">
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-gray-700">QR Code Preview:</p>
                                    <button
                                      type="button"
                                      onClick={removeQrCode}
                                      className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                  <div className="flex justify-center">
                                    <img
                                      src={qrCodePreview}
                                      alt="QR Code Preview"
                                      className="max-w-48 max-h-48 object-contain border border-gray-200 rounded"
                                    />
                                  </div>
                                  <p className="text-xs text-green-600 mt-2 text-center">
                                    ✓ QR Code uploaded successfully
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Regular payment details for outgoing payments */
                    <div>
                      {/* Payment Method Selection */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Preferred Payment Method *
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[
                            { value: 'BANK', label: 'Bank Transfer', icon: BuildingLibraryIcon },
                            { value: 'UPI', label: 'UPI Payment', icon: QrCodeIcon },
                            { value: 'BOTH', label: 'Both Options', icon: CreditCardIcon }
                          ].map((method) => {
                            const Icon = method.icon;
                        return (
                          <button
                            key={method.value}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, preferredPaymentMethod: method.value as any }))}
                            className={`p-4 rounded-lg border text-left transition-all ${
                              formData.preferredPaymentMethod === method.value
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <Icon className="w-6 h-6" />
                              <span className="font-medium">{method.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bank Details */}
                  {(formData.preferredPaymentMethod === 'BANK' || formData.preferredPaymentMethod === 'BOTH') && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center space-x-2">
                        <BuildingLibraryIcon className="w-5 h-5" />
                        <span>Bank Account Details</span>
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="bankDetails.accountHolderName" className="block text-sm font-medium text-gray-700 mb-2">
                            Account Holder Name *
                          </label>
                          <input
                            type="text"
                            id="bankDetails.accountHolderName"
                            name="bankDetails.accountHolderName"
                            value={formData.bankDetails.accountHolderName}
                            onChange={handleInputChange}
                            className="input-field"
                            placeholder="As per bank records"
                            required={formData.preferredPaymentMethod === 'BANK' || formData.preferredPaymentMethod === 'BOTH'}
                          />
                        </div>

                        <div>
                          <label htmlFor="bankDetails.accountNumber" className="block text-sm font-medium text-gray-700 mb-2">
                            Account Number *
                          </label>
                          <input
                            type="text"
                            id="bankDetails.accountNumber"
                            name="bankDetails.accountNumber"
                            value={formData.bankDetails.accountNumber}
                            onChange={handleInputChange}
                            className="input-field"
                            placeholder="1234567890"
                            required={formData.preferredPaymentMethod === 'BANK' || formData.preferredPaymentMethod === 'BOTH'}
                          />
                        </div>

                        <div>
                          <label htmlFor="bankDetails.ifscCode" className="block text-sm font-medium text-gray-700 mb-2">
                            IFSC Code *
                          </label>
                          <input
                            type="text"
                            id="bankDetails.ifscCode"
                            name="bankDetails.ifscCode"
                            value={formData.bankDetails.ifscCode}
                            onChange={handleInputChange}
                            className="input-field"
                            placeholder="SBIN0001234"
                            required={formData.preferredPaymentMethod === 'BANK' || formData.preferredPaymentMethod === 'BOTH'}
                          />
                        </div>

                        <div>
                          <label htmlFor="bankDetails.bankName" className="block text-sm font-medium text-gray-700 mb-2">
                            Bank Name *
                          </label>
                          <input
                            type="text"
                            id="bankDetails.bankName"
                            name="bankDetails.bankName"
                            value={formData.bankDetails.bankName}
                            onChange={handleInputChange}
                            className="input-field"
                            placeholder="State Bank of India"
                            required={formData.preferredPaymentMethod === 'BANK' || formData.preferredPaymentMethod === 'BOTH'}
                          />
                        </div>

                        <div>
                          <label htmlFor="bankDetails.accountType" className="block text-sm font-medium text-gray-700 mb-2">
                            Account Type
                          </label>
                          <select
                            id="bankDetails.accountType"
                            name="bankDetails.accountType"
                            value={formData.bankDetails.accountType}
                            onChange={handleInputChange}
                            className="input-field"
                          >
                            <option value="SAVINGS">Savings</option>
                            <option value="CURRENT">Current</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* UPI Details */}
                  {(formData.preferredPaymentMethod === 'UPI' || formData.preferredPaymentMethod === 'BOTH') && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                      <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center space-x-2">
                        <QrCodeIcon className="w-5 h-5" />
                        <span>UPI Payment Details</span>
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="upiDetails.upiId" className="block text-sm font-medium text-gray-700 mb-2">
                            UPI ID *
                          </label>
                          <input
                            type="text"
                            id="upiDetails.upiId"
                            name="upiDetails.upiId"
                            value={formData.upiDetails.upiId}
                            onChange={handleInputChange}
                            className="input-field"
                            placeholder="user@paytm"
                            required={formData.preferredPaymentMethod === 'UPI' || formData.preferredPaymentMethod === 'BOTH'}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            QR Code Image
                          </label>
                          <div className="space-y-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleQrCodeUpload}
                              className="input-field"
                            />
                            <p className="text-xs text-gray-500">
                              Upload your UPI QR code image (PNG, JPG, max 5MB)
                            </p>
                          </div>
                        </div>

                        {qrCodePreview && (
                          <div className="md:col-span-2">
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-gray-700">QR Code Preview:</p>
                                <button
                                  type="button"
                                  onClick={removeQrCode}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Remove
                                </button>
                              </div>
                              <div className="flex justify-center">
                                <img
                                  src={qrCodePreview}
                                  alt="QR Code Preview"
                                  className="max-w-48 max-h-48 object-contain border border-gray-200 rounded"
                                />
                              </div>
                              <p className="text-xs text-green-600 mt-2 text-center">
                                ✓ QR Code uploaded successfully
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 5: Review & Submit */}
              {currentStep === 5 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Review & Submit</h2>
                  
                  <div className="space-y-6">
                    {/* Request Type Banner */}
                    <div className={`rounded-lg p-4 ${
                      formData.collectionType === 'COLLECT_FROM_EMAIL' 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-blue-50 border border-blue-200'
                    }`}>
                      <h3 className={`font-medium mb-2 ${
                        formData.collectionType === 'COLLECT_FROM_EMAIL' ? 'text-green-900' : 'text-blue-900'
                      }`}>
                        {formData.collectionType === 'COLLECT_FROM_EMAIL' ? '📧 Payment Collection Request' : '💳 Payment Request'}
                      </h3>
                      <p className={`text-sm ${
                        formData.collectionType === 'COLLECT_FROM_EMAIL' ? 'text-green-700' : 'text-blue-700'
                      }`}>
                        {formData.collectionType === 'COLLECT_FROM_EMAIL' 
                          ? `A collection email will be sent to ${formData.collectionEmail} with your organization's payment details.`
                          : 'A payment will be processed to the specified payee after approval.'
                        }
                      </p>
                    </div>

                    {/* Request Summary */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">Request Summary</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Title:</span>
                          <span className="ml-2 font-medium">{formData.title}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Amount:</span>
                          <span className="ml-2 font-medium">{formData.currency} {formData.amount}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Category:</span>
                          <span className="ml-2 font-medium">{formData.category}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Urgency:</span>
                          <span className="ml-2 font-medium">{formData.urgency}</span>
                        </div>
                        {formData.invoiceNumber && (
                          <div>
                            <span className="text-gray-600">Invoice:</span>
                            <span className="ml-2 font-medium">{formData.invoiceNumber}</span>
                          </div>
                        )}
                        {formData.dueDate && (
                          <div>
                            <span className="text-gray-600">Due Date:</span>
                            <span className="ml-2 font-medium">{new Date(formData.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Collection/Payee Information */}
                    <div className={`rounded-lg p-4 ${
                      formData.collectionType === 'COLLECT_FROM_EMAIL' ? 'bg-green-50' : 'bg-blue-50'
                    }`}>
                      <h3 className="font-medium text-gray-900 mb-3">
                        {formData.collectionType === 'COLLECT_FROM_EMAIL' ? 'Collection Information' : 'Payee Information'}
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">
                            {formData.collectionType === 'COLLECT_FROM_EMAIL' ? 'Client Name:' : 'Payee Name:'}
                          </span>
                          <span className="ml-2 font-medium">{formData.payeeName}</span>
                        </div>
                        {formData.collectionType === 'COLLECT_FROM_EMAIL' ? (
                          <div>
                            <span className="text-gray-600">Collection Email:</span>
                            <span className="ml-2 font-medium">{formData.collectionEmail}</span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-gray-600">Payment Method:</span>
                            <span className="ml-2 font-medium">{formData.preferredPaymentMethod}</span>
                          </div>
                        )}
                        {formData.payeeEmail && (
                          <div>
                            <span className="text-gray-600">Email:</span>
                            <span className="ml-2 font-medium">{formData.payeeEmail}</span>
                          </div>
                        )}
                        {formData.payeePhone && (
                          <div>
                            <span className="text-gray-600">Phone:</span>
                            <span className="ml-2 font-medium">{formData.payeePhone}</span>
                          </div>
                        )}
                      </div>
                      {formData.collectionMessage && (
                        <div className="mt-3">
                          <span className="text-gray-600 text-sm">Collection Message:</span>
                          <p className="mt-1 text-sm text-gray-800 bg-white p-2 rounded border">
                            {formData.collectionMessage}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Payment Details Summary */}
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">
                        {formData.collectionType === 'COLLECT_FROM_EMAIL' ? 'Your Organization Payment Details' : 'Payment Details'}
                      </h3>
                      <div className="text-sm">
                        <div className="mb-2">
                          <span className="text-gray-600">Payment Method:</span>
                          <span className="ml-2 font-medium">{formData.preferredPaymentMethod}</span>
                        </div>
                        {(formData.preferredPaymentMethod === 'BANK' || formData.preferredPaymentMethod === 'BOTH') && (
                          <div className="mb-2">
                            <span className="text-gray-600">Bank Account:</span>
                            <span className="ml-2 font-medium">
                              {formData.bankDetails.accountHolderName} - {formData.bankDetails.bankName}
                            </span>
                          </div>
                        )}
                        {(formData.preferredPaymentMethod === 'UPI' || formData.preferredPaymentMethod === 'BOTH') && (
                          <div className="mb-2">
                            <span className="text-gray-600">UPI ID:</span>
                            <span className="ml-2 font-medium">{formData.upiDetails.upiId}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Approval Preview */}
                    {approvalLevels.length > 0 && (
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-3">Approval Process</h3>
                        <p className="text-sm text-yellow-800 mb-3">
                          {formData.collectionType === 'COLLECT_FROM_EMAIL' 
                            ? `Your collection request will go through ${approvalLevels.length} approval steps before the email is sent:`
                            : `Your payment request will go through ${approvalLevels.length} approval steps:`
                          }
                        </p>
                        <div className="space-y-2">
                          {approvalLevels.map((level, index) => (
                            <div key={level.id} className="flex items-center space-x-3 text-sm">
                              <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-yellow-600">{index + 1}</span>
                              </div>
                              <span className="text-yellow-800">
                                {level.levelName} ({level.approverType === 'ROLE' ? level.approverValue.replace('ORG_', '') : 'Specific User'})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6 border-t border-gray-200">
                <div>
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="btn-secondary"
                      disabled={submitting}
                    >
                      Previous
                    </button>
                  )}
                </div>
                
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => router.push('/org/payments')}
                    className="btn-secondary"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  
                  {currentStep < steps.length ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="btn-primary"
                      disabled={submitting}
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={submitting || approvalLevels.length === 0}
                      className="btn-primary"
                    >
                      {submitting ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Submitting...</span>
                        </div>
                      ) : (
                        'Submit Request'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}