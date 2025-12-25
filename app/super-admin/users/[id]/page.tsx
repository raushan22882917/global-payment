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
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { getUser, getOrganization, updateUser } from '@/lib/database';
import { User, Organization } from '@/types';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function UserDetailPage() {
  const { user: currentUser, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

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
      const userData = await getUser(userId);
      if (!userData) {
        toast.error('User not found');
        router.push('/super-admin/users');
        return;
      }

      setUser(userData);

      // Get organization if user has one
      if (userData.orgId) {
        const orgData = await getOrganization(userData.orgId);
        setOrganization(orgData);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setDataLoading(false);
    }
  };

  const toggleUserStatus = async () => {
    if (!user) return;

    setUpdating(true);
    try {
      const newStatus = !user.active;
      await updateUser(user.id, { active: newStatus });
      
      setUser({ ...user, active: newStatus });
      toast.success(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Failed to update user status:', error);
      toast.error('Failed to update user status');
    } finally {
      setUpdating(false);
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
      title="User Details" 
      subtitle={`Viewing details for ${user.name}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link
            href="/super-admin/users"
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
            <p className="text-gray-600">Complete user information and management</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleUserStatus}
            disabled={updating || user.role === 'SUPER_ADMIN'}
            className={`btn-secondary flex items-center space-x-2 ${
              user.role === 'SUPER_ADMIN' ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {user.active ? <XCircleIcon className="w-4 h-4" /> : <CheckCircleIcon className="w-4 h-4" />}
            <span>{updating ? 'Updating...' : (user.active ? 'Deactivate' : 'Activate')}</span>
          </button>
          
          <Link
            href={`/super-admin/users/${user.id}/edit`}
            className="btn-primary flex items-center space-x-2"
          >
            <PencilIcon className="w-4 h-4" />
            <span>Edit User</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className={`mx-auto h-24 w-24 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 ${
                user.role === 'SUPER_ADMIN' 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                  : 'bg-gradient-to-r from-blue-500 to-green-500'
              }`}>
                {user.name.charAt(0)}
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 mb-2">{user.name}</h2>
              <p className="text-gray-600 mb-4">{user.email}</p>
              
              <div className="flex items-center justify-center space-x-2 mb-4">
                {user.role === 'SUPER_ADMIN' && (
                  <ShieldCheckIcon className="w-5 h-5 text-purple-500" />
                )}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  user.role === 'SUPER_ADMIN' 
                    ? 'bg-purple-100 text-purple-800'
                    : user.role === 'ORG_ADMIN'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {user.role.replace('_', ' ')}
                </span>
              </div>
              
              <div className="flex items-center justify-center">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  user.active 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.active ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* User Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <UserIcon className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Full Name</p>
                  <p className="text-gray-900">{user.name}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <EnvelopeIcon className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Email Address</p>
                  <p className="text-gray-900">{user.email}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <ShieldCheckIcon className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Role</p>
                  <p className="text-gray-900">{user.role.replace('_', ' ')}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CalendarIcon className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Created Date</p>
                  <p className="text-gray-900">{user.createdAt.toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Organization Information */}
          {organization && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Organization</h3>
              
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-2">{organization.name}</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Organization ID</p>
                      <p className="font-medium text-gray-900">{organization.id}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Business Type</p>
                      <p className="font-medium text-gray-900">{organization.businessType}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Currency</p>
                      <p className="font-medium text-gray-900">{organization.currency}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Status</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        organization.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800'
                          : organization.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : organization.status === 'DRAFT'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {organization.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Link
                      href={`/super-admin/organizations/${organization.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Organization Details →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Account Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Account Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Account Status</h4>
                  <p className="text-sm text-gray-600">
                    {user.active ? 'User can access the system' : 'User access is disabled'}
                  </p>
                </div>
                <button
                  onClick={toggleUserStatus}
                  disabled={updating || user.role === 'SUPER_ADMIN'}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    user.role === 'SUPER_ADMIN'
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : user.active
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {updating ? 'Updating...' : (user.active ? 'Deactivate' : 'Activate')}
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Super Admin Protection</h4>
                  <p className="text-sm text-gray-600">
                    {user.role === 'SUPER_ADMIN' 
                      ? 'This user has super admin privileges and cannot be deactivated'
                      : 'This user can be managed normally'
                    }
                  </p>
                </div>
                {user.role === 'SUPER_ADMIN' && (
                  <ShieldCheckIcon className="w-6 h-6 text-purple-500" />
                )}
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          {user.role !== 'SUPER_ADMIN' && (
            <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-6">Danger Zone</h3>
              
              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <TrashIcon className="w-5 h-5 text-red-500 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-medium text-red-900 mb-2">Delete User Account</h4>
                    <p className="text-sm text-red-700 mb-4">
                      Permanently delete this user account. This action cannot be undone and will remove all associated data.
                    </p>
                    <button className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                      Delete User
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
}