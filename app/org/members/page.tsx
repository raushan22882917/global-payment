'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import OrganizationSidebar from '@/components/OrganizationSidebar';
import {
  UsersIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { getUsersByOrg } from '@/lib/database';
import { User } from '@/types';
import Link from 'next/link';

export default function TeamMembersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ORG_ADMIN' | 'ORG_MEMBER' | 'ORG_FINANCE' | 'ORG_AUDITOR'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || !user.role.startsWith('ORG_'))) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.orgId) {
      fetchMembers();
    }
  }, [user]);

  const fetchMembers = async () => {
    if (!user?.orgId) return;
    
    try {
      const membersData = await getUsersByOrg(user.orgId);
      setMembers(membersData || []);
    } catch (error) {
      console.error('Failed to fetch members:', error);
      setMembers([]);
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

  if (!user || !user.role.startsWith('ORG_')) {
    return null;
  }

  const canManageMembers = user.role === 'ORG_ADMIN' || user.role === 'ORG_FINANCE';

  if (!canManageMembers) {
    return (
      <div className="min-h-screen bg-gray-50">
        <OrganizationSidebar />
        <div className="lg:pl-72">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <ShieldCheckIcon className="w-16 h-16 text-orange-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Admin Access Required</h3>
              <p className="text-gray-600 mb-4">
                You need Organization Admin or Finance role to manage team members.
              </p>
              <p className="text-sm text-gray-500">
                Current role: <span className="font-medium">{user.role.replace('ORG_', '')}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (member.department && member.department.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'ALL' || member.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || (member.active ? 'ACTIVE' : 'INACTIVE') === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: members.length,
    active: members.filter(m => m.active).length,
    inactive: members.filter(m => !m.active).length,
    admins: members.filter(m => m.role === 'ORG_ADMIN').length,
    finance: members.filter(m => m.role === 'ORG_FINANCE').length
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ORG_ADMIN':
        return <ShieldCheckIcon className="w-4 h-4 text-purple-500" />;
      case 'ORG_FINANCE':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      default:
        return <UsersIcon className="w-4 h-4 text-blue-500" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ORG_ADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'ORG_FINANCE':
        return 'bg-green-100 text-green-800';
      case 'ORG_AUDITOR':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <OrganizationSidebar />
      
      <div className="lg:pl-72">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Manage your organization's team members and their roles
                </p>
              </div>
              
              {canManageMembers && (
                <div className="flex items-center space-x-3">
                  <button className="btn-secondary flex items-center space-x-2">
                    <EnvelopeIcon className="w-4 h-4" />
                    <span>Invite Members</span>
                  </button>
                  <Link
                    href="/org/members/new"
                    className="btn-primary flex items-center space-x-2"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>Add Member</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Members</p>
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
                  <p className="text-sm font-medium text-gray-600">Admins</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.admins}</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-500">
                  <ShieldCheckIcon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Finance</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.finance}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-500">
                  <CheckCircleIcon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <h3 className="text-lg font-semibold text-gray-900">All Team Members</h3>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  {/* Search */}
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search members..."
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
                    <option value="ORG_ADMIN">Admin</option>
                    <option value="ORG_MEMBER">Member</option>
                    <option value="ORG_FINANCE">Finance</option>
                    <option value="ORG_AUDITOR">Auditor</option>
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
                </div>
              </div>
            </div>

            <div className="p-6">
              {filteredMembers.length === 0 ? (
                <div className="text-center py-12">
                  <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Team Members Found</h3>
                  <p className="text-gray-600 mb-6">
                    {searchTerm || roleFilter !== 'ALL' || statusFilter !== 'ALL'
                      ? 'No members match your current filters.'
                      : 'No team members have been added yet.'
                    }
                  </p>
                  {!searchTerm && roleFilter === 'ALL' && statusFilter === 'ALL' && canManageMembers && (
                    <Link
                      href="/org/members/new"
                      className="btn-primary"
                    >
                      Add First Member
                    </Link>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Member
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredMembers.map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold ${
                                  member.role === 'ORG_ADMIN' 
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                                    : 'bg-gradient-to-r from-blue-500 to-green-500'
                                }`}>
                                  {member.name.charAt(0)}
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {member.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {member.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              {getRoleIcon(member.role)}
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(member.role)}`}>
                                {member.role.replace('ORG_', '')}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {member.department || 'Not specified'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              member.active 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {member.active ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <Link
                                href={`/org/members/${member.id}`}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </Link>
                              {canManageMembers && (
                                <>
                                  <Link
                                    href={`/org/members/${member.id}/edit`}
                                    className="text-green-600 hover:text-green-900 p-1 rounded"
                                  >
                                    <PencilIcon className="w-4 h-4" />
                                  </Link>
                                  {member.role !== 'ORG_ADMIN' && (
                                    <button className="text-red-600 hover:text-red-900 p-1 rounded">
                                      <TrashIcon className="w-4 h-4" />
                                    </button>
                                  )}
                                </>
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

          {/* Role Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Permissions</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <ShieldCheckIcon className="w-5 h-5 text-purple-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">Organization Admin</h4>
                    <p className="text-sm text-gray-600">Full access to manage organization, members, and settings</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">Finance Member</h4>
                    <p className="text-sm text-gray-600">Can approve payments and access financial reports</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <UsersIcon className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">Organization Member</h4>
                    <p className="text-sm text-gray-600">Can submit payment requests and view team information</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Member Management</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">1</span>
                  </div>
                  <p>Add new members by creating accounts or sending invitations</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">2</span>
                  </div>
                  <p>Assign appropriate roles based on responsibilities</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">3</span>
                  </div>
                  <p>Monitor member activity and manage access as needed</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}