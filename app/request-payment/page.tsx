'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  QrCodeIcon,
  CreditCardIcon,
  BuildingLibraryIcon,
  BanknotesIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { createPaymentRequest } from '@/lib/database';
import toast from 'react-hot-toast';

export default function RequestPaymentPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    currency: 'INR',
    // Payee Information (User's own details)
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
    preferredPaymentMethod: 'UPI' as 'BANK' | 'UPI' | 'BOTH',
    // Additional Details
    invoiceNumber: '',
    dueDate: '',
    notes: ''
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [qrCodePreview, setQrCodePreview] = useState<string | null>(null);
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Pre-fill user details if available
    if (user) {
      setFormData(prev => ({
        ...prev,
        payeeName: user.name || '',
        payeeEmail: user.email || ''
      }));
    }
  }, [user]);

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

  const generateUPIQR = () => {
    if (!formData.upiDetails.upiId || !formData.amount) {
      toast.error('Please enter UPI ID and amount first');
      return;
    }

    // Generate UPI payment URL
    const upiUrl = `upi://pay?pa=${formData.upiDetails.upiId}&pn=${encodeURIComponent(formData.payeeName)}&am=${formData.amount}&cu=${formData.currency}&tn=${encodeURIComponent(formData.title || 'Payment Request')}`;
    
    // For demo purposes, we'll create a simple QR code URL
    // In production, you'd use a proper QR code generation library
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;
    
    setGeneratedQR(qrCodeUrl);
    toast.success('UPI QR Code generated!');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied to clipboard!`);
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Enhanced validation
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (!formData.payeeName.trim()) {
      toast.error('Please enter your name');
      return;
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

    setSubmitting(true);
    try {
      // Create payment request data object
      const paymentRequestData: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        category: 'Payment Request',
        urgency: 'MEDIUM',
        status: 'PENDING',
        currentApprovalLevel: 1,
        orgId: user.orgId || 'public',
        requestedBy: user.id,
        attachments: [],
        // Enhanced fields
        payeeDetails: {
          name: formData.payeeName.trim(),
          email: formData.payeeEmail.trim(),
          phone: formData.payeePhone.trim()
        },
        preferredPaymentMethod: formData.preferredPaymentMethod,
        metadata: {
          submittedVia: 'payment-request-page',
          userAgent: navigator.userAgent,
          requestType: 'user-payment-request'
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

      if (formData.notes) {
        paymentRequestData.notes = formData.notes;
      }

      // Create payment request
      const requestId = await createPaymentRequest(paymentRequestData);

      toast.success('Payment request created successfully!');
      router.push(`/request-payment/success?id=${requestId}`);
    } catch (error) {
      console.error('Failed to create payment request:', error);
      toast.error('Failed to create payment request');
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Request Payment</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Create a payment request with QR code, UPI, or bank transfer options
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <BanknotesIcon className="w-6 h-6 text-blue-500" />
              <span className="text-sm font-medium text-gray-600">
                Multiple payment options
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Request Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Payment Request Details</h2>
            
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Freelance Work Payment, Service Fee, etc."
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Provide details about this payment request..."
                />
              </div>
            </div>
          </div>

          {/* Your Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Your Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="payeeName" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  id="payeeName"
                  name="payeeName"
                  value={formData.payeeName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Full name as per bank records"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="payeeEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="payeeEmail"
                  name="payeeEmail"
                  value={formData.payeeEmail}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
              
              <div>
                <label htmlFor="payeePhone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="payeePhone"
                  name="payeePhone"
                  value={formData.payeePhone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Payment Methods</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Payment Options *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { value: 'UPI', label: 'UPI Only', icon: QrCodeIcon, desc: 'Quick UPI payments' },
                  { value: 'BANK', label: 'Bank Transfer', icon: BuildingLibraryIcon, desc: 'Direct bank transfer' },
                  { value: 'BOTH', label: 'Both Options', icon: CreditCardIcon, desc: 'UPI + Bank transfer' }
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
                      <div className="flex items-center space-x-3 mb-2">
                        <Icon className="w-6 h-6" />
                        <span className="font-medium">{method.label}</span>
                      </div>
                      <p className="text-sm text-gray-600">{method.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

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
                      Your UPI ID *
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        id="upiDetails.upiId"
                        name="upiDetails.upiId"
                        value={formData.upiDetails.upiId}
                        onChange={handleInputChange}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="yourname@paytm"
                        required={formData.preferredPaymentMethod === 'UPI' || formData.preferredPaymentMethod === 'BOTH'}
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(formData.upiDetails.upiId, 'UPI ID')}
                        className="px-3 py-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                        disabled={!formData.upiDetails.upiId}
                      >
                        <DocumentDuplicateIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Generate QR Code
                    </label>
                    <button
                      type="button"
                      onClick={generateUPIQR}
                      disabled={!formData.upiDetails.upiId || !formData.amount}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Generate UPI QR
                    </button>
                  </div>

                  {generatedQR && (
                    <div className="md:col-span-2">
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <p className="text-sm font-medium text-gray-700 mb-2">Generated UPI QR Code:</p>
                        <div className="flex justify-center">
                          <img
                            src={generatedQR}
                            alt="Generated UPI QR Code"
                            className="max-w-48 max-h-48 object-contain border border-gray-200 rounded"
                          />
                        </div>
                        <p className="text-xs text-green-600 mt-2 text-center">
                          ✓ Share this QR code for instant UPI payments
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Or Upload Your QR Code
                    </label>
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleQrCodeUpload}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500">
                        Upload your existing UPI QR code image (PNG, JPG, max 5MB)
                      </p>
                    </div>

                    {qrCodePreview && (
                      <div className="mt-4">
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-gray-700">Uploaded QR Code:</p>
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
              </div>
            )}

            {/* Bank Details */}
            {(formData.preferredPaymentMethod === 'BANK' || formData.preferredPaymentMethod === 'BOTH') && (
              <div className="p-4 bg-gray-50 rounded-lg">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="As per bank records"
                      required={formData.preferredPaymentMethod === 'BANK' || formData.preferredPaymentMethod === 'BOTH'}
                    />
                  </div>

                  <div>
                    <label htmlFor="bankDetails.accountNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      Account Number *
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        id="bankDetails.accountNumber"
                        name="bankDetails.accountNumber"
                        value={formData.bankDetails.accountNumber}
                        onChange={handleInputChange}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="1234567890"
                        required={formData.preferredPaymentMethod === 'BANK' || formData.preferredPaymentMethod === 'BOTH'}
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(formData.bankDetails.accountNumber, 'Account Number')}
                        className="px-3 py-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                        disabled={!formData.bankDetails.accountNumber}
                      >
                        <DocumentDuplicateIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="bankDetails.ifscCode" className="block text-sm font-medium text-gray-700 mb-2">
                      IFSC Code *
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        id="bankDetails.ifscCode"
                        name="bankDetails.ifscCode"
                        value={formData.bankDetails.ifscCode}
                        onChange={handleInputChange}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="SBIN0001234"
                        required={formData.preferredPaymentMethod === 'BANK' || formData.preferredPaymentMethod === 'BOTH'}
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(formData.bankDetails.ifscCode, 'IFSC Code')}
                        className="px-3 py-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                        disabled={!formData.bankDetails.ifscCode}
                      >
                        <DocumentDuplicateIcon className="w-4 h-4" />
                      </button>
                    </div>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="SAVINGS">Savings</option>
                      <option value="CURRENT">Current</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Additional Notes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Additional Information</h2>
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes or Special Instructions
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any additional information for the payer..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={submitting}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating Request...</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>Create Payment Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}