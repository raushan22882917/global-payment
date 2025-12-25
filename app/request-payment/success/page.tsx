'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CheckCircleIcon,
  QrCodeIcon,
  BuildingLibraryIcon,
  DocumentDuplicateIcon,
  ShareIcon,
  ArrowLeftIcon,
  BanknotesIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { getPaymentRequest } from '@/lib/database';
import toast from 'react-hot-toast';

interface PaymentRequest {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  payeeDetails?: {
    name: string;
    email?: string;
    phone?: string;
  };
  bankDetails?: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    accountHolderName: string;
    accountType: string;
  };
  upiDetails?: {
    upiId: string;
    qrCodeImage?: string;
  };
  preferredPaymentMethod?: 'BANK' | 'UPI' | 'BOTH';
  invoiceNumber?: string;
  dueDate?: Date;
  notes?: string;
  requestedAt: Date;
}

function PaymentRequestSuccessContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get('id');
  
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (requestId && user) {
      fetchPaymentRequest();
    }
  }, [requestId, user]);

  const fetchPaymentRequest = async () => {
    if (!requestId) return;
    
    try {
      const request = await getPaymentRequest(requestId);
      setPaymentRequest(request);
      
      // Generate UPI QR if UPI details exist
      if (request?.upiDetails?.upiId) {
        generateUPIQR(request);
      }
    } catch (error) {
      console.error('Failed to fetch payment request:', error);
      toast.error('Failed to load payment request details');
    } finally {
      setDataLoading(false);
    }
  };

  const generateUPIQR = (request: PaymentRequest) => {
    if (!request.upiDetails?.upiId) return;

    // Generate UPI payment URL
    const upiUrl = `upi://pay?pa=${request.upiDetails.upiId}&pn=${encodeURIComponent(request.payeeDetails?.name || 'Payment')}&am=${request.amount}&cu=${request.currency}&tn=${encodeURIComponent(request.title)}`;
    
    // Generate QR code URL
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUrl)}`;
    
    setGeneratedQR(qrCodeUrl);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied to clipboard!`);
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  };

  const sharePaymentRequest = async () => {
    if (!paymentRequest) return;

    const shareText = `Payment Request: ${paymentRequest.title}
Amount: ${paymentRequest.currency} ${paymentRequest.amount}
${paymentRequest.description ? `Description: ${paymentRequest.description}` : ''}

Payment Options:
${paymentRequest.upiDetails ? `UPI ID: ${paymentRequest.upiDetails.upiId}` : ''}
${paymentRequest.bankDetails ? `
Bank: ${paymentRequest.bankDetails.bankName}
Account: ${paymentRequest.bankDetails.accountNumber}
IFSC: ${paymentRequest.bankDetails.ifscCode}
Account Holder: ${paymentRequest.bankDetails.accountHolderName}` : ''}

${paymentRequest.notes ? `Notes: ${paymentRequest.notes}` : ''}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Payment Request - ${paymentRequest.title}`,
          text: shareText,
        });
      } catch (error) {
        // Fallback to clipboard
        copyToClipboard(shareText, 'Payment request details');
      }
    } else {
      copyToClipboard(shareText, 'Payment request details');
    }
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user || !paymentRequest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Request Not Found</h2>
          <p className="text-gray-600 mb-6">The payment request you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
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
                <h1 className="text-2xl font-bold text-gray-900">Payment Request Created</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Your payment request is ready to share
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="w-6 h-6 text-green-500" />
              <span className="text-sm font-medium text-green-600">
                Successfully Created
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        <div className="bg-green-50 rounded-xl border border-green-200 p-6 mb-8">
          <div className="flex items-center space-x-3">
            <CheckCircleIcon className="w-8 h-8 text-green-500" />
            <div>
              <h2 className="text-lg font-semibold text-green-900">Payment Request Created Successfully!</h2>
              <p className="text-green-700 mt-1">
                You can now share your payment details with others. They can pay you using the methods below.
              </p>
            </div>
          </div>
        </div>

        {/* Request Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Payment Request Details</h2>
            <button
              onClick={sharePaymentRequest}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ShareIcon className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">{paymentRequest.title}</h3>
              <p className="text-2xl font-bold text-blue-600 mb-2">
                {paymentRequest.currency} {paymentRequest.amount.toLocaleString()}
              </p>
              {paymentRequest.description && (
                <p className="text-gray-600 text-sm mb-4">{paymentRequest.description}</p>
              )}
              
              <div className="space-y-2 text-sm">
                {paymentRequest.invoiceNumber && (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">Invoice:</span>
                    <span className="font-medium">{paymentRequest.invoiceNumber}</span>
                  </div>
                )}
                {paymentRequest.dueDate && (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">Due Date:</span>
                    <span className="font-medium">{new Date(paymentRequest.dueDate).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">Created:</span>
                  <span className="font-medium">{new Date(paymentRequest.requestedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3">Payee Information</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <UserIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{paymentRequest.payeeDetails?.name || 'N/A'}</span>
                </div>
                {paymentRequest.payeeDetails?.email && (
                  <div className="flex items-center space-x-2">
                    <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{paymentRequest.payeeDetails.email}</span>
                  </div>
                )}
                {paymentRequest.payeeDetails?.phone && (
                  <div className="flex items-center space-x-2">
                    <PhoneIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{paymentRequest.payeeDetails.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {paymentRequest.notes && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Additional Notes</h4>
              <p className="text-gray-700 text-sm">{paymentRequest.notes}</p>
            </div>
          )}
        </div>

        {/* Payment Methods */}
        <div className="space-y-6">
          {/* UPI Payment */}
          {((paymentRequest.preferredPaymentMethod === 'UPI' || paymentRequest.preferredPaymentMethod === 'BOTH') && paymentRequest.upiDetails) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <QrCodeIcon className="w-6 h-6 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900">UPI Payment</h2>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">UPI Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">UPI ID</p>
                        <p className="font-medium">{paymentRequest.upiDetails.upiId}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(paymentRequest.upiDetails!.upiId, 'UPI ID')}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                      >
                        <DocumentDuplicateIcon className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>How to pay:</strong> Open any UPI app (Google Pay, PhonePe, Paytm, etc.), 
                        scan the QR code or enter the UPI ID above, and send ₹{paymentRequest.amount.toLocaleString()}.
                      </p>
                    </div>
                  </div>
                </div>

                {generatedQR && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">QR Code</h3>
                    <div className="bg-gray-50 p-6 rounded-lg text-center">
                      <img
                        src={generatedQR}
                        alt="UPI QR Code"
                        className="mx-auto mb-4 border border-gray-200 rounded"
                      />
                      <p className="text-sm text-gray-600">
                        Scan with any UPI app to pay instantly
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bank Transfer */}
          {((paymentRequest.preferredPaymentMethod === 'BANK' || paymentRequest.preferredPaymentMethod === 'BOTH') && paymentRequest.bankDetails) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <BuildingLibraryIcon className="w-6 h-6 text-green-500" />
                <h2 className="text-lg font-semibold text-gray-900">Bank Transfer</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Account Holder</p>
                    <p className="font-medium">{paymentRequest.bankDetails.accountHolderName}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(paymentRequest.bankDetails!.accountHolderName, 'Account Holder Name')}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                  >
                    <DocumentDuplicateIcon className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Account Number</p>
                    <p className="font-medium">{paymentRequest.bankDetails.accountNumber}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(paymentRequest.bankDetails!.accountNumber, 'Account Number')}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                  >
                    <DocumentDuplicateIcon className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">IFSC Code</p>
                    <p className="font-medium">{paymentRequest.bankDetails.ifscCode}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(paymentRequest.bankDetails!.ifscCode, 'IFSC Code')}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                  >
                    <DocumentDuplicateIcon className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Bank Name</p>
                    <p className="font-medium">{paymentRequest.bankDetails.bankName}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(paymentRequest.bankDetails!.bankName, 'Bank Name')}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                  >
                    <DocumentDuplicateIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>How to pay:</strong> Use these bank details to transfer ₹{paymentRequest.amount.toLocaleString()} 
                  via NEFT, RTGS, IMPS, or any banking app. Please mention "{paymentRequest.title}" as the transfer reference.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mt-8">
          <button
            onClick={() => router.push('/request-payment')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Create Another Request
          </button>
          
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}

export default function PaymentRequestSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    }>
      <PaymentRequestSuccessContent />
    </Suspense>
  );
}