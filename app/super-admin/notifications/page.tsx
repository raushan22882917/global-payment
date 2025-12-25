'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import SuperAdminLayout from '@/components/SuperAdminLayout';
import { 
  BellIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
  EyeIcon,
  TrashIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';

interface Notification {
  id: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  category: 'SYSTEM' | 'SECURITY' | 'PAYMENT' | 'USER' | 'ORGANIZATION';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionRequired: boolean;
  relatedEntity?: {
    type: 'USER' | 'ORGANIZATION' | 'PAYMENT';
    id: string;
    name: string;
  };
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  categories: {
    system: boolean;
    security: boolean;
    payment: boolean;
    user: boolean;
    organization: boolean;
  };
}

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'ACTION_REQUIRED'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'SYSTEM' | 'SECURITY' | 'PAYMENT' | 'USER' | 'ORGANIZATION'>('ALL');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'SUPER_ADMIN' && !user.isSuperAdmin))) {
      router.push('/');
      return;
    }

    if (user) {
      fetchNotifications();
    }
  }, [user, loading, router]);

  const fetchNotifications = async () => {
    try {
      // Mock notifications - in real app, fetch from database
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'WARNING',
          category: 'SECURITY',
          title: 'Multiple Failed Login Attempts',
          message: 'User raushan22882917@gmail.com has 5 failed login attempts in the last hour.',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          read: false,
          actionRequired: true,
          relatedEntity: {
            type: 'USER',
            id: 'user-1',
            name: 'raushan22882917@gmail.com'
          }
        },
        {
          id: '2',
          type: 'SUCCESS',
          category: 'ORGANIZATION',
          title: 'New Organization Approved',
          message: 'ABC Corporation has been successfully approved and activated.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          read: false,
          actionRequired: false,
          relatedEntity: {
            type: 'ORGANIZATION',
            id: 'org-1',
            name: 'ABC Corporation'
          }
        },
        {
          id: '3',
          type: 'INFO',
          category: 'SYSTEM',
          title: 'System Maintenance Scheduled',
          message: 'Scheduled maintenance window: Tomorrow 2:00 AM - 4:00 AM UTC.',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          read: true,
          actionRequired: false
        },
        {
          id: '4',
          type: 'ERROR',
          category: 'PAYMENT',
          title: 'Payment Gateway Error',
          message: 'Razorpay gateway is experiencing connectivity issues. 15 transactions failed.',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          read: false,
          actionRequired: true,
          relatedEntity: {
            type: 'PAYMENT',
            id: 'payment-1',
            name: 'Razorpay Gateway'
          }
        },
        {
          id: '5',
          type: 'INFO',
          category: 'USER',
          title: 'New User Registration',
          message: 'finance@newcompany.com has registered and is pending approval.',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
          read: true,
          actionRequired: true,
          relatedEntity: {
            type: 'USER',
            id: 'user-2',
            name: 'finance@newcompany.com'
          }
        }
      ];

      const mockSettings: NotificationSettings = {
        email: true,
        push: true,
        sms: false,
        categories: {
          system: true,
          security: true,
          payment: true,
          user: true,
          organization: true
        }
      };

      setNotifications(mockNotifications);
      setSettings(mockSettings);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
      setSettings(null);
    } finally {
      setDataLoading(false);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
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

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = 
      filter === 'ALL' || 
      (filter === 'UNREAD' && !notification.read) ||
      (filter === 'ACTION_REQUIRED' && notification.actionRequired);
    
    const matchesCategory = categoryFilter === 'ALL' || notification.category === categoryFilter;
    
    return matchesFilter && matchesCategory;
  });

  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    actionRequired: notifications.filter(n => n.actionRequired).length,
    critical: notifications.filter(n => n.type === 'ERROR').length
  };

  return (
    <SuperAdminLayout 
      title="Notifications" 
      subtitle="Manage system notifications and alerts"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Notifications</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500">
              <BellIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unread</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.unread}</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-500">
              <ExclamationTriangleIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Action Required</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.actionRequired}</p>
            </div>
            <div className="p-3 rounded-lg bg-red-500">
              <ExclamationTriangleIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.critical}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500">
              <XMarkIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <h3 className="text-lg font-semibold text-gray-900">All Notifications</h3>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              {/* Filters */}
              <div className="flex items-center space-x-2">
                {(['ALL', 'UNREAD', 'ACTION_REQUIRED'] as const).map((filterType) => (
                  <button
                    key={filterType}
                    onClick={() => setFilter(filterType)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      filter === filterType
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {filterType === 'ALL' ? 'All' : 
                     filterType === 'UNREAD' ? 'Unread' : 'Action Required'}
                  </button>
                ))}
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="ALL">All Categories</option>
                <option value="SYSTEM">System</option>
                <option value="SECURITY">Security</option>
                <option value="PAYMENT">Payment</option>
                <option value="USER">User</option>
                <option value="ORGANIZATION">Organization</option>
              </select>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={markAllAsRead}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Mark All Read
                </button>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Cog6ToothIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && settings && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Notification Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-3">Delivery Methods</h5>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.email}
                      onChange={(e) => setSettings(prev => prev ? {...prev, email: e.target.checked} : null)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <EnvelopeIcon className="w-4 h-4 text-gray-500 ml-2 mr-2" />
                    <span className="text-sm text-gray-700">Email Notifications</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.push}
                      onChange={(e) => setSettings(prev => prev ? {...prev, push: e.target.checked} : null)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <ComputerDesktopIcon className="w-4 h-4 text-gray-500 ml-2 mr-2" />
                    <span className="text-sm text-gray-700">Push Notifications</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.sms}
                      onChange={(e) => setSettings(prev => prev ? {...prev, sms: e.target.checked} : null)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <DevicePhoneMobileIcon className="w-4 h-4 text-gray-500 ml-2 mr-2" />
                    <span className="text-sm text-gray-700">SMS Notifications</span>
                  </label>
                </div>
              </div>
              
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-3">Categories</h5>
                <div className="space-y-2">
                  {Object.entries(settings.categories).map(([category, enabled]) => (
                    <label key={category} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => setSettings(prev => prev ? {
                          ...prev, 
                          categories: {...prev.categories, [category]: e.target.checked}
                        } : null)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 ml-3 capitalize">{category}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="p-6">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <BellIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Notifications</h3>
              <p className="text-gray-600">
                {filter === 'ALL' && categoryFilter === 'ALL'
                  ? 'You have no notifications at this time.'
                  : 'No notifications match your current filters.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border rounded-lg p-4 transition-all ${
                    !notification.read 
                      ? 'border-blue-200 bg-blue-50' 
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${
                        notification.type === 'SUCCESS' ? 'bg-green-100' :
                        notification.type === 'WARNING' ? 'bg-yellow-100' :
                        notification.type === 'ERROR' ? 'bg-red-100' :
                        'bg-blue-100'
                      }`}>
                        {notification.type === 'SUCCESS' ? (
                          <CheckCircleIcon className="w-4 h-4 text-green-600" />
                        ) : notification.type === 'WARNING' ? (
                          <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600" />
                        ) : notification.type === 'ERROR' ? (
                          <XMarkIcon className="w-4 h-4 text-red-600" />
                        ) : (
                          <InformationCircleIcon className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-sm font-medium text-gray-900">{notification.title}</h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                          {notification.actionRequired && (
                            <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              Action Required
                            </span>
                          )}
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                            {notification.category}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{notification.timestamp.toLocaleString()}</span>
                          {notification.relatedEntity && (
                            <span>
                              Related: {notification.relatedEntity.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Mark as read"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded"
                        title="Delete notification"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
}