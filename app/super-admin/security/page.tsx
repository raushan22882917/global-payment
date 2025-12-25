'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import SuperAdminLayout from '@/components/SuperAdminLayout';
import { 
  ShieldCheckIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ClockIcon,
  UserIcon,
  ComputerDesktopIcon,
  KeyIcon,
  LockClosedIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface SecurityEvent {
  id: string;
  type: 'LOGIN' | 'LOGOUT' | 'FAILED_LOGIN' | 'PASSWORD_CHANGE' | 'PERMISSION_CHANGE' | 'DATA_ACCESS';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  user: string;
  description: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  status: 'RESOLVED' | 'INVESTIGATING' | 'OPEN';
}

interface SecurityMetrics {
  totalEvents: number;
  criticalAlerts: number;
  failedLogins: number;
  successfulLogins: number;
  activeUsers: number;
  securityScore: number;
}

export default function SecurityAuditPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'SUPER_ADMIN' && !user.isSuperAdmin))) {
      router.push('/');
      return;
    }

    if (user) {
      fetchSecurityData();
    }
  }, [user, loading, router, timeRange]);

  const fetchSecurityData = async () => {
    try {
      // Mock security events - in real app, fetch from audit logs
      const mockEvents: SecurityEvent[] = [
        {
          id: '1',
          type: 'LOGIN',
          severity: 'LOW',
          user: 'raushan22882917@gmail.com',
          description: 'Successful login',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          timestamp: new Date(),
          status: 'RESOLVED'
        },
        {
          id: '2',
          type: 'FAILED_LOGIN',
          severity: 'MEDIUM',
          user: 'unknown@example.com',
          description: 'Failed login attempt - invalid credentials',
          ipAddress: '203.0.113.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          status: 'INVESTIGATING'
        },
        {
          id: '3',
          type: 'PERMISSION_CHANGE',
          severity: 'HIGH',
          user: 'admin@company.com',
          description: 'User role changed from ORG_MEMBER to ORG_ADMIN',
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          status: 'RESOLVED'
        },
        {
          id: '4',
          type: 'DATA_ACCESS',
          severity: 'MEDIUM',
          user: 'finance@company.com',
          description: 'Accessed payment configuration data',
          ipAddress: '192.168.1.102',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          status: 'RESOLVED'
        },
        {
          id: '5',
          type: 'FAILED_LOGIN',
          severity: 'CRITICAL',
          user: 'raushan22882917@gmail.com',
          description: 'Multiple failed login attempts detected',
          ipAddress: '198.51.100.1',
          userAgent: 'curl/7.68.0',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
          status: 'OPEN'
        }
      ];

      const mockMetrics: SecurityMetrics = {
        totalEvents: mockEvents.length,
        criticalAlerts: mockEvents.filter(e => e.severity === 'CRITICAL').length,
        failedLogins: mockEvents.filter(e => e.type === 'FAILED_LOGIN').length,
        successfulLogins: mockEvents.filter(e => e.type === 'LOGIN').length,
        activeUsers: 12,
        securityScore: 85
      };

      setEvents(mockEvents);
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to fetch security data:', error);
      setEvents([]);
      setMetrics(null);
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

  const filteredEvents = events.filter(event => {
    if (filter === 'ALL') return true;
    return event.severity === filter;
  });

  const criticalEvents = events.filter(e => e.severity === 'CRITICAL' && e.status === 'OPEN');

  return (
    <SuperAdminLayout 
      title="Security & Audit" 
      subtitle="Monitor system security and audit logs"
    >
      {/* Critical Alerts */}
      {criticalEvents.length > 0 && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Critical Security Alerts</h3>
              <p className="text-sm text-red-700 mt-1">
                {criticalEvents.length} critical security event{criticalEvents.length > 1 ? 's' : ''} require{criticalEvents.length === 1 ? 's' : ''} immediate attention.
              </p>
              <button className="mt-2 text-sm font-medium text-red-800 hover:text-red-900">
                View Details →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Security Score</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{metrics?.securityScore}%</p>
                </div>
                <div className={`p-2 rounded-lg ${
                  (metrics?.securityScore || 0) >= 90 ? 'bg-green-500' :
                  (metrics?.securityScore || 0) >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                }`}>
                  <ShieldCheckIcon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{metrics?.criticalAlerts}</p>
                </div>
                <div className="p-2 rounded-lg bg-red-500">
                  <ExclamationTriangleIcon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Failed Logins</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{metrics?.failedLogins}</p>
                </div>
                <div className="p-2 rounded-lg bg-orange-500">
                  <XCircleIcon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{metrics?.activeUsers}</p>
                </div>
                <div className="p-2 rounded-lg bg-blue-500">
                  <UserIcon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Firewall</span>
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-600">Active</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">SSL Certificate</span>
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-600">Valid</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">2FA Enforcement</span>
              <div className="flex items-center space-x-2">
                <XCircleIcon className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-red-600">Disabled</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Audit Logging</span>
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-600">Enabled</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Events */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <h3 className="text-lg font-semibold text-gray-900">Security Events</h3>
            
            <div className="flex items-center space-x-4">
              {/* Time Range */}
              <div className="flex items-center space-x-2">
                {(['24h', '7d', '30d'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      timeRange === range
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {range === '24h' ? 'Last 24h' : range === '7d' ? 'Last 7 days' : 'Last 30 days'}
                  </button>
                ))}
              </div>

              {/* Severity Filter */}
              <div className="flex items-center space-x-2">
                {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((severity) => (
                  <button
                    key={severity}
                    onClick={() => setFilter(severity)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      filter === severity
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {severity === 'ALL' ? 'All' : severity.charAt(0) + severity.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <ShieldCheckIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Security Events</h3>
              <p className="text-gray-600">
                {filter === 'ALL' 
                  ? 'No security events found for the selected time period.'
                  : `No ${filter.toLowerCase()} severity events found.`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <div key={event.id} className={`border rounded-lg p-4 ${
                  event.severity === 'CRITICAL' ? 'border-red-200 bg-red-50' :
                  event.severity === 'HIGH' ? 'border-orange-200 bg-orange-50' :
                  event.severity === 'MEDIUM' ? 'border-yellow-200 bg-yellow-50' :
                  'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${
                        event.type === 'LOGIN' ? 'bg-green-100' :
                        event.type === 'FAILED_LOGIN' ? 'bg-red-100' :
                        event.type === 'PERMISSION_CHANGE' ? 'bg-orange-100' :
                        'bg-blue-100'
                      }`}>
                        {event.type === 'LOGIN' ? (
                          <CheckCircleIcon className={`w-4 h-4 ${
                            event.type === 'LOGIN' ? 'text-green-600' :
                            event.type === 'FAILED_LOGIN' ? 'text-red-600' :
                            event.type === 'PERMISSION_CHANGE' ? 'text-orange-600' :
                            'text-blue-600'
                          }`} />
                        ) : event.type === 'FAILED_LOGIN' ? (
                          <XCircleIcon className="w-4 h-4 text-red-600" />
                        ) : event.type === 'PERMISSION_CHANGE' ? (
                          <KeyIcon className="w-4 h-4 text-orange-600" />
                        ) : (
                          <DocumentTextIcon className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-sm font-medium text-gray-900">{event.description}</h4>
                          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                            event.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                            event.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                            event.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {event.severity}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center space-x-1">
                            <UserIcon className="w-3 h-3" />
                            <span>{event.user}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <ComputerDesktopIcon className="w-3 h-3" />
                            <span>{event.ipAddress}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <ClockIcon className="w-3 h-3" />
                            <span>{event.timestamp.toLocaleString()}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        event.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                        event.status === 'INVESTIGATING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {event.status}
                      </span>
                      <button className="text-gray-400 hover:text-gray-600 p-1 rounded">
                        <EyeIcon className="w-4 h-4" />
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