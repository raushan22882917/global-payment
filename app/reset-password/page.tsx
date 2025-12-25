'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
  EyeIcon, 
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [validCode, setValidCode] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get('oobCode');
  const mode = searchParams.get('mode');

  useEffect(() => {
    const verifyResetCode = async () => {
      if (!oobCode || mode !== 'resetPassword') {
        toast.error('Invalid or expired reset link');
        router.push('/forgot-password');
        return;
      }

      try {
        // Verify the password reset code and get the user's email
        const email = await verifyPasswordResetCode(auth, oobCode);
        setUserEmail(email);
        setValidCode(true);
      } catch (error: any) {
        console.error('Error verifying reset code:', error);
        
        if (error.code === 'auth/expired-action-code') {
          toast.error('Reset link has expired. Please request a new one.');
        } else if (error.code === 'auth/invalid-action-code') {
          toast.error('Invalid reset link. Please request a new one.');
        } else {
          toast.error('Error verifying reset link. Please try again.');
        }
        
        router.push('/forgot-password');
      } finally {
        setVerifying(false);
      }
    };

    verifyResetCode();
  }, [oobCode, mode, router]);

  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    if (password.length > 128) {
      return 'Password must be less than 128 characters';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    const passwordError = validatePassword(password);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!oobCode) {
      toast.error('Invalid reset code');
      return;
    }

    setLoading(true);
    
    try {
      // Confirm the password reset
      await confirmPasswordReset(auth, oobCode, password);
      setResetComplete(true);
      toast.success('Password reset successfully!');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      
      if (error.code === 'auth/expired-action-code') {
        toast.error('Reset link has expired. Please request a new one.');
        router.push('/forgot-password');
      } else if (error.code === 'auth/invalid-action-code') {
        toast.error('Invalid reset link. Please request a new one.');
        router.push('/forgot-password');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password is too weak. Please choose a stronger password.');
      } else {
        toast.error('Failed to reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900">Verifying Reset Link</h2>
            <p className="mt-2 text-sm text-gray-600">
              Please wait while we verify your password reset link...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (resetComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900">Password Reset Complete</h2>
            <p className="mt-2 text-sm text-gray-600">
              Your password has been successfully updated
            </p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="card">
            <div className="text-center space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  Password updated for:
                </p>
                <p className="font-medium text-green-900 mt-1">{userEmail}</p>
              </div>
              
              <div className="text-sm text-gray-600">
                <p>You can now sign in with your new password.</p>
              </div>

              <div className="pt-4">
                <Link
                  href="/"
                  className="w-full btn-primary text-center block"
                >
                  Sign In Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!validCode) {
    return null; // Will redirect to forgot-password
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Set New Password</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your new password for {userEmail}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
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
                    <span>Updating Password...</span>
                  </div>
                ) : (
                  'Update Password'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Password Requirements:</p>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>At least 6 characters long</li>
                    <li>Less than 128 characters</li>
                    <li>Both passwords must match</li>
                    <li>Consider using a mix of letters, numbers, and symbols</li>
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}