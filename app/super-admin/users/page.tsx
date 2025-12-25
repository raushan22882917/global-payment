'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import SuperAdminLayout from '@/components/SuperAdminLayout';
import { 
  UsersIcon, 
  UserPlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { getOrganizationRequests, getAllUsers, updateUser } from '@/lib/database';
import { OrganizationRequest, User } from '@/types';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function UserManagementPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationRequest[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'SUPER_ADMIN' | 'ORG_ADMIN' | 'ORG_MEMBER'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; user: User | null }>({
    isOpen: false,
    user: null
  });
  const [deleting, setDeleting] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<'activate' | 'deactivate' | ''>('');

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'SUPER_ADMIN' && !user.isSuperAdmin))) {
      router.push('/');
      return;
    }

    if (user) {
      fetchData();
    }
  }, [user, loading, router]);

  const fetchData = async () => {
    try {
      const [orgsData, usersData] = await Promise.all([
        getOrganizationRequests(),
        getAllUsers()
      ]);
      
      setOrganizations(orgsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setUsers([]);
      setOrganizations([]);
    } finally {
      setDataLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteModal.user) return;

    setDeleting(true);
    try {
      // Instead of actually deleting, we'll deactivate the user
      await updateUser(deleteModal.user.id, { active: false });
      
      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === deleteModal.user!.id ? { ...u, active: false } : u
      ));
      
      toast.success('User deactivated successfully');
      setDeleteModal({ isOpen: false, user: null });
    } catch (error) {
      console.error('Failed to deactivate user:', error);
      toast.error('Failed to deactivate user');
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteModal = (user: User) => {
    setDeleteModal({ isOpen: true, user });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, user: null });
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    const selectableUsers = filteredUsers.filter(u => u.role !== 'SUPER_ADMIN');
    if (selectedUsers.length === selectableUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(selectableUsers.map(u => u.id));
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.length === 0) return;

    setDeleting(true);
    try {
      const updates = bulkAction === 'activate' ? { active: true } : { active: false };
      
      await Promise.all(
        selectedUsers.map(userId => updateUser(userId, updates))
      );

      // Update local state
      setUsers(prev => prev.map(u => 
        selectedUsers.includes(u.id) ? { ...u, ...updates } : u
      ));

      toast.success(`${selectedUsers.length} users ${bulkAction}d successfully`);
      setSelectedUsers([]);
      setBulkAction('');
    } catch (error) {
      console.error('Failed to perform bulk action:', error);
      toast.error('Failed to perform bulk action');
    } finally {
      setDeleting(false);
    }
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user || (user.role !== 'SUPER_ADMIN' && !user.isSuperAdmin)) {
    return null;
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (u.orgId && u.orgId.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || (u.active ? 'ACTIVE' : 'INACTIVE') === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.active).length,
    inactive: users.filter(u => !u.active).length,
    pending: 0, // We don't have pending status in User type
    superAdmins: users.filter(u => u.role === 'SUPER_ADMIN').length
  };

  return (
    <SuperAdminLayout 
      title="User Management" 
      subtitle="Manage all users across organizations"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500">
              <UsersIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.active}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500">
              <CheckCircleIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactive</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.inactive}</p>
            </div>
            <div className="p-3 rounded-lg bg-red-500">
              <XCircleIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Super Admins</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.superAdmins}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500">
              <ShieldCheckIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <h3 className="text-lg font-semibold text-gray-900">All Users</h3>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Roles</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ORG_ADMIN">Org Admin</option>
                <option value="ORG_MEMBER">Org Member</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>

              <Link
                href="/super-admin/users/new"
                className="btn-primary flex items-center space-x-2 whitespace-nowrap"
              >
                <UserPlusIcon className="w-4 h-4" />
                <span>Add User</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
                  </span>
                  <select
                    value={bulkAction}
                    onChange={(e) => setBulkAction(e.target.value as any)}
                    className="px-3 py-1 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select action...</option>
                    <option value="activate">Activate</option>
                    <option value="deactivate">Deactivate</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleBulkAction}
                    disabled={!bulkAction || deleting}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting ? 'Processing...' : 'Apply'}
                  </button>
                  <button
                    onClick={() => setSelectedUsers([])}
                    className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || roleFilter !== 'ALL' || statusFilter !== 'ALL'
                  ? 'No users match your current filters.'
                  : 'No users have been created yet.'
                }
              </p>
              {!searchTerm && roleFilter === 'ALL' && statusFilter === 'ALL' && (
                <Link
                  href="/super-admin/users/new"
                  className="btn-primary"
                >
                  Add First User
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === filteredUsers.filter(u => u.role !== 'SUPER_ADMIN').length && filteredUsers.filter(u => u.role !== 'SUPER_ADMIN').length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((userData) => (
                    <tr key={userData.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {userData.role !== 'SUPER_ADMIN' && (
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(userData.id)}
                            onChange={() => handleSelectUser(userData.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold ${
                              userData.role === 'SUPER_ADMIN' 
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                                : 'bg-gradient-to-r from-blue-500 to-green-500'
                            }`}>
                              {userData.name.charAt(0)}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {userData.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {userData.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {userData.role === 'SUPER_ADMIN' && (
                            <ShieldCheckIcon className="w-4 h-4 text-purple-500 mr-2" />
                          )}
                          <span className={`text-sm font-medium ${
                            userData.role === 'SUPER_ADMIN' ? 'text-purple-700' : 'text-gray-900'
                          }`}>
                            {userData.role.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {userData.orgId || 'System'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          userData.active 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {userData.active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {userData.createdAt.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/super-admin/users/${userData.id}`}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="View Details"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/super-admin/users/${userData.id}/edit`}
                            className="text-green-600 hover:text-green-900 p-1 rounded"
                            title="Edit User"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Link>
                          {userData.role !== 'SUPER_ADMIN' && (
                            <button 
                              onClick={() => openDeleteModal(userData)}
                              className="text-red-600 hover:text-red-900 p-1 rounded"
                              title="Deactivate User"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.user && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Deactivate User</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to deactivate <strong>{deleteModal.user.name}</strong>? 
                  This will prevent them from accessing the system, but their data will be preserved.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3">
                  <button
                    onClick={closeDeleteModal}
                    disabled={deleting}
                    className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteUser}
                    disabled={deleting}
                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50"
                  >
                    {deleting ? 'Deactivating...' : 'Deactivate'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}