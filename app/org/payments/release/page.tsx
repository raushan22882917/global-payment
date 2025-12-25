'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import OrganizationSidebar from '@/components/OrganizationSidebar';
import RoleGuard from '@/components/RoleGuard';
import {
  BanknotesIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  CreditCardIcon,
  QrCodeIcon,
  BuildingLibraryIcon,
  DocumentTextIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  DocumentDuplicateIcon,
  ShareIcon,
  ArrowTopRightOnSquareIcon,
  PaperAirplaneIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { getPaymentRequestsByOrg, updatePaymentRequest, getUser } from '@/lib/database';
import { PaymentRequest } from '@/lib/database';
import toast from 'react-hot-toast';

export default function PaymentReleasePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'APPROVED' | 'PENDING'>('APPROVED');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'BANK' | 'UPI' | null>(null);
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);
  const [paymentNotes, setPaymentNotes] = useState('');

  useEffect(() => {
    if (!loading && (!user || !user.role.startsWith('ORG_'))) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.orgId) {
      fetchPaymentRequests();
    }
  }, [user, filter]);

  const fetchPaymentRequests = async () => {
    if (!user?.orgId) return;
    
    try {
      const requests = await getPaymentRequestsByOrg(user.orgId);
      
      // Filter based on selected filter
      let filteredRequests = requests;
      if (filter === 'APPROVED') {
        filteredRequests = requests.filter(req => req.status === 'APPROVED');
      } else if (filter === 'PENDING') {
        filteredRequests = requests.filter(req => req.status === 'PENDING');
      }
      
      setPaymentRequests(filteredRequests || []);
    } catch (error) {
      console.error('Failed to fetch payment requests:', error);
      setPaymentRequests([]);
    } finally {
      setDataLoading(false);
    }
  };

  const handleProcessPayment = async (requestId: string, action: 'PAID' | 'REJECTED') => {
    setProcessing(requestId);
    try {
      await updatePaymentRequest(requestId, {
        status: action,
        metadata: {
          processedBy: user?.id,
          processedAt: new Date(),
          processedVia: 'finance_release_page',
          paymentMethod: paymentMethod || undefined,
          paymentNotes: paymentNotes || undefined
        }
      });

      toast.success(`Payment ${action.toLowerCase()} successfully!`);
      await fetchPaymentRequests();
      setSelectedRequest(null);
      setShowPaymentModal(false);
      setPaymentMethod(null);
      setPaymentNotes('');
    } catch (error) {
      console.error('Failed to process payment:', error);
      toast.error('Failed to process payment');
    } finally {
      setProcessing(null);
    }
  };

  const generateUPIQR = (request: PaymentRequest) => {
    if (!request.upiDetails?.upiId) return;

    // Generate UPI payment URL
    const upiUrl = `upi://pay?pa=${request.upiDetails.upiId}&pn=${encodeURIComponent(request.payeeDetails?.name || 'Payment')}&am=${request.amount}&cu=${request.currency}&tn=${encodeURIComponent(request.title)}`;
    
    // Generate QR code URL
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUrl)}`;
    
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

  const openBankingApp = (request: PaymentRequest) => {
    if (!request.bankDetails) return;
    
    // Create a formatted string for easy copying
    const bankDetails = `
Bank Transfer Details:
Account Holder: ${request.bankDetails.accountHolderName}
Account Number: ${request.bankDetails.accountNumber}
IFSC Code: ${request.bankDetails.ifscCode}
Bank Name: ${request.bankDetails.bankName}
Amount: ${request.currency} ${request.amount.toLocaleString()}
Reference: ${request.title} - ${request.invoiceNumber || request.id}
    `.trim();
    
    copyToClipboard(bankDetails, 'Bank transfer details');
  };

  const openUPIApp = (request: PaymentRequest) => {
    if (!request.upiDetails?.upiId) return;
    
    // Generate UPI URL and try to open it
    const upiUrl = `upi://pay?pa=${request.upiDetails.upiId}&pn=${encodeURIComponent(request.payeeDetails?.name || 'Payment')}&am=${request.amount}&cu=${request.currency}&tn=${encodeURIComponent(request.title)}`;
    
    // Try to open UPI app
    window.open(upiUrl, '_blank');
    
    // Also copy UPI ID for manual entry
    copyToClipboard(request.upiDetails.upiId, 'UPI ID');
  };

  const initiatePayment = (request: PaymentRequest, method: 'BANK' | 'UPI') => {
    setSelectedRequest(request);
    setPaymentMethod(method);
    setShowPaymentModal(true);
    
    if (method === 'UPI' && request.upiDetails?.upiId) {
      generateUPIQR(request);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'text-green-600 bg-green-100';
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'PAID': return 'text-blue-600 bg-blue-100';
      case 'REJECTED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'HIGH': return 'text-red-600 bg-red-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
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

  return (
    <RoleGuard 
      allowedRoles={['ORG_ADMIN', 'ORG_FINANCE']}
      fallbackMessage="You need Organization Admin or Finance role to access payment release."
    >
      <div className="min-h-screen bg-gray-50">
        <OrganizationSidebar />
        
        <div className="lg:pl-72">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Payment Release Center</h1>
                  <p className="mt-1 text-sm text-gray-600">
                    Process approved payments and manage payment releases
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  {/* Filter Buttons */}
                  <div className="flex items-center space-x-2">
                    {[
                      { key: 'APPROVED', label: 'Ready to Pay', icon: CheckCircleIcon },
                      { key: 'PENDING', label: 'Pending', icon: ClockIcon },
                      { key: 'ALL', label: 'All Requests', icon: DocumentTextIcon }
                    ].map((filterOption) => {
                      const Icon = filterOption.icon;
                      return (
                        <button
                          key={filterOption.key}
                          onClick={() => setFilter(filterOption.key as any)}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            filter === filterOption.key
                              ? 'bg-blue-100 text-blue-700'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{filterOption.label}</span>
                        </button>
                      );
                    })}
                  </div>
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
                    <p className="text-sm font-medium text-gray-600">Ready to Pay</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      {paymentRequests.filter(req => req.status === 'APPROVED').length}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500">
                    <CheckCircleIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Amount</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">
                      ${paymentRequests
                        .filter(req => req.status === 'APPROVED')
                        .reduce((sum, req) => sum + req.amount, 0)
                        .toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500">
                    <BanknotesIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">High Priority</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">
                      {paymentRequests.filter(req => req.urgency === 'HIGH' && req.status === 'APPROVED').length}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-500">
                    <ExclamationTriangleIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Processed Today</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">
                      {paymentRequests.filter(req => req.status === 'PAID').length}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-500">
                    <CreditCardIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Requests Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Payment Requests ({paymentRequests.length})
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Request Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paymentRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{request.title}</div>
                            <div className="text-sm text-gray-500">{request.category}</div>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(request.urgency)}`}>
                                {request.urgency}
                              </span>
                              {request.invoiceNumber && (
                                <span className="text-xs text-gray-500">#{request.invoiceNumber}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {request.payeeDetails?.name || 'N/A'}
                            </div>
                            {request.payeeDetails?.email && (
                              <div className="text-sm text-gray-500">{request.payeeDetails.email}</div>
                            )}
                            {request.payeeDetails?.phone && (
                              <div className="text-sm text-gray-500">{request.payeeDetails.phone}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {request.currency} {request.amount.toLocaleString()}
                          </div>
                          {request.taxDetails && request.taxDetails.taxAmount && (
                            <div className="text-xs text-gray-500">
                              +{request.taxDetails.taxType}: {request.currency} {request.taxDetails.taxAmount.toLocaleString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {request.preferredPaymentMethod === 'BANK' && (
                              <BuildingLibraryIcon className="w-4 h-4 text-blue-500" />
                            )}
                            {request.preferredPaymentMethod === 'UPI' && (
                              <QrCodeIcon className="w-4 h-4 text-green-500" />
                            )}
                            {request.preferredPaymentMethod === 'BOTH' && (
                              <CreditCardIcon className="w-4 h-4 text-purple-500" />
                            )}
                            <span className="text-sm text-gray-900">
                              {request.preferredPaymentMethod || 'Not specified'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setSelectedRequest(request)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                              title="View Details"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            {request.status === 'APPROVED' && (
                              <>
                                {/* Bank Transfer Button */}
                                {(request.preferredPaymentMethod === 'BANK' || request.preferredPaymentMethod === 'BOTH') && request.bankDetails && (
                                  <button
                                    onClick={() => initiatePayment(request, 'BANK')}
                                    className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                                    title="Bank Transfer"
                                  >
                                    <BuildingLibraryIcon className="w-4 h-4" />
                                  </button>
                                )}
                                
                                {/* UPI Payment Button */}
                                {(request.preferredPaymentMethod === 'UPI' || request.preferredPaymentMethod === 'BOTH') && request.upiDetails && (
                                  <button
                                    onClick={() => initiatePayment(request, 'UPI')}
                                    className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50"
                                    title="UPI Payment"
                                  >
                                    <QrCodeIcon className="w-4 h-4" />
                                  </button>
                                )}
                                
                                {/* Quick Mark as Paid */}
                                <button
                                  onClick={() => handleProcessPayment(request.id, 'PAID')}
                                  disabled={processing === request.id}
                                  className="text-blue-600 hover:text-blue-900 disabled:opacity-50 p-1 rounded hover:bg-blue-50"
                                  title="Mark as Paid"
                                >
                                  {processing === request.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                  ) : (
                                    <CheckCircleIcon className="w-4 h-4" />
                                  )}
                                </button>
                                
                                {/* Reject Payment */}
                                <button
                                  onClick={() => handleProcessPayment(request.id, 'REJECTED')}
                                  disabled={processing === request.id}
                                  className="text-red-600 hover:text-red-900 disabled:opacity-50 p-1 rounded hover:bg-red-50"
                                  title="Reject Payment"
                                >
                                  <XMarkIcon className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {paymentRequests.length === 0 && (
                  <div className="text-center py-12">
                    <BanknotesIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment Requests</h3>
                    <p className="text-gray-600">
                      {filter === 'APPROVED' 
                        ? 'No approved payments ready for release.' 
                        : 'No payment requests found for the selected filter.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>

        {/* Enhanced Payment Processing Modal */}
        {showPaymentModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {paymentMethod === 'BANK' && <BuildingLibraryIcon className="w-6 h-6 text-green-600" />}
                  {paymentMethod === 'UPI' && <QrCodeIcon className="w-6 h-6 text-purple-600" />}
                  <h3 className="text-lg font-semibold text-gray-900">
                    {paymentMethod === 'BANK' ? 'Bank Transfer Payment' : 'UPI Payment'}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentMethod(null);
                    setGeneratedQR(null);
                    setPaymentNotes('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                {/* Payment Summary */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Payment Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Payee:</span>
                      <span className="ml-2 font-medium">{selectedRequest.payeeDetails?.name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Amount:</span>
                      <span className="ml-2 font-medium text-lg text-blue-600">
                        {selectedRequest.currency} {selectedRequest.amount.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Reference:</span>
                      <span className="ml-2 font-medium">{selectedRequest.title}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Invoice:</span>
                      <span className="ml-2 font-medium">{selectedRequest.invoiceNumber || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Bank Transfer Interface */}
                {paymentMethod === 'BANK' && selectedRequest.bankDetails && (
                  <div className="space-y-6">
                    <div className="bg-green-50 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-green-900">Bank Account Details</h4>
                        <button
                          onClick={() => openBankingApp(selectedRequest)}
                          className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          <DocumentDuplicateIcon className="w-4 h-4" />
                          <span>Copy Details</span>
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-white rounded border">
                            <div>
                              <p className="text-sm text-gray-600">Account Holder</p>
                              <p className="font-medium">{selectedRequest.bankDetails.accountHolderName}</p>
                            </div>
                            <button
                              onClick={() => copyToClipboard(selectedRequest.bankDetails!.accountHolderName, 'Account holder name')}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <DocumentDuplicateIcon className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-white rounded border">
                            <div>
                              <p className="text-sm text-gray-600">Account Number</p>
                              <p className="font-medium">{selectedRequest.bankDetails.accountNumber}</p>
                            </div>
                            <button
                              onClick={() => copyToClipboard(selectedRequest.bankDetails!.accountNumber, 'Account number')}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <DocumentDuplicateIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-white rounded border">
                            <div>
                              <p className="text-sm text-gray-600">IFSC Code</p>
                              <p className="font-medium">{selectedRequest.bankDetails.ifscCode}</p>
                            </div>
                            <button
                              onClick={() => copyToClipboard(selectedRequest.bankDetails!.ifscCode, 'IFSC code')}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <DocumentDuplicateIcon className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-white rounded border">
                            <div>
                              <p className="text-sm text-gray-600">Bank Name</p>
                              <p className="font-medium">{selectedRequest.bankDetails.bankName}</p>
                            </div>
                            <button
                              onClick={() => copyToClipboard(selectedRequest.bankDetails!.bankName, 'Bank name')}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <DocumentDuplicateIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-green-100 rounded">
                        <p className="text-sm text-green-800">
                          <strong>Instructions:</strong> Use these details to transfer {selectedRequest.currency} {selectedRequest.amount.toLocaleString()} 
                          via NEFT, RTGS, IMPS, or your banking app. Use "{selectedRequest.title}" as the transfer reference.
                        </p>
                      </div>

                      <div className="mt-4 flex space-x-3">
                        <button
                          onClick={() => window.open('https://netbanking.hdfcbank.com', '_blank')}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Open HDFC NetBanking
                        </button>
                        <button
                          onClick={() => window.open('https://retail.onlinesbi.com', '_blank')}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Open SBI NetBanking
                        </button>
                        <button
                          onClick={() => window.open('https://www.icicibank.com/personal-banking/insta-banking/internet-banking', '_blank')}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Open ICICI NetBanking
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* UPI Payment Interface */}
                {paymentMethod === 'UPI' && selectedRequest.upiDetails && (
                  <div className="space-y-6">
                    <div className="bg-purple-50 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-purple-900">UPI Payment Details</h4>
                        <button
                          onClick={() => openUPIApp(selectedRequest)}
                          className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                          <span>Open UPI App</span>
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-white rounded border">
                            <div>
                              <p className="text-sm text-gray-600">UPI ID</p>
                              <p className="font-medium">{selectedRequest.upiDetails.upiId}</p>
                            </div>
                            <button
                              onClick={() => copyToClipboard(selectedRequest.upiDetails!.upiId, 'UPI ID')}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <DocumentDuplicateIcon className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="p-3 bg-purple-100 rounded">
                            <p className="text-sm text-purple-800">
                              <strong>Quick Payment:</strong> Open any UPI app (Google Pay, PhonePe, Paytm, etc.), 
                              scan the QR code or enter the UPI ID, and send {selectedRequest.currency} {selectedRequest.amount.toLocaleString()}.
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => window.open('https://pay.google.com', '_blank')}
                              className="flex items-center justify-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              <span className="text-sm">Google Pay</span>
                            </button>
                            <button
                              onClick={() => window.open('https://www.phonepe.com', '_blank')}
                              className="flex items-center justify-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              <span className="text-sm">PhonePe</span>
                            </button>
                            <button
                              onClick={() => window.open('https://paytm.com', '_blank')}
                              className="flex items-center justify-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              <span className="text-sm">Paytm</span>
                            </button>
                            <button
                              onClick={() => window.open('https://www.bhimupi.org.in', '_blank')}
                              className="flex items-center justify-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              <span className="text-sm">BHIM</span>
                            </button>
                          </div>
                        </div>

                        {generatedQR && (
                          <div className="flex flex-col items-center">
                            <h5 className="font-medium text-gray-900 mb-3">Scan QR Code</h5>
                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                              <img
                                src={generatedQR}
                                alt="UPI QR Code"
                                className="w-48 h-48 object-contain"
                              />
                            </div>
                            <p className="text-sm text-gray-600 mt-2 text-center">
                              Scan with any UPI app to pay instantly
                            </p>
                            <button
                              onClick={() => copyToClipboard(generatedQR, 'QR code link')}
                              className="mt-2 text-sm text-purple-600 hover:text-purple-800"
                            >
                              Copy QR Code Link
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Notes */}
                <div className="mt-6">
                  <label htmlFor="paymentNotes" className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Notes (Optional)
                  </label>
                  <textarea
                    id="paymentNotes"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add any notes about this payment..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-6 border-t border-gray-200 mt-6">
                  <button
                    onClick={() => {
                      setShowPaymentModal(false);
                      setPaymentMethod(null);
                      setGeneratedQR(null);
                      setPaymentNotes('');
                    }}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleProcessPayment(selectedRequest.id, 'REJECTED')}
                      disabled={processing === selectedRequest.id}
                      className="px-4 py-2 text-red-700 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50"
                    >
                      Reject Payment
                    </button>
                    <button
                      onClick={() => handleProcessPayment(selectedRequest.id, 'PAID')}
                      disabled={processing === selectedRequest.id}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                    >
                      {processing === selectedRequest.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="w-4 h-4" />
                          <span>Mark as Paid</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Payment Details Modal */}
        {selectedRequest && !showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Payment Request Details</h3>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Request Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Request Details</h4>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Title:</span>
                          <span className="text-sm font-medium">{selectedRequest.title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Amount:</span>
                          <span className="text-sm font-medium">{selectedRequest.currency} {selectedRequest.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Category:</span>
                          <span className="text-sm font-medium">{selectedRequest.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Urgency:</span>
                          <span className={`text-sm font-medium px-2 py-1 rounded-full ${getUrgencyColor(selectedRequest.urgency)}`}>
                            {selectedRequest.urgency}
                          </span>
                        </div>
                        {selectedRequest.invoiceNumber && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Invoice:</span>
                            <span className="text-sm font-medium">{selectedRequest.invoiceNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedRequest.description && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-900">{selectedRequest.description}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {/* Payee Information */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Payee Information</h4>
                      <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Name:</span>
                          <span className="text-sm font-medium">{selectedRequest.payeeDetails?.name || 'N/A'}</span>
                        </div>
                        {selectedRequest.payeeDetails?.email && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Email:</span>
                            <span className="text-sm font-medium">{selectedRequest.payeeDetails.email}</span>
                          </div>
                        )}
                        {selectedRequest.payeeDetails?.phone && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Phone:</span>
                            <span className="text-sm font-medium">{selectedRequest.payeeDetails.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tax Information */}
                    {selectedRequest.taxDetails && selectedRequest.taxDetails.taxType !== 'NONE' && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Tax Information</h4>
                        <div className="bg-yellow-50 rounded-lg p-4 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Tax Type:</span>
                            <span className="text-sm font-medium">{selectedRequest.taxDetails.taxType}</span>
                          </div>
                          {selectedRequest.taxDetails.gstNumber && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">GST Number:</span>
                              <span className="text-sm font-medium">{selectedRequest.taxDetails.gstNumber}</span>
                            </div>
                          )}
                          {selectedRequest.taxDetails.panNumber && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">PAN Number:</span>
                              <span className="text-sm font-medium">{selectedRequest.taxDetails.panNumber}</span>
                            </div>
                          )}
                          {selectedRequest.taxDetails.taxAmount && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Tax Amount:</span>
                              <span className="text-sm font-medium">{selectedRequest.currency} {selectedRequest.taxDetails.taxAmount.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Methods */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Payment Methods</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Bank Details */}
                    {selectedRequest.bankDetails && (
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <BuildingLibraryIcon className="w-5 h-5 text-green-600" />
                          <h5 className="font-medium text-green-900">Bank Transfer</h5>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Account Holder:</span>
                            <span className="font-medium">{selectedRequest.bankDetails.accountHolderName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Account Number:</span>
                            <span className="font-medium">{selectedRequest.bankDetails.accountNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">IFSC Code:</span>
                            <span className="font-medium">{selectedRequest.bankDetails.ifscCode}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Bank Name:</span>
                            <span className="font-medium">{selectedRequest.bankDetails.bankName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Account Type:</span>
                            <span className="font-medium">{selectedRequest.bankDetails.accountType}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* UPI Details */}
                    {selectedRequest.upiDetails && (
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <QrCodeIcon className="w-5 h-5 text-purple-600" />
                          <h5 className="font-medium text-purple-900">UPI Payment</h5>
                        </div>
                        <div className="space-y-2 text-sm">
                          {selectedRequest.upiDetails.upiId && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">UPI ID:</span>
                              <span className="font-medium">{selectedRequest.upiDetails.upiId}</span>
                            </div>
                          )}
                          {selectedRequest.upiDetails.qrCodeImage && (
                            <div>
                              <span className="text-gray-600">QR Code:</span>
                              <div className="mt-2 flex justify-center">
                                <div className="bg-white p-2 rounded border">
                                  <p className="text-xs text-gray-500 mb-2">QR Code uploaded by requester</p>
                                  <div className="w-32 h-32 bg-gray-100 rounded flex items-center justify-center">
                                    <QrCodeIcon className="w-8 h-8 text-gray-400" />
                                  </div>
                                  <p className="text-xs text-center mt-1">QR Code Available</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {selectedRequest.status === 'APPROVED' && (
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => handleProcessPayment(selectedRequest.id, 'REJECTED')}
                      disabled={processing === selectedRequest.id}
                      className="btn-secondary text-red-600 border-red-300 hover:bg-red-50"
                    >
                      Reject Payment
                    </button>
                    <button
                      onClick={() => handleProcessPayment(selectedRequest.id, 'PAID')}
                      disabled={processing === selectedRequest.id}
                      className="btn-primary"
                    >
                      {processing === selectedRequest.id ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Processing...</span>
                        </div>
                      ) : (
                        'Mark as Paid'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}