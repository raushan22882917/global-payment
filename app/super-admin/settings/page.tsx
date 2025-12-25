'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import SuperAdminLayout from '@/components/SuperAdminLayout';
import { 
  Cog6ToothIcon, 
  UserIcon,
  ShieldCheckIcon,
  BellIcon,
  GlobeAltIcon,
  CreditCardIcon,
  EnvelopeIcon,
  KeyIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { getAutoReplyStatus, updateAutoReplyConfig } from '@/lib/auto-reply';
import toast from 'react-hot-toast';

interface SystemSettings {
  general: {
    siteName: string;
    siteUrl: string;
    adminEmail: string;
    timezone: string;
    language: string;
  };
  security: {
    requireTwoFactor: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
    requirePasswordChange: boolean;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    adminNotifications: boolean;
  };
  autoReply: {
    enabled: boolean;
    delayMinutes: number;
    template: string;
  };
  payment: {
    defaultCurrency: string;
    allowMultipleCurrencies: boolean;
    requireApproval: boolean;
    maxTransactionAmount: number;
  };
}

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications' | 'autoReply' | 'payment'>('general');

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'SUPER_ADMIN' && !user.isSuperAdmin))) {
      router.push('/');
      return;
    }

    if (user) {
      fetchSettings();
    }
  }, [user, loading, router]);

  const fetchSettings = async () => {
    try {
      const autoReplyStatus = getAutoReplyStatus();
      
      // Mock settings - in real app, fetch from database
      const mockSettings: SystemSettings = {
        general: {
          siteName: 'Organization Management System',
          siteUrl: 'https://yourapp.com',
          adminEmail: 'admin@yourapp.com',
          timezone: 'UTC',
          language: 'en'
        },
        security: {
          requireTwoFactor: false,
          sessionTimeout: 30,
          maxLoginAttempts: 5,
          passwordMinLength: 8,
          requirePasswordChange: false
        },
        notifications: {
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
          adminNotifications: true
        },
        autoReply: {
          enabled: autoReplyStatus.enabled,
          delayMinutes: autoReplyStatus.delayMinutes,
          template: 'Thank you for your organization setup request. We will contact you within {{delayMinutes}} minutes.'
        },
        payment: {
          defaultCurrency: 'INR',
          allowMultipleCurrencies: true,
          requireApproval: true,
          maxTransactionAmount: 100000
        }
      };

      setSettings(mockSettings);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setSettings(null);
    } finally {
      setDataLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      // Update auto-reply configuration
      updateAutoReplyConfig({
        enabled: settings.autoReply.enabled,
        delayMinutes: settings.autoReply.delayMinutes
      });

      // In real app, save all settings to database
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (section: keyof SystemSettings, key: string, value: any) => {
    if (!settings) return;
    
    setSettings(prev => prev ? {
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    } : null);
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

  if (!settings) {
    return (
      <SuperAdminLayout title="Settings" subtitle="System configuration and preferences">
        <div className="text-center py-12">
          <Cog6ToothIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Settings</h3>
          <p className="text-gray-600">There was an error loading the system settings.</p>
        </div>
      </SuperAdminLayout>
    );
  }

  const tabs = [
    { id: 'general', name: 'General', icon: Cog6ToothIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'autoReply', name: 'Auto-Reply', icon: EnvelopeIcon },
    { id: 'payment', name: 'Payment', icon: CreditCardIcon }
  ] as const;

  return (
    <SuperAdminLayout 
      title="Settings" 
      subtitle="Configure system settings and preferences"
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {tabs.find(t => t.id === activeTab)?.name} Settings
                </h3>
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* General Settings */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Site Name
                    </label>
                    <input
                      type="text"
                      value={settings.general.siteName}
                      onChange={(e) => updateSetting('general', 'siteName', e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Site URL
                    </label>
                    <input
                      type="url"
                      value={settings.general.siteUrl}
                      onChange={(e) => updateSetting('general', 'siteUrl', e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Email
                    </label>
                    <input
                      type="email"
                      value={settings.general.adminEmail}
                      onChange={(e) => updateSetting('general', 'adminEmail', e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timezone
                      </label>
                      <select
                        value={settings.general.timezone}
                        onChange={(e) => updateSetting('general', 'timezone', e.target.value)}
                        className="input-field"
                      >
                        <option value="UTC">UTC</option>
                        <option value="Asia/Kolkata">Asia/Kolkata</option>
                        <option value="America/New_York">America/New_York</option>
                        <option value="Europe/London">Europe/London</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Language
                      </label>
                      <select
                        value={settings.general.language}
                        onChange={(e) => updateSetting('general', 'language', e.target.value)}
                        className="input-field"
                      >
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Require Two-Factor Authentication</h4>
                      <p className="text-sm text-gray-500">Require all users to enable 2FA</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.security.requireTwoFactor}
                        onChange={(e) => updateSetting('security', 'requireTwoFactor', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Session Timeout (minutes)
                      </label>
                      <input
                        type="number"
                        value={settings.security.sessionTimeout}
                        onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                        className="input-field"
                        min="5"
                        max="480"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Login Attempts
                      </label>
                      <input
                        type="number"
                        value={settings.security.maxLoginAttempts}
                        onChange={(e) => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
                        className="input-field"
                        min="3"
                        max="10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Password Length
                      </label>
                      <input
                        type="number"
                        value={settings.security.passwordMinLength}
                        onChange={(e) => updateSetting('security', 'passwordMinLength', parseInt(e.target.value))}
                        className="input-field"
                        min="6"
                        max="20"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Require Password Change</h4>
                        <p className="text-sm text-gray-500">Force password change every 90 days</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.security.requirePasswordChange}
                          onChange={(e) => updateSetting('security', 'requirePasswordChange', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Settings */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                        <p className="text-sm text-gray-500">Send notifications via email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications.emailEnabled}
                          onChange={(e) => updateSetting('notifications', 'emailEnabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">SMS Notifications</h4>
                        <p className="text-sm text-gray-500">Send notifications via SMS</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications.smsEnabled}
                          onChange={(e) => updateSetting('notifications', 'smsEnabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Push Notifications</h4>
                        <p className="text-sm text-gray-500">Send browser push notifications</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications.pushEnabled}
                          onChange={(e) => updateSetting('notifications', 'pushEnabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Admin Notifications</h4>
                        <p className="text-sm text-gray-500">Receive all system notifications</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications.adminNotifications}
                          onChange={(e) => updateSetting('notifications', 'adminNotifications', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Auto-Reply Settings */}
              {activeTab === 'autoReply' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Enable Auto-Reply</h4>
                      <p className="text-sm text-gray-500">Automatically respond to organization requests</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.autoReply.enabled}
                        onChange={(e) => updateSetting('autoReply', 'enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Response Delay (minutes)
                    </label>
                    <input
                      type="number"
                      value={settings.autoReply.delayMinutes}
                      onChange={(e) => updateSetting('autoReply', 'delayMinutes', parseInt(e.target.value))}
                      className="input-field"
                      min="1"
                      max="60"
                      disabled={!settings.autoReply.enabled}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      How long to wait before sending the auto-reply email
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Template
                    </label>
                    <textarea
                      value={settings.autoReply.template}
                      onChange={(e) => updateSetting('autoReply', 'template', e.target.value)}
                      className="input-field"
                      rows={6}
                      disabled={!settings.autoReply.enabled}
                      placeholder="Enter your auto-reply email template..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Available variables: {`{{organizationName}}, {{contactEmail}}, {{delayMinutes}}`}
                    </p>
                  </div>

                  <div className={`p-4 rounded-lg border ${
                    settings.autoReply.enabled 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex items-center space-x-2">
                      {settings.autoReply.enabled ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                      ) : (
                        <ExclamationTriangleIcon className="w-5 h-5 text-gray-500" />
                      )}
                      <span className={`text-sm font-medium ${
                        settings.autoReply.enabled ? 'text-green-800' : 'text-gray-700'
                      }`}>
                        Auto-Reply Status: {settings.autoReply.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <p className={`text-sm mt-1 ${
                      settings.autoReply.enabled ? 'text-green-700' : 'text-gray-600'
                    }`}>
                      {settings.autoReply.enabled 
                        ? `Responses will be sent automatically after ${settings.autoReply.delayMinutes} minutes`
                        : 'Enable auto-reply to automatically respond to organization requests'
                      }
                    </p>
                  </div>
                </div>
              )}

              {/* Payment Settings */}
              {activeTab === 'payment' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Currency
                      </label>
                      <select
                        value={settings.payment.defaultCurrency}
                        onChange={(e) => updateSetting('payment', 'defaultCurrency', e.target.value)}
                        className="input-field"
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Transaction Amount
                      </label>
                      <input
                        type="number"
                        value={settings.payment.maxTransactionAmount}
                        onChange={(e) => updateSetting('payment', 'maxTransactionAmount', parseInt(e.target.value))}
                        className="input-field"
                        min="1000"
                        max="10000000"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Allow Multiple Currencies</h4>
                        <p className="text-sm text-gray-500">Organizations can use different currencies</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.payment.allowMultipleCurrencies}
                          onChange={(e) => updateSetting('payment', 'allowMultipleCurrencies', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Require Approval</h4>
                        <p className="text-sm text-gray-500">All payments require admin approval</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.payment.requireApproval}
                          onChange={(e) => updateSetting('payment', 'requireApproval', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}