'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import OrganizationSidebar from '@/components/OrganizationSidebar';
import RoleGuard from '@/components/RoleGuard';
import {
  UserIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { getUser } from '@/lib/database';
import { User } from '@/types';
import Link from 'next/link';

export default function MemberDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [member, setMember] = useState<User | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || !user.role.startsWith('ORG_'))) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (params.id && typeof params.id === 'string') {
      fetchMember(params.id);
    }
  }, [params.id]);

  const fetchMember = async (memberId: string) => {
    try {
      const memberData = await getUser(memberId);
      setMember(memberData);
    } catch (error) {
      console.error('Failed to fetch member:', error);
    } finally {
      setDataLoading(false);
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ORG_ADMIN':
        return <ShieldCheckIcon className="w-4 h-4 text-purple-500" />;
      case 'ORG_FINANCE':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      default:
        return <UserIcon className="w-4 h-4 text-blue-500" />;
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

  if (!member) {
    return (
      <div className="min-h-screen bg-gray-50">
        <OrganizationSidebar />
        <div className="lg:pl-72">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Member Not Found</h3>
              <p className="text-gray-600 mb-4">The requested member could not be found.</p>
              <Link href="/org/members" className="btn-primary">
                Back to Members
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const canManageMembers = user.role === 'ORG_ADMIN' || user.role === 'ORG_FINANCE';

  return (
    <RoleGuard 
      allowedRoles={['ORG_ADMIN', 'ORG_FINANCE', 'ORG_MEMBER', 'ORG_AUDITOR']}
      fallbackMessage="You need organization access to view member details."
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
                    <h1 className="text-2xl font-bold text-gray-900">Member Details</h1>
                    <p className="mt-1 text-sm text-gray-600">
                      View and manage member information
                    </p>
                  </div>
                </div>
                
                {canManageMembers && (
                  <div className="flex items-center space-x-3">
                    <Link
                      href={`/org/members/${member.id}/edit`}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <PencilIcon className="w-4 h-4" />
                      <span>Edit</span>
                    </Link>
                    {member.role !== 'ORG_ADMIN' && (
                      <button className="btn-danger flex items-center space-x-2">
                        <TrashIcon className="w-4 h-4" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Profile Card */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start space-x-6">
                      <div className="flex-shrink-0">
                        <div className={`h-20 w-20 rounded-full flex items-center justify-center text-white font-bold text-2xl ${
                          member.role === 'ORG_ADMIN' 
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                            : 'bg-gradient-to-r from-blue-500 to-green-500'
                        }`}>
                          {member.name.charAt(0)}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="text-2xl font-bold text-gray-900">{member.name}</h2>
                            <p className="text-gray-600 flex items-center space-x-2 mt-1">
                              <EnvelopeIcon className="w-4 h-4" />
                              <span>{member.email}</span>
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center space-x-2 mb-2">
                              {getRoleIcon(member.role)}
                              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getRoleColor(member.role)}`}>
                                {member.role.replace('ORG_', '')}
                              </span>
                            </div>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              member.active 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {member.active ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Member Information</h3>
                    </div>
                    
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Full Name
                          </label>
                          <p className="text-gray-900 font-medium">{member.name}</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Email Address
                          </label>
                          <p className="text-gray-900 font-medium">{member.email}</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Role
                          </label>
                          <div className="flex items-center space-x-2">
                            {getRoleIcon(member.role)}
                            <span className="text-gray-900 font-medium">
                              {member.role.replace('ORG_', '').replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Department
                          </label>
                          <p className="text-gray-900 font-medium">
                            {member.department || 'Not specified'}
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Status
                          </label>
                          <div className="flex items-center space-x-2">
                            {member.active ? (
                              <CheckCircleIcon className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircleIcon className="w-4 h-4 text-red-500" />
                            )}
                            <span className="text-gray-900 font-medium">
                              {member.active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            Member Since
                          </label>
                          <div className="flex items-center space-x-2">
                            <CalendarIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 font-medium">
                              {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  
                  {/* Quick Actions */}
                  {canManageMembers && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                      <div className="space-y-3">
                        <Link
                          href={`/org/members/${member.id}/edit`}
                          className="w-full btn-secondary flex items-center justify-center space-x-2"
                        >
                          <PencilIcon className="w-4 h-4" />
                          <span>Edit Member</span>
                        </Link>
                        
                        <button className="w-full btn-secondary flex items-center justify-center space-x-2">
                          <EnvelopeIcon className="w-4 h-4" />
                          <span>Send Message</span>
                        </button>
                        
                        {member.role !== 'ORG_ADMIN' && (
                          <button className="w-full btn-danger flex items-center justify-center space-x-2">
                            <TrashIcon className="w-4 h-4" />
                            <span>Remove Member</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Role Permissions */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Permissions</h3>
                    <div className="space-y-3 text-sm">
                      {member.role === 'ORG_ADMIN' && (
                        <>
                          <div className="flex items-center space-x-2 text-green-600">
                            <CheckCircleIcon className="w-4 h-4" />
                            <span>Full organization management</span>
                          </div>
                          <div className="flex items-center space-x-2 text-green-600">
                            <CheckCircleIcon className="w-4 h-4" />
                            <span>User management</span>
                          </div>
                          <div className="flex items-center space-x-2 text-green-600">
                            <CheckCircleIcon className="w-4 h-4" />
                            <span>Payment approval</span>
                          </div>
                          <div className="flex items-center space-x-2 text-green-600">
                            <CheckCircleIcon className="w-4 h-4" />
                            <span>Settings management</span>
                          </div>
                        </>
                      )}
                      
                      {member.role === 'ORG_FINANCE' && (
                        <>
                          <div className="flex items-center space-x-2 text-green-600">
                            <CheckCircleIcon className="w-4 h-4" />
                            <span>Payment approval</span>
                          </div>
                          <div className="flex items-center space-x-2 text-green-600">
                            <CheckCircleIcon className="w-4 h-4" />
                            <span>Financial reports</span>
                          </div>
                          <div className="flex items-center space-x-2 text-green-600">
                            <CheckCircleIcon className="w-4 h-4" />
                            <span>User management</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-400">
                            <XCircleIcon className="w-4 h-4" />
                            <span>Settings management</span>
                          </div>
                        </>
                      )}
                      
                      {member.role === 'ORG_AUDITOR' && (
                        <>
                          <div className="flex items-center space-x-2 text-green-600">
                            <CheckCircleIcon className="w-4 h-4" />
                            <span>View reports</span>
                          </div>
                          <div className="flex items-center space-x-2 text-green-600">
                            <CheckCircleIcon className="w-4 h-4" />
                            <span>Audit activities</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-400">
                            <XCircleIcon className="w-4 h-4" />
                            <span>Payment approval</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-400">
                            <XCircleIcon className="w-4 h-4" />
                            <span>User management</span>
                          </div>
                        </>
                      )}
                      
                      {member.role === 'ORG_MEMBER' && (
                        <>
                          <div className="flex items-center space-x-2 text-green-600">
                            <CheckCircleIcon className="w-4 h-4" />
                            <span>Submit payment requests</span>
                          </div>
                          <div className="flex items-center space-x-2 text-green-600">
                            <CheckCircleIcon className="w-4 h-4" />
                            <span>View team information</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-400">
                            <XCircleIcon className="w-4 h-4" />
                            <span>Payment approval</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-400">
                            <XCircleIcon className="w-4 h-4" />
                            <span>User management</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}