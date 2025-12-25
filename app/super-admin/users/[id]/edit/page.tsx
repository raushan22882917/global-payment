'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import SuperAdminLayout from '@/components/SuperAdminLayout';
import { 
  UserIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { getUser, updateUser, getOrganizationRequests } from '@/lib/database';
import { User, OrganizationRequest } from '@/types';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function EditUserPage() {
  const { user: currentUser, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationRequest[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'ORG_MEMBER' as 'SUPER_ADMIN' | 'ORG_ADMIN' | 'ORG_MEMBER' | 'ORG_FINANCE' | 'ORG_AUDITOR',
    orgId: '',
    active: true
  });

  useEffect(() => {
    if (!loading && (!currentUser || (currentUser.role !== 'SUPER_ADMIN' && !currentUser.isSuperAdmin))) {
      router.push('/');
      return;
    }

    if (currentUser && userId) {
      fetchData();
    }
  }, [currentUser, loading, router, userId]);

  const fetchData = async () => {
    try {
      const [userData, orgsData] = await Promise.all([
        getUser(userId),
        getOrganizationRequests()
      ]);

      if (!userData) {
        toast.error('User not found');
        router.push('/super-admin/users');
        return;
      }

      setUser(userData);
      setOrganizations(orgsData.filter(org => org.status === 'APPROVED'));
      
      // Populate form with user data
      setFormData({
        name: userData.name,
        email: userData.email,
        role: userData.role,
        orgId: userData.orgId || '',
        active: userData.active
      });
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load user data');
    } finally {
      setDataLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (!formData.email.trim()) {
      toast.error('Email is required');
      return;
    }

    // Only require organization for organization roles
    if (formData.role.startsWith('ORG_') && !formData.orgId) {
      toast.error('Organization is required for organization roles');
      return;
    }

    setSaving(true);
    try {
      const updateData: Partial<User> = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        active: formData.active
      };

      // Handle organization assignment based on role
      if (formData.role === 'SUPER_ADMIN') {
        // Super Admin doesn't need organization
        updateData.orgId = undefined;
      } else if (formData.role.startsWith('ORG_')) {
        // Organization roles need organization
        if (formData.orgId) {
          updateData.orgId = formData.orgId;
        } else {
          // Auto-assign to first available organization if none selected
          const firstOrg = organizations[0];
          if (firstOrg) {
            updateData.orgId = firstOrg.id;
            toast.success(`Auto-assigned to organization: ${firstOrg.organizationName}`);
          }
        }
      }

      await updateUser(user.id, updateData);
      
      toast.success('User updated successfully');
      router.push(`/super-admin/users/${user.id}`);
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error('Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!currentUser || (currentUser.role !== 'SUPER_ADMIN' && !currentUser.isSuperAdmin) || !user) {
    return null;
  }

  return (
    <SuperAdminLayout 
      title="Edit User" 
      subtitle={`Editing ${user.name}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link
            href={`/super-admin/users/${user.id}`}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
            <p className="text-gray-600">Update user information and settings</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  <UserIcon className="w-4 h-4 inline mr-2" />
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  <EnvelopeIcon className="w-4 h-4 inline mr-2" />
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Role and Organization */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Role and Organization</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  <ShieldCheckIcon className="w-4 h-4 inline mr-2" />
                  Role *
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="ORG_ADMIN">Organization Admin</option>
                  <option value="ORG_FINANCE">Organization Finance</option>
                  <option value="ORG_AUDITOR">Organization Auditor</option>
                  <option value="ORG_MEMBER">Organization Member</option>
                </select>
              </div>
              
              {formData.role.startsWith('ORG_') && (
                <div>
                  <label htmlFor="orgId" className="block text-sm font-medium text-gray-700 mb-2">
                    <BuildingOfficeIcon className="w-4 h-4 inline mr-2" />
                    Organization {organizations.length > 1 ? '' : '(Auto-assigned)'}
                  </label>
                  {organizations.length > 1 ? (
                    <select
                      id="orgId"
                      name="orgId"
                      value={formData.orgId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Organization</option>
                      {organizations.map(org => (
                        <option key={org.id} value={org.id}>
                          {org.organizationName}
                        </option>
                      ))}
                    </select>
                  ) : organizations.length === 1 ? (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                      <span className="text-gray-700">{organizations[0].organizationName}</span>
                      <span className="text-sm text-gray-500 ml-2">(Auto-assigned)</span>
                    </div>
                  ) : (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-red-50">
                      <span className="text-red-600">No organizations available</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Account Status */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="active"
                name="active"
                checked={formData.active}
                onChange={handleInputChange}
                disabled={user.role === 'SUPER_ADMIN'}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
              />
              <label htmlFor="active" className="text-sm font-medium text-gray-700">
                Active Account
                {user.role === 'SUPER_ADMIN' && (
                  <span className="text-gray-500 ml-2">(Super Admin accounts cannot be deactivated)</span>
                )}
              </label>
            </div>
          </div>

          {/* Role Information */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Role Permissions & Organization</h4>
            <div className="text-sm text-blue-800 space-y-1">
              {formData.role === 'SUPER_ADMIN' && (
                <>
                  <p>• Full system access and user management across all organizations</p>
                  <p>• No organization assignment required</p>
                </>
              )}
              {formData.role === 'ORG_ADMIN' && (
                <>
                  <p>• Full access to organization dashboard and user management within the organization</p>
                  <p>• {organizations.length > 1 ? 'Choose organization or auto-assign to first available' : organizations.length === 1 ? 'Auto-assigned to available organization' : 'No organizations available'}</p>
                </>
              )}
              {formData.role === 'ORG_FINANCE' && (
                <>
                  <p>• Access to financial features and payment approval workflows</p>
                  <p>• {organizations.length > 1 ? 'Choose organization or auto-assign to first available' : organizations.length === 1 ? 'Auto-assigned to available organization' : 'No organizations available'}</p>
                </>
              )}
              {formData.role === 'ORG_AUDITOR' && (
                <>
                  <p>• Read-only access to organization data for auditing purposes</p>
                  <p>• {organizations.length > 1 ? 'Choose organization or auto-assign to first available' : organizations.length === 1 ? 'Auto-assigned to available organization' : 'No organizations available'}</p>
                </>
              )}
              {formData.role === 'ORG_MEMBER' && (
                <>
                  <p>• Basic access to organization features and payment requests</p>
                  <p>• {organizations.length > 1 ? 'Choose organization or auto-assign to first available' : organizations.length === 1 ? 'Auto-assigned to available organization' : 'No organizations available'}</p>
                </>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Link
              href={`/super-admin/users/${user.id}`}
              className="btn-secondary flex items-center space-x-2"
            >
              <XMarkIcon className="w-4 h-4" />
              <span>Cancel</span>
            </Link>
            
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </SuperAdminLayout>
  );
}