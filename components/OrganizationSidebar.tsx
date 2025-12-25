'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getOrganization } from '@/lib/database';
import { Organization } from '@/types';
import {
  HomeIcon,
  DocumentTextIcon,
  CreditCardIcon,
  UsersIcon,
  CogIcon,
  ChartBarIcon,
  ArrowRightStartOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  CheckCircleIcon,
  BuildingOfficeIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  CreditCardIcon as CreditCardIconSolid,
  UsersIcon as UsersIconSolid,
  CogIcon as CogIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  BanknotesIcon as BanknotesIconSolid
} from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

export default function OrganizationSidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (user?.orgId) {
      fetchOrganization();
    }
  }, [user?.orgId]);

  const fetchOrganization = async () => {
    if (!user?.orgId || user.orgId === 'public') return;
    
    try {
      const orgData = await getOrganization(user.orgId);
      setOrganization(orgData);
      
      if (!orgData) {
        console.warn('Organization not found for user:', user.orgId);
      }
    } catch (error) {
      console.error('Failed to fetch organization:', error);
    }
  };

  // Define navigation based on user role
  const getNavigation = () => {
    const baseNavigation = [
      {
        name: 'Dashboard',
        href: '/org/dashboard',
        icon: HomeIcon,
        iconSolid: HomeIconSolid,
        current: pathname === '/org/dashboard',
        roles: ['ORG_ADMIN', 'ORG_FINANCE', 'ORG_MEMBER', 'ORG_AUDITOR', 'ORG_APPROVER', 'ORG_USER']
      },
      {
        name: 'Payment Requests',
        href: '/org/payments',
        icon: CreditCardIcon,
        iconSolid: CreditCardIconSolid,
        current: pathname === '/org/payments',
        roles: ['ORG_ADMIN', 'ORG_FINANCE', 'ORG_MEMBER', 'ORG_APPROVER', 'ORG_USER']
      },
      {
        name: 'Finances',
        href: '/org/finances',
        icon: BanknotesIcon,
        iconSolid: BanknotesIconSolid,
        current: pathname === '/org/finances',
        roles: ['ORG_ADMIN', 'ORG_FINANCE'] // Only admins and finance can view finances
      },
      {
        name: 'Payment Release',
        href: '/org/payments/release',
        icon: CheckCircleIcon,
        iconSolid: CheckCircleIcon,
        current: pathname === '/org/payments/release',
        roles: ['ORG_ADMIN', 'ORG_FINANCE'] // Only admins and finance can release payments
      },
      {
        name: 'Approval Workflow',
        href: '/org/approvals',
        icon: DocumentTextIcon,
        iconSolid: DocumentTextIconSolid,
        current: pathname === '/org/approvals',
        roles: ['ORG_ADMIN', 'ORG_FINANCE', 'ORG_APPROVER'] // Approvers can also access workflow
      },
      {
        name: 'Team Members',
        href: '/org/members',
        icon: UsersIcon,
        iconSolid: UsersIconSolid,
        current: pathname === '/org/members',
        roles: ['ORG_ADMIN', 'ORG_FINANCE'] // Only admins and finance can manage members
      },
      {
        name: 'Reports',
        href: '/org/reports',
        icon: ChartBarIcon,
        iconSolid: ChartBarIconSolid,
        current: pathname === '/org/reports',
        roles: ['ORG_ADMIN', 'ORG_FINANCE', 'ORG_AUDITOR'] // Auditors can view reports
      },
      {
        name: 'Settings',
        href: '/org/settings',
        icon: CogIcon,
        iconSolid: CogIconSolid,
        current: pathname === '/org/settings',
        roles: ['ORG_ADMIN'] // Only admins can access settings
      }
    ];

    // Filter navigation based on user role
    return baseNavigation.filter(item => 
      !user?.role || item.roles.includes(user.role)
    );
  };

  const navigation = getNavigation();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo and Title */}
      <div className="flex items-center justify-between px-4 py-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          {organization?.logoUrl ? (
            <img
              src={organization.logoUrl}
              alt={organization.name}
              className="w-8 h-8 rounded-lg object-cover border border-gray-200"
            />
          ) : (
            <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
              <BuildingOfficeIcon className="w-5 h-5 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-lg font-bold text-gray-900 truncate max-w-[140px]">
              {organization?.name || 'Organization'}
            </h1>
            <p className="text-xs text-gray-500">Payment Management</p>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-500"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      {/* User Info */}
      <div className="px-4 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name || 'Organization User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email}
            </p>
            <div className="flex items-center mt-1">
              <CheckCircleIcon className="w-3 h-3 text-green-500 mr-1" />
              <span className="text-xs text-green-600 font-medium">
                {user?.role?.replace('ORG_', '').replace('_', ' ') || 'Member'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.current ? item.iconSolid : item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`
                group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                ${item.current
                  ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
            >
              <Icon className={`w-5 h-5 mr-3 ${item.current ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Organization Info */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Status</span>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${
                organization?.status === 'ACTIVE' ? 'bg-green-400' : 'bg-yellow-400'
              }`}></div>
              <span className={`font-medium ${
                organization?.status === 'ACTIVE' ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {organization?.status === 'ACTIVE' ? 'Active' : 'Setup Required'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Payment Status</span>
            <div className="flex items-center space-x-1">
              <CheckCircleIcon className="w-4 h-4 text-green-500" />
              <span className="text-green-600 font-medium">Enabled</span>
            </div>
          </div>

          {organization?.industry && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Industry</span>
              <span className="text-gray-900 font-medium text-right max-w-[100px] truncate">
                {organization.industry}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Logout */}
      <div className="px-4 py-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
        >
          <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex flex-col w-full max-w-xs bg-white shadow-xl">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200 shadow-sm">
        <SidebarContent />
      </div>

      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg bg-white shadow-lg border border-gray-200 text-gray-600 hover:text-gray-900"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
      </div>
    </>
  );
}