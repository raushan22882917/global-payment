'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import SuperAdminLayout from '@/components/SuperAdminLayout';
import { 
  BuildingOfficeIcon, 
  UsersIcon, 
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { getOrganizationRequests } from '@/lib/database';
import { OrganizationRequest } from '@/types';
import Link from 'next/link';

export default function OrganizationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<OrganizationRequest[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'DRAFT' | 'PENDING'>('ALL');

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'SUPER_ADMIN' && !user.isSuperAdmin))) {
      router.push('/');
      return;
    }

    if (user) {
      fetchOrganizations();
    }
  }, [user, loading, router]);

  const fetchOrganizations = async () => {
    try {
      const requests = await getOrganizationRequests();
      setOrganizations(requests);
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
      setOrganizations([]);
    } finally {
      setDataLoading(false);
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

  const filteredOrganizations = organizations.filter(org => {
    if (filter === 'ALL') return true;
    if (filter === 'ACTIVE') return org.status === 'APPROVED';
    if (filter === 'DRAFT') return false; // No draft status in OrganizationRequest
    return org.status === filter;
  });

  const stats = {
    total: organizations.length,
    active: organizations.filter(o => o.status === 'APPROVED').length,
    pending: organizations.filter(o => o.status === 'PENDING').length,
    draft: 0 // OrganizationRequest doesn't have DRAFT status
  };

  return (
    <SuperAdminLayout 
      title="Organizations" 
      subtitle="Manage all organizations in the system"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Organizations</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500">
              <BuildingOfficeIcon className="w-6 h-6 text-white" />
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
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pending}</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-500">
              <ClockIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Draft</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.draft}</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-500">
              <UsersIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-semibold text-gray-900">Organizations</h3>
              <div className="flex items-center space-x-2">
                {(['ALL', 'ACTIVE', 'PENDING', 'DRAFT'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      filter === status
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {status === 'ALL' ? 'All' : status === 'ACTIVE' ? 'Active' : status}
                  </button>
                ))}
              </div>
            </div>
            
            <Link
              href="/super-admin/organizations/new"
              className="btn-primary flex items-center space-x-2"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Create Organization</span>
            </Link>
          </div>
        </div>

        <div className="p-6">
          {filteredOrganizations.length === 0 ? (
            <div className="text-center py-12">
              <BuildingOfficeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Organizations Found</h3>
              <p className="text-gray-600 mb-6">
                {filter === 'ALL' 
                  ? 'No organizations have been created yet.'
                  : `No organizations with status "${filter}" found.`
                }
              </p>
              <Link
                href="/super-admin/organizations/new"
                className="btn-primary"
              >
                Create First Organization
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrganizations.map((org) => (
                    <tr key={org.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                              <BuildingOfficeIcon className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {org.organizationName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {org.businessType}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{org.contactEmail}</div>
                        <div className="text-sm text-gray-500">{org.contactName || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          org.status === 'APPROVED' 
                            ? 'bg-green-100 text-green-800'
                            : org.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : org.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {org.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(org.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/super-admin/organizations/${org.id}`}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/super-admin/organizations/${org.id}/edit`}
                            className="text-green-600 hover:text-green-900 p-1 rounded"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Link>
                          <button className="text-red-600 hover:text-red-900 p-1 rounded">
                            <TrashIcon className="w-4 h-4" />
                          </button>
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
    </SuperAdminLayout>
  );
}