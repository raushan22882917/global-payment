'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  ClockIcon,
  EnvelopeIcon,
  PhoneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { getOrganization } from '@/lib/database';
import { Organization } from '@/types';

export default function OrganizationInfoPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ORG_USER')) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.orgId) {
      fetchOrganizationData();
    }
  }, [user]);

  const fetchOrganizationData = async () => {
    if (!user?.orgId) return;
    
    try {
      const orgData = await getOrganization(user.orgId);
      setOrganization(orgData);
    } catch (error) {
      console.error('Failed to fetch organization data:', error);
      setOrganization(null);
    } finally {
      setDataLoading(false);
    }
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading organization information...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'ORG_USER') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/org/user-dashboard"
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Organization Information</h1>
                <p className="text-sm text-gray-600">View details about your organization</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {organization ? (
          <div className="space-y-8">
            {/* Organization Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-start space-x-6">
                {organization.logoUrl ? (
                  <img
                    src={organization.logoUrl}
                    alt={organization.name}
                    className="w-20 h-20 rounded-xl object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl flex items-center justify-center">
                    <BuildingOfficeIcon className="w-10 h-10 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-gray-900">{organization.name}</h2>
                  {organization.description && (
                    <p className="text-gray-600 mt-2">{organization.description}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        organization.status === 'ACTIVE' ? 'bg-green-500' : 'bg-yellow-500'
                      }`}></div>
                      <span className={`text-sm font-medium ${
                        organization.status === 'ACTIVE' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {organization.status}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      Since {new Date(organization.createdAt).getFullYear()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Banner */}
            <div className={`p-6 rounded-xl border ${
              organization.status === 'ACTIVE' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-start space-x-3">
                {organization.status === 'ACTIVE' ? (
                  <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h3 className={`font-semibold ${
                    organization.status === 'ACTIVE' ? 'text-green-900' : 'text-yellow-900'
                  }`}>
                    {organization.status === 'ACTIVE' ? 'Organization Active' : 'Setup in Progress'}
                  </h3>
                  <p className={`text-sm ${
                    organization.status === 'ACTIVE' ? 'text-green-700' : 'text-yellow-700'
                  }`}>
                    {organization.status === 'ACTIVE' 
                      ? 'All systems are operational. You can create payment requests and access all features.'
                      : 'Your organization is being set up. Some features may be limited until setup is complete.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Basic Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <BuildingOfficeIcon className="w-5 h-5 mr-2 text-gray-500" />
                  Basic Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Business Type</span>
                    <span className="text-sm font-medium text-gray-900">{organization.businessType}</span>
                  </div>
                  {organization.industry && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Industry</span>
                      <span className="text-sm font-medium text-gray-900">{organization.industry}</span>
                    </div>
                  )}
                  {organization.employeeCount && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Employee Count</span>
                      <span className="text-sm font-medium text-gray-900">{organization.employeeCount}</span>
                    </div>
                  )}
                  {organization.foundedYear && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Founded</span>
                      <span className="text-sm font-medium text-gray-900">{organization.foundedYear}</span>
                    </div>
                  )}
                  {organization.website && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Website</span>
                      <a
                        href={organization.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center"
                      >
                        <GlobeAltIcon className="w-4 h-4 mr-1" />
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <EnvelopeIcon className="w-5 h-5 mr-2 text-gray-500" />
                  Contact Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Email</span>
                    <a
                      href={`mailto:${organization.contactEmail}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      {organization.contactEmail}
                    </a>
                  </div>
                  {organization.contactPhone && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Phone</span>
                      <a
                        href={`tel:${organization.contactPhone}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center"
                      >
                        <PhoneIcon className="w-4 h-4 mr-1" />
                        {organization.contactPhone}
                      </a>
                    </div>
                  )}
                  {organization.address && (
                    <div>
                      <span className="text-sm text-gray-600 block mb-2">Address</span>
                      <div className="text-sm font-medium text-gray-900 space-y-1">
                        <p>{organization.address.street}</p>
                        <p>{organization.address.city}, {organization.address.state}</p>
                        <p>{organization.address.postalCode}</p>
                        <p>{organization.address.country}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Regional Settings */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <MapPinIcon className="w-5 h-5 mr-2 text-gray-500" />
                  Regional Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Country</span>
                    <span className="text-sm font-medium text-gray-900">{organization.country}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Currency</span>
                    <span className="text-sm font-medium text-gray-900 flex items-center">
                      <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                      {organization.currency}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Timezone</span>
                    <span className="text-sm font-medium text-gray-900 flex items-center">
                      <ClockIcon className="w-4 h-4 mr-1" />
                      {organization.timezone}
                    </span>
                  </div>
                </div>
              </div>

              {/* System Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">System Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Organization ID</span>
                    <span className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                      {organization.id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Created</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(organization.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {organization.registrationNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Registration Number</span>
                      <span className="text-sm font-medium text-gray-900">
                        {organization.registrationNumber}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <BuildingOfficeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Organization Not Found</h3>
            <p className="text-gray-600 mb-6">
              We couldn't load your organization information. This might be a temporary issue.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        )}
      </main>
    </div>
  );
}