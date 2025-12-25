import Link from 'next/link';
import { CheckCircleIcon, ClockIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

export default function RequestSuccess() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
            <CheckCircleIcon className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Request Submitted Successfully! 🎉</h2>
          <p className="mt-3 text-gray-600">
            Your organization setup request has been received and our auto-reply system is activated.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="card">
          {/* Auto-Reply Status */}
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <EnvelopeIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-green-900">Auto-Reply Active</h3>
                <p className="text-xs text-green-700">
                  Confirmation email will be sent within 10 minutes
                </p>
              </div>
            </div>
          </div>

          <div className="text-center space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">What Happens Next?</h3>
            
            <div className="space-y-4 text-left">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <EnvelopeIcon className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Instant Confirmation</h4>
                  <p className="text-sm text-gray-600">
                    You'll receive an auto-reply email within <strong>10 minutes</strong> with your request details
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <ClockIcon className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Admin Review</h4>
                  <p className="text-sm text-gray-600">
                    Our super admin team will review and process your request
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Account Setup</h4>
                  <p className="text-sm text-gray-600">
                    Your organization and admin account will be created within <strong>24 hours</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">100%</div>
                <div className="text-xs text-gray-500">Delivery Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">~10min</div>
                <div className="text-xs text-gray-500">Response Time</div>
              </div>
            </div>

            <div className="pt-4">
              <Link
                href="/"
                className="btn-primary w-full"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>

        {/* Support Info */}
        <div className="mt-6 card bg-gray-50">
          <div className="text-center">
            <h4 className="font-medium text-gray-900 mb-2">Need Immediate Help?</h4>
            <p className="text-sm text-gray-600 mb-3">
              Our auto-reply system ensures no request goes unnoticed:
            </p>
            <a 
              href="mailto:support@yourcompany.com" 
              className="text-primary-600 hover:text-primary-500 font-medium text-sm"
            >
              📧 support@yourcompany.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}