'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import OrganizationSidebar from '@/components/OrganizationSidebar';
import RoleGuard from '@/components/RoleGuard';
import ErrorBoundary from '@/components/ErrorBoundary';
import {
  UserPlusIcon,
  EnvelopeIcon,
  UserIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { createUser, getUsersByOrg } from '@/lib/database';
import { User } from '@/types';
import toast from 'react-hot-toast';
import Link from 'next/link';

const roleOptions = [
  {
    value: 'ORG_MEMBER',
    label: 'Member',
    description: 'Basic organization member with standard permissions',
    icon: UserIcon,
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  {
    value: 'ORG_FINANCE',
    label: 'Finance',
    description: 'Can approve payments and access financial reports',
    icon: CheckCircleIcon,
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  {
    value: 'ORG_AUDITOR',
    label: 'Auditor',
    description: 'Can view reports and audit organizational activities',
    icon: EyeIcon,
    color: 'bg-orange-100 text-orange-800 border-orange-200'
  },
  {
    value: 'ORG_ADMIN',
    label: 'Admin',
    description: 'Full administrative access to organization settings',
    icon: ShieldCheckIcon,
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  }
];

const departments = [
  'Finance',
  'Operations',
  'HR',
  'IT',
  'Marketing',
  'Sales',
  'Legal',
  'Procurement',
  'Other'
];

export default function NewMemberPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    department: '',
    sendWelcomeEmail: true,
    generatePassword: true,
    customPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [existingMembers, setExistingMembers] = useState<User[]>([]);
  const [emailExists, setEmailExists] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && (!user || !user.role.startsWith('ORG_'))) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.orgId) {
      fetchExistingMembers();
    }
  }, [user]);

  useEffect(() => {
    // Check if email already exists
    if (formData.email && existingMembers.length > 0) {
      const exists = existingMembers.some(member => 
        member.email.toLowerCase() === formData.email.toLowerCase()
      );
      setEmailExists(exists);
    } else {
      setEmailExists(false);
    }
  }, [formData.email, existingMembers]);

  const fetchExistingMembers = async () => {
    if (!user?.orgId) return;
    
    try {
      const members = await getUsersByOrg(user.orgId);
      setExistingMembers(members || []);
    } catch (error) {
      console.error('Failed to fetch existing members:', error);
      setExistingMembers([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.orgId) return;

    if (emailExists) {
      if (typeof window !== 'undefined') {
        toast.error('A member with this email already exists');
      }
      return;
    }

    setIsSubmitting(true);
    
    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        role: formData.role as 'ORG_ADMIN' | 'ORG_MEMBER' | 'ORG_FINANCE' | 'ORG_AUDITOR',
        orgId: user.orgId,
        department: formData.department || undefined,
        active: true,
        createdAt: new Date(),
        createdBy: user.id
      };

      // Generate a unique ID for the user
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await createUser(userId, userData);
      
      try {
        // Show success toast safely
        if (typeof window !== 'undefined') {
          toast.success(`✅ ${formData.name} has been added successfully!`);
        }
      } catch (toastError) {
        console.log('Toast notification failed, but user was created successfully');
      }
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        role: '',
        department: '',
        sendWelcomeEmail: true,
        generatePassword: true,
        customPassword: ''
      });
      
      // Redirect to members list
      setTimeout(() => {
        router.push('/org/members');
      }, 1500);
      
    } catch (error: any) {
      console.error('Error adding member:', error);
      if (typeof window !== 'undefined') {
        toast.error('Failed to add member. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.name && formData.email && formData.role && !emailExists;

  // Prevent hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

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

  return (
    <ErrorBoundary>
      <RoleGuard 
        allowedRoles={['ORG_ADMIN', 'ORG_FINANCE']}
        fallbackMessage="You need Organization Admin or Finance role to add new members."
      >
      <div className="min-h-screen bg-gray-50">
        <OrganizationSidebar />
        
        <div className="lg:pl-72">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Link
                    href="/org/members"
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <ArrowLeftIcon className="w-5 h-5" />
                  </Link>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                      <UserPlusIcon className="w-8 h-8 text-blue-600" />
                      <span>Add New Member</span>
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                      Invite a new team member to your organization
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Main Form */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h2 className="text-lg font-semibold text-gray-900">Member Information</h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Fill in the details for the new team member
                      </p>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                      {/* Personal Information */}
                      <div className="space-y-4">
                        <h3 className="text-md font-medium text-gray-900 flex items-center space-x-2">
                          <UserIcon className="w-5 h-5 text-gray-500" />
                          <span>Personal Information</span>
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                              Full Name *
                            </label>
                            <input
                              type="text"
                              id="name"
                              name="name"
                              required
                              value={formData.name}
                              onChange={handleInputChange}
                              className="input-field"
                              placeholder="John Doe"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                              Email Address *
                            </label>
                            <div className="relative">
                              <input
                                type="email"
                                id="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleInputChange}
                                className={`input-field ${emailExists ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                                placeholder="john@company.com"
                              />
                              <EnvelopeIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            </div>
                            {emailExists && (
                              <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                                <ExclamationTriangleIcon className="w-4 h-4" />
                                <span>This email is already registered</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Role Selection */}
                      <div className="space-y-4">
                        <h3 className="text-md font-medium text-gray-900 flex items-center space-x-2">
                          <ShieldCheckIcon className="w-5 h-5 text-gray-500" />
                          <span>Role & Permissions</span>
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {roleOptions.map((role) => {
                            const Icon = role.icon;
                            return (
                              <label
                                key={role.value}
                                className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none transition-all ${
                                  formData.role === role.value
                                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="role"
                                  value={role.value}
                                  checked={formData.role === role.value}
                                  onChange={handleInputChange}
                                  className="sr-only"
                                />
                                <div className="flex items-start space-x-3">
                                  <div className={`p-2 rounded-lg ${role.color}`}>
                                    <Icon className="w-5 h-5" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900">{role.label}</div>
                                    <div className="text-sm text-gray-600">{role.description}</div>
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Department */}
                      <div className="space-y-4">
                        <h3 className="text-md font-medium text-gray-900 flex items-center space-x-2">
                          <BuildingOfficeIcon className="w-5 h-5 text-gray-500" />
                          <span>Department</span>
                        </h3>
                        
                        <div>
                          <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                            Department (Optional)
                          </label>
                          <select
                            id="department"
                            name="department"
                            value={formData.department}
                            onChange={handleInputChange}
                            className="input-field"
                          >
                            <option value="">Select department</option>
                            {departments.map(dept => (
                              <option key={dept} value={dept}>{dept}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Account Settings */}
                      <div className="space-y-4">
                        <h3 className="text-md font-medium text-gray-900">Account Settings</h3>
                        
                        <div className="space-y-3">
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              name="sendWelcomeEmail"
                              checked={formData.sendWelcomeEmail}
                              onChange={handleInputChange}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div>
                              <span className="text-sm font-medium text-gray-900">Send welcome email</span>
                              <p className="text-xs text-gray-600">Member will receive login instructions via email</p>
                            </div>
                          </label>
                          
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              name="generatePassword"
                              checked={formData.generatePassword}
                              onChange={handleInputChange}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div>
                              <span className="text-sm font-medium text-gray-900">Generate secure password</span>
                              <p className="text-xs text-gray-600">System will create a secure password automatically</p>
                            </div>
                          </label>
                        </div>

                        {!formData.generatePassword && (
                          <div>
                            <label htmlFor="customPassword" className="block text-sm font-medium text-gray-700 mb-2">
                              Custom Password
                            </label>
                            <div className="relative">
                              <input
                                type={showPassword ? 'text' : 'password'}
                                id="customPassword"
                                name="customPassword"
                                value={formData.customPassword}
                                onChange={handleInputChange}
                                className="input-field pr-10"
                                placeholder="Enter custom password"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                {showPassword ? (
                                  <EyeSlashIcon className="w-5 h-5" />
                                ) : (
                                  <EyeIcon className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Submit Button */}
                      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                        <Link
                          href="/org/members"
                          className="btn-secondary"
                        >
                          Cancel
                        </Link>
                        <button
                          type="submit"
                          disabled={!isFormValid || isSubmitting}
                          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Adding Member...</span>
                            </>
                          ) : (
                            <>
                              <UserPlusIcon className="w-4 h-4" />
                              <span>Add Member</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                  {/* Role Guide */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <InformationCircleIcon className="w-5 h-5 text-blue-500" />
                      <span>Role Guide</span>
                    </h3>
                    <div className="space-y-4 text-sm">
                      {roleOptions.map((role) => {
                        const Icon = role.icon;
                        return (
                          <div key={role.value} className="flex items-start space-x-3">
                            <div className={`p-1.5 rounded ${role.color}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{role.label}</div>
                              <div className="text-gray-600 text-xs">{role.description}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Current Team Stats */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Team</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Members</span>
                        <span className="font-semibold text-gray-900">{existingMembers.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Active</span>
                        <span className="font-semibold text-green-600">
                          {existingMembers.filter(m => m.active).length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Admins</span>
                        <span className="font-semibold text-purple-600">
                          {existingMembers.filter(m => m.role === 'ORG_ADMIN').length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tips */}
                  <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4">💡 Tips</h3>
                    <ul className="space-y-2 text-sm text-blue-800">
                      <li>• Choose roles carefully - they determine access levels</li>
                      <li>• Welcome emails help new members get started</li>
                      <li>• Generated passwords are more secure</li>
                      <li>• Department helps with organization</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
    </ErrorBoundary>
  );
}