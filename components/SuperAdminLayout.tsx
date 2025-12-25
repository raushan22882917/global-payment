'use client';

import { useEffect, useState } from 'react';
import SuperAdminSidebar from './SuperAdminSidebar';
import { getOrganizationRequests } from '@/lib/database';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function SuperAdminLayout({ children, title, subtitle }: SuperAdminLayoutProps) {
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        const requests = await getOrganizationRequests();
        const pending = requests.filter(req => req.status === 'PENDING').length;
        setPendingRequests(pending);
      } catch (error) {
        console.error('Failed to fetch pending requests:', error);
        setPendingRequests(0); // Set to 0 on error
      }
    };

    fetchPendingRequests();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <SuperAdminSidebar pendingRequests={pendingRequests} />
      
      {/* Main content */}
      <div className="lg:pl-72">
        {/* Header */}
        {(title || subtitle) && (
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  {title && (
                    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                  )}
                  {subtitle && (
                    <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
                  )}
                </div>
                
                {/* Quick actions */}
                <div className="flex items-center space-x-3">
                  {pendingRequests > 0 && (
                    <div className="flex items-center space-x-2 px-3 py-1.5 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                      <span>{pendingRequests} pending request{pendingRequests !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Auto-Reply Active</span>
                  </div>
                </div>
              </div>
            </div>
          </header>
        )}
        
        {/* Page content */}
        <main className="px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}