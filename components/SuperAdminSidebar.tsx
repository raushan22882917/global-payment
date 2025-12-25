'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  HomeIcon,
  BuildingOfficeIcon,
  UsersIcon,
  DocumentTextIcon,
  CreditCardIcon,
  BellIcon,
  CogIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  BuildingOfficeIcon as BuildingOfficeIconSolid,
  UsersIcon as UsersIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  CreditCardIcon as CreditCardIconSolid,
  BellIcon as BellIconSolid,
  CogIcon as CogIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  ShieldCheckIcon as ShieldCheckIconSolid
} from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

interface SidebarProps {
  pendingRequests?: number;
}

export default function SuperAdminSidebar({ pendingRequests = 0 }: SidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/super-admin/dashboard',
      icon: HomeIcon,
      iconSolid: HomeIconSolid,
      current: pathname === '/super-admin/dashboard'
    },
    {
      name: 'Organization Requests',
      href: '/super-admin/requests',
      icon: DocumentTextIcon,
      iconSolid: DocumentTextIconSolid,
      current: pathname === '/super-admin/requests',
      badge: pendingRequests > 0 ? pendingRequests : undefined
    },
    {
      name: 'Organizations',
      href: '/super-admin/organizations',
      icon: BuildingOfficeIcon,
      iconSolid: BuildingOfficeIconSolid,
      current: pathname === '/super-admin/organizations'
    },
    {
      name: 'User Management',
      href: '/super-admin/users',
      icon: UsersIcon,
      iconSolid: UsersIconSolid,
      current: pathname === '/super-admin/users'
    },
    {
      name: 'Analytics',
      href: '/super-admin/analytics',
      icon: ChartBarIcon,
      iconSolid: ChartBarIconSolid,
      current: pathname === '/super-admin/analytics'
    },
    {
      name: 'Payment Systems',
      href: '/super-admin/payments',
      icon: CreditCardIcon,
      iconSolid: CreditCardIconSolid,
      current: pathname === '/super-admin/payments'
    },
    {
      name: 'Security & Audit',
      href: '/super-admin/security',
      icon: ShieldCheckIcon,
      iconSolid: ShieldCheckIconSolid,
      current: pathname === '/super-admin/security'
    },
    {
      name: 'Notifications',
      href: '/super-admin/notifications',
      icon: BellIcon,
      iconSolid: BellIconSolid,
      current: pathname === '/super-admin/notifications'
    },
    {
      name: 'Settings',
      href: '/super-admin/settings',
      icon: CogIcon,
      iconSolid: CogIconSolid,
      current: pathname === '/super-admin/settings'
    }
  ];

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
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <ShieldCheckIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Super Admin</h1>
            <p className="text-xs text-gray-500">Organization Manager</p>
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
          <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {user?.name?.charAt(0) || user?.email?.charAt(0) || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name || 'Super Admin'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email}
            </p>
            <div className="flex items-center mt-1">
              <CheckCircleIcon className="w-3 h-3 text-green-500 mr-1" />
              <span className="text-xs text-green-600 font-medium">Active</span>
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
                group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                ${item.current
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-5 h-5 ${item.current ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className={`
                  inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full
                  ${item.current 
                    ? 'bg-white/20 text-white' 
                    : 'bg-red-100 text-red-800'
                  }
                `}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Quick Stats */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">System Status</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-600 font-medium">Online</span>
            </div>
          </div>
          
          {pendingRequests > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Pending Requests</span>
              <div className="flex items-center space-x-1">
                <ClockIcon className="w-4 h-4 text-orange-500" />
                <span className="text-orange-600 font-medium">{pendingRequests}</span>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Auto-Reply</span>
            <div className="flex items-center space-x-1">
              <CheckCircleIcon className="w-4 h-4 text-green-500" />
              <span className="text-green-600 font-medium">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="px-4 py-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
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