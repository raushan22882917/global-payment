'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { getAuthErrorMessage } from '@/lib/auth-utils';
import Link from 'next/link';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle, user, firebaseUser, loading: authLoading } = useAuth();
  const router = useRouter();

  // Load saved credentials on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('rememberedEmail');
      const savedPassword = localStorage.getItem('rememberedPassword');
      const wasRemembered = localStorage.getItem('rememberMe') === 'true';
      
      if (savedEmail) {
        setEmail(savedEmail);
      }
      if (savedPassword && wasRemembered) {
        setPassword(savedPassword);
        setRememberMe(true);
      }
    }
  }, []);

  useEffect(() => {
    console.log('🔄 [LoginPage] Auth state changed:', {
      user: user ? {
        id: user.id,
        email: user.email,
        role: user.role,
        active: user.active,
        isSuperAdmin: user.isSuperAdmin,
        orgId: user.orgId
      } : null,
      authLoading,
      firebaseUser: firebaseUser ? {
        email: firebaseUser.email,
        uid: firebaseUser.uid,
        emailVerified: firebaseUser.emailVerified
      } : null
    });
    
    // Don't redirect while still loading
    if (authLoading) {
      console.log('⏳ [LoginPage] Still loading authentication, waiting...');
      return;
    }
    
    if (user) {
      console.log('✅ [LoginPage] User found, determining redirect...');
      
      // Route based on user role
      if (user.role === 'SUPER_ADMIN' || user.isSuperAdmin) {
        console.log('🎯 [LoginPage] Redirecting super admin to dashboard');
        router.push('/super-admin/dashboard');
      } else if (user.role === 'ORG_USER') {
        if (user.active) {
          console.log('🎯 [LoginPage] Redirecting ORG_USER to simple user dashboard');
          router.push('/org/user-dashboard-simple');
        } else {
          console.log('🎯 [LoginPage] Redirecting inactive ORG_USER to setup status');
          router.push('/setup-status');
        }
      } else if (user.role && user.role.startsWith('ORG_')) {
        if (user.active) {
          console.log('🎯 [LoginPage] Redirecting active org user to dashboard');
          router.push('/org/dashboard');
        } else {
          console.log('🎯 [LoginPage] Redirecting inactive org user to setup status');
          router.push('/setup-status');
        }
      } else {
        console.log('🎯 [LoginPage] Unknown role or inactive user, redirecting to setup status');
        router.push('/setup-status');
      }
    } else {
      console.log('❌ [LoginPage] No user found, staying on login page');
    }
  }, [user, firebaseUser, authLoading, router]);

  const handleGoogleLogin = async (useRedirect = false) => {
    console.log('🎯 [handleGoogleLogin] Starting Google login process, useRedirect:', useRedirect);
    setLoading(true);
    
    try {
      console.log('🔄 [handleGoogleLogin] Calling loginWithGoogle...');
      await loginWithGoogle(useRedirect);
      console.log('✅ [handleGoogleLogin] Login successful');
      toast.success('Login successful');
    } catch (error: any) {
      console.error('❌ [handleGoogleLogin] Login failed:', {
        code: error.code,
        message: error.message,
        name: error.name
      });
      
      const errorMessage = getAuthErrorMessage(error);
      console.log('📝 [handleGoogleLogin] User-friendly error message:', errorMessage);
      toast.error(errorMessage);
    } finally {
      console.log('🏁 [handleGoogleLogin] Setting loading to false');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      
      // Save credentials if remember me is checked
      if (typeof window !== 'undefined') {
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
          localStorage.setItem('rememberedPassword', password);
          localStorage.setItem('rememberMe', 'true');
        } else {
          // Clear saved credentials if remember me is unchecked
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('rememberedPassword');
          localStorage.removeItem('rememberMe');
        }
      }
      
      toast.success('Login successful');
    } catch (error: any) {
      const errorMessage = getAuthErrorMessage(error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Sign In</h2>
          <p className="mt-2 text-sm text-gray-600">
            Organization Management System
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Your account must be created by an administrator first
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
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="admin@company.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10"
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

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  href="/forgot-password"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => {
                  console.log('🎯 Google login button clicked (redirect method)');
                  handleGoogleLogin(true);
                }}
                disabled={loading}
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-3"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? 'Signing in...' : 'Continue with Google (Recommended)'}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  console.log('🎯 Google login button clicked (popup method)');
                  handleGoogleLogin(false);
                }}
                disabled={loading}
                className="w-full text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 py-1"
              >
                Try popup login (may have browser compatibility issues)
              </button>
              
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                <strong>Note:</strong> If you see popup errors, use the recommended redirect login above.
              </div>
            </div>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800">How to Access</h3>
            <div className="mt-2 text-sm text-blue-700 space-y-1">
              <p>• <strong>Existing Users:</strong> Login with your email and password</p>
              <p>• <strong>New Users:</strong> Contact your administrator to create your account</p>
              <p>• <strong>Organizations:</strong> Request setup using the link below</p>
            </div>
          </div>

          <div className="mt-4 text-center space-y-2">
            <p className="text-sm text-gray-600">
              Don't have an organization account?{' '}
              <Link
                href="/request-organization"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Request Organization Setup
              </Link>
            </p>
            <p className="text-sm text-gray-600">
              Need to request a payment?{' '}
              <Link
                href="/request-payment"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Create Payment Request
              </Link>
            </p>
            <p className="text-xs text-gray-500">
              Having issues?{' '}
              <Link
                href="/setup-status"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Check Setup Status
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}