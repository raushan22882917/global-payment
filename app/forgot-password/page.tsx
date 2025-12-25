'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getAuthErrorMessage } from '@/lib/auth-utils';
import { 
  EnvelopeIcon, 
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    
    try {
      await resetPassword(email.trim());
      setEmailSent(true);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error: any) {
      const errorMessage = getAuthErrorMessage(error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900">Check Your Email</h2>
            <p className="mt-2 text-sm text-gray-600">
              Password reset instructions sent
            </p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="card">
            <div className="text-center space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  We've sent password reset instructions to:
                </p>
                <p className="font-medium text-green-900 mt-1">{email}</p>
              </div>
              
              <div className="text-sm text-gray-600 space-y-2">
                <p>Please check your email and follow the instructions to reset your password.</p>
                <p>If you don't see the email, check your spam folder.</p>
              </div>

              <div className="pt-4 space-y-3">
                <button
                  onClick={() => {
                    setEmailSent(false);
                    setEmail('');
                  }}
                  className="w-full btn-secondary"
                >
                  Send Another Email
                </button>
                
                <Link
                  href="/"
                  className="w-full btn-primary text-center block"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Reset Password</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email to receive reset instructions
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Enter your email address"
                />
                <EnvelopeIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Sending...</span>
                  </div>
                ) : (
                  'Send Reset Instructions'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Important Notes:</p>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>Reset link expires in 1 hour</li>
                    <li>Check your spam folder if email doesn't arrive</li>
                    <li>You can only reset password for existing accounts</li>
                    <li>Contact admin if you need account creation</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-1" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}