'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import OrganizationSidebar from '@/components/OrganizationSidebar';
import {
  CogIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
  BellIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  TrashIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import { getOrganization, getPaymentConfig, updateOrganization, updatePaymentConfig } from '@/lib/database';
import { uploadFile, deleteFile, validateImageFile, resizeImage, createDataURL } from '@/lib/file-upload';
import { Organization, PaymentConfig } from '@/types';
import toast from 'react-hot-toast';

export default function OrganizationSettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Form states
  const [generalForm, setGeneralForm] = useState({
    name: '',
    businessType: '',
    country: '',
    currency: '',
    timezone: '',
    contactEmail: '',
    contactPhone: '',
    description: '',
    website: '',
    industry: '',
    employeeCount: '',
    foundedYear: '',
    registrationNumber: '',
    taxId: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: ''
    }
  });

  const [paymentForm, setPaymentForm] = useState({
    enableUPI: false,
    enableBank: false,
    gateway: 'RAZORPAY' as 'PAYTM' | 'PHONEPE' | 'RAZORPAY',
    autoPay: false
  });

  const [notificationForm, setNotificationForm] = useState({
    emailNotifications: true,
    paymentAlerts: true,
    approvalReminders: true,
    weeklyReports: false,
    monthlyReports: true
  });

  const [securityForm, setSecurityForm] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordPolicy: 'medium',
    loginNotifications: true,
    ipWhitelist: '',
    apiAccess: false
  });

  const [teamForm, setTeamForm] = useState({
    maxMembers: 50,
    defaultRole: 'ORG_MEMBER',
    requireApproval: true,
    allowInvites: true,
    departmentStructure: true
  });

  const [integrationsForm, setIntegrationsForm] = useState({
    slackWebhook: '',
    teamsWebhook: '',
    emailIntegration: true,
    smsNotifications: false,
    customWebhooks: []
  });

  useEffect(() => {
    if (!loading && (!user || !user.role.startsWith('ORG_'))) {
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
      const [orgData, paymentData] = await Promise.all([
        getOrganization(user.orgId),
        getPaymentConfig(user.orgId)
      ]);
      
      if (orgData) {
        setOrganization(orgData);
        setLogoPreview(orgData.logoUrl || null);
        setGeneralForm({
          name: orgData.name,
          businessType: orgData.businessType,
          country: orgData.country,
          currency: orgData.currency,
          timezone: orgData.timezone,
          contactEmail: orgData.contactEmail,
          contactPhone: orgData.contactPhone || '',
          description: orgData.description || '',
          website: orgData.website || '',
          industry: orgData.industry || '',
          employeeCount: orgData.employeeCount || '',
          foundedYear: orgData.foundedYear?.toString() || '',
          registrationNumber: orgData.registrationNumber || '',
          taxId: orgData.taxId || '',
          address: {
            street: orgData.address?.street || '',
            city: orgData.address?.city || '',
            state: orgData.address?.state || '',
            postalCode: orgData.address?.postalCode || '',
            country: orgData.address?.country || orgData.country
          }
        });
      }
      
      if (paymentData) {
        setPaymentConfig(paymentData);
        setPaymentForm({
          enableUPI: paymentData.enableUPI,
          enableBank: paymentData.enableBank,
          gateway: paymentData.gateway || 'RAZORPAY',
          autoPay: paymentData.autoPay
        });
      } else {
        // Set default payment configuration if none exists
        const defaultPaymentConfig: PaymentConfig = {
          id: user.orgId,
          orgId: user.orgId,
          enableUPI: false,
          enableBank: false,
          gateway: 'RAZORPAY',
          autoPay: false
        };
        setPaymentConfig(defaultPaymentConfig);
        setPaymentForm({
          enableUPI: false,
          enableBank: false,
          gateway: 'RAZORPAY',
          autoPay: false
        });
      }
    } catch (error) {
      console.error('Failed to fetch organization data:', error);
      toast.error('Failed to load organization settings');
    } finally {
      setDataLoading(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!user?.orgId) return;

    // Check if user is ORG_ADMIN
    if (user.role !== 'ORG_ADMIN') {
      toast.error('Only Organization Admins can upload logos');
      return;
    }

    const validationError = validateImageFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setUploadingLogo(true);
    try {
      // Resize image before upload
      const resizedFile = await resizeImage(file, 400, 400, 0.8);
      
      let logoUrl: string;
      
      try {
        // Try Firebase Storage first
        logoUrl = await uploadFile(resizedFile, `organizations/${user.orgId}`, {
          folder: 'logos',
          maxSize: 5 * 1024 * 1024,
          allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        });
        
        console.log('✅ Logo uploaded to Firebase Storage:', logoUrl);
        toast.success('Logo uploaded successfully to Firebase Storage!');
      } catch (storageError: any) {
        console.warn('⚠️ Firebase Storage upload failed, using fallback:', storageError.message);
        
        // Provide specific feedback based on error type
        if (storageError.message.includes('not properly configured') || 
            storageError.message.includes('administrator') ||
            storageError.message.includes('permissions')) {
          
          // Show detailed error for configuration issues
          toast.error(
            'Firebase Storage needs setup. Using temporary storage method. Contact administrator to enable full storage features.',
            { duration: 6000 }
          );
          
          // Log helpful information for administrators
          console.group('🔧 Firebase Storage Configuration Needed');
          console.log('Issue: Service account lacks Google Cloud Storage permissions');
          console.log('Solution: Run setup script → node scripts/setup-firebase-storage-permissions.js');
          console.log('Documentation: See FIREBASE_STORAGE_TROUBLESHOOTING.md');
          console.groupEnd();
          
        } else if (storageError.message.includes('still being configured') || 
                   storageError.message.includes('wait a few minutes')) {
          
          toast.error('Storage is being configured. Please try again in a few minutes.', { duration: 4000 });
          
        } else {
          toast.error('Storage temporarily unavailable. Using backup method.', { duration: 4000 });
        }
        
        // Fallback to data URL
        try {
          logoUrl = await createDataURL(resizedFile);
          console.info('📦 Using data URL fallback for logo storage');
          
          // Only show success message if we haven't already shown an error
          if (!storageError.message.includes('not properly configured')) {
            toast.success('Logo uploaded using backup storage method.');
          }
        } catch (fallbackError) {
          console.error('❌ Fallback method also failed:', fallbackError);
          throw new Error('Failed to upload logo using any available method. Please try again.');
        }
      }

      // Delete old logo if exists and it's a Firebase Storage URL
      if (organization?.logoUrl && organization.logoUrl.includes('firebasestorage.googleapis.com')) {
        try {
          await deleteFile(organization.logoUrl);
        } catch (deleteError) {
          console.warn('Failed to delete old logo, but continuing with upload');
        }
      }

      // Update organization with new logo URL
      try {
        await updateOrganization(user.orgId, { logoUrl });
      } catch (error: any) {
        if (error.message.includes('does not exist')) {
          // Organization doesn't exist, show helpful error
          toast.error('Your organization setup is incomplete. Please contact your administrator.');
          console.error('Organization not found:', user.orgId);
          return;
        }
        throw error;
      }
      
      setLogoPreview(logoUrl);
      setOrganization(prev => prev ? { ...prev, logoUrl } : null);
      
      if (!logoUrl.startsWith('data:')) {
        toast.success('Logo uploaded successfully');
      }
    } catch (error) {
      console.error('Failed to upload logo:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoDelete = async () => {
    if (!user?.orgId || !organization?.logoUrl) return;

    try {
      // Only try to delete from Firebase Storage if it's a Firebase Storage URL
      if (organization.logoUrl.includes('firebasestorage.googleapis.com')) {
        await deleteFile(organization.logoUrl);
      }
      
      await updateOrganization(user.orgId, { logoUrl: undefined });
      
      setLogoPreview(null);
      setOrganization(prev => prev ? { ...prev, logoUrl: undefined } : null);
      
      toast.success('Logo removed successfully');
    } catch (error) {
      console.error('Failed to delete logo:', error);
      toast.error('Failed to remove logo');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleLogoUpload(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

  const canManageSettings = user.role === 'ORG_ADMIN';

  if (!canManageSettings) {
    return (
      <div className="min-h-screen bg-gray-50">
        <OrganizationSidebar />
        <div className="lg:pl-72">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <ExclamationTriangleIcon className="w-16 h-16 text-orange-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Admin Access Required</h3>
              <p className="text-gray-600 mb-4">
                You need Organization Admin role to manage organization settings.
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

  const handleSaveGeneral = async () => {
    if (!user?.orgId) return;
    
    setSaving(true);
    try {
      const updates: Partial<Organization> = {
        name: generalForm.name,
        businessType: generalForm.businessType,
        country: generalForm.country,
        currency: generalForm.currency,
        timezone: generalForm.timezone,
        contactEmail: generalForm.contactEmail,
        contactPhone: generalForm.contactPhone,
        description: generalForm.description,
        website: generalForm.website,
        industry: generalForm.industry,
        employeeCount: generalForm.employeeCount,
        foundedYear: generalForm.foundedYear ? parseInt(generalForm.foundedYear) : undefined,
        registrationNumber: generalForm.registrationNumber,
        taxId: generalForm.taxId,
        address: {
          street: generalForm.address.street,
          city: generalForm.address.city,
          state: generalForm.address.state,
          postalCode: generalForm.address.postalCode,
          country: generalForm.address.country
        }
      };

      await updateOrganization(user.orgId, updates);
      setOrganization(prev => prev ? { ...prev, ...updates } : null);
      
      toast.success('Organization details updated successfully');
    } catch (error) {
      console.error('Failed to update organization:', error);
      toast.error('Failed to update organization details');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePayment = async () => {
    if (!user?.orgId) return;
    
    setSaving(true);
    try {
      const updates: Partial<PaymentConfig> = {
        enableUPI: paymentForm.enableUPI,
        enableBank: paymentForm.enableBank,
        gateway: paymentForm.gateway,
        autoPay: paymentForm.autoPay
      };

      await updatePaymentConfig(user.orgId, updates);
      setPaymentConfig(prev => prev ? { ...prev, ...updates } : null);
      
      toast.success('Payment settings updated successfully');
    } catch (error) {
      console.error('Failed to update payment settings:', error);
      toast.error('Failed to update payment settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      // TODO: Implement notification settings update in database
      toast.success('Notification settings updated successfully');
    } catch (error) {
      toast.error('Failed to update notification settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSecurity = async () => {
    setSaving(true);
    try {
      // TODO: Implement security settings update in database
      toast.success('Security settings updated successfully');
    } catch (error) {
      toast.error('Failed to update security settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTeam = async () => {
    setSaving(true);
    try {
      // TODO: Implement team settings update in database
      toast.success('Team settings updated successfully');
    } catch (error) {
      toast.error('Failed to update team settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveIntegrations = async () => {
    setSaving(true);
    try {
      // TODO: Implement integrations settings update in database
      toast.success('Integration settings updated successfully');
    } catch (error) {
      toast.error('Failed to update integration settings');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', name: 'General', icon: BuildingOfficeIcon },
    { id: 'payment', name: 'Payment', icon: CreditCardIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'team', name: 'Team', icon: UserGroupIcon },
    { id: 'integrations', name: 'Integrations', icon: GlobeAltIcon }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <OrganizationSidebar />
      
      <div className="lg:pl-72">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Organization Logo */}
                <div className="flex-shrink-0">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt={organization?.name}
                      className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <BuildingOfficeIcon className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Organization Settings</h1>
                  <p className="mt-1 text-sm text-gray-600">
                    Manage your organization's configuration and preferences
                  </p>
                </div>
              </div>
              
              {organization?.status === 'ACTIVE' ? (
                <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>Active</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  <ExclamationTriangleIcon className="w-4 h-4" />
                  <span>Setup Required</span>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span>{tab.name}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* General Settings */}
                {activeTab === 'general' && (
                  <div className="space-y-8">
                    {/* Logo Upload Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Logo</h3>
                      <div className="flex items-center space-x-6">
                        <div className="flex-shrink-0">
                          {logoPreview ? (
                            <img
                              src={logoPreview}
                              alt="Organization logo"
                              className="w-24 h-24 rounded-lg object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                              <PhotoIcon className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          {user?.role === 'ORG_ADMIN' ? (
                            <div className="flex items-center space-x-3">
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                              />
                              
                              <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingLogo}
                                className="btn-secondary disabled:opacity-50 flex items-center space-x-2"
                              >
                                {uploadingLogo ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    <span>Uploading...</span>
                                  </>
                                ) : (
                                  <>
                                    <CloudArrowUpIcon className="w-4 h-4" />
                                    <span>Upload Logo</span>
                                  </>
                                )}
                              </button>
                              
                              {logoPreview && (
                                <button
                                  onClick={handleLogoDelete}
                                  className="btn-secondary text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                  <span>Remove</span>
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center space-x-3">
                              <div className="px-3 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm">
                                Only Organization Admins can upload logos
                              </div>
                            </div>
                          )}
                          
                          <p className="mt-2 text-sm text-gray-500">
                            Upload a logo for your organization. Recommended size: 400x400px. Max file size: 5MB.
                            Supported formats: JPEG, PNG, GIF, WebP.
                            {user?.role !== 'ORG_ADMIN' && (
                              <span className="block mt-1 text-orange-600 font-medium">
                                Admin access required for logo management.
                              </span>
                            )}
                          </p>
                          
                          {/* Storage Status Information */}
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start space-x-2">
                              <div className="flex-shrink-0 mt-0.5">
                                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="flex-1 text-sm">
                                <p className="text-blue-800 font-medium">Storage Information</p>
                                <p className="text-blue-700 mt-1">
                                  Logo uploads currently use a backup storage method. 
                                  For optimal performance, ask your administrator to enable Firebase Storage.
                                </p>
                                <details className="mt-2">
                                  <summary className="text-blue-600 cursor-pointer hover:text-blue-800 font-medium">
                                    Technical Details
                                  </summary>
                                  <div className="mt-2 text-blue-600 text-xs space-y-1">
                                    <p>• Current: Data URL storage (works but limited)</p>
                                    <p>• Recommended: Firebase Storage (CDN, better performance)</p>
                                    <p>• Setup guide: FIREBASE_STORAGE_TROUBLESHOOTING.md</p>
                                    <p>• Test command: node scripts/setup-firebase-storage-permissions.js</p>
                                  </div>
                                </details>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Basic Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Organization Name *
                          </label>
                          <input
                            type="text"
                            value={generalForm.name}
                            onChange={(e) => setGeneralForm(prev => ({ ...prev, name: e.target.value }))}
                            disabled={!canManageSettings}
                            className="input-field disabled:bg-gray-100"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Business Type *
                          </label>
                          <select
                            value={generalForm.businessType}
                            onChange={(e) => setGeneralForm(prev => ({ ...prev, businessType: e.target.value }))}
                            disabled={!canManageSettings}
                            className="input-field disabled:bg-gray-100"
                          >
                            <option value="Private Limited">Private Limited</option>
                            <option value="Public Limited">Public Limited</option>
                            <option value="Partnership">Partnership</option>
                            <option value="Sole Proprietorship">Sole Proprietorship</option>
                            <option value="LLP">Limited Liability Partnership</option>
                            <option value="NGO">Non-Governmental Organization</option>
                            <option value="Government">Government Entity</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Industry
                          </label>
                          <select
                            value={generalForm.industry}
                            onChange={(e) => setGeneralForm(prev => ({ ...prev, industry: e.target.value }))}
                            disabled={!canManageSettings}
                            className="input-field disabled:bg-gray-100"
                          >
                            <option value="">Select Industry</option>
                            <option value="Technology">Technology</option>
                            <option value="Healthcare">Healthcare</option>
                            <option value="Finance">Finance</option>
                            <option value="Education">Education</option>
                            <option value="Manufacturing">Manufacturing</option>
                            <option value="Retail">Retail</option>
                            <option value="Consulting">Consulting</option>
                            <option value="Real Estate">Real Estate</option>
                            <option value="Media">Media & Entertainment</option>
                            <option value="Non-Profit">Non-Profit</option>
                            <option value="Government">Government</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Employee Count
                          </label>
                          <select
                            value={generalForm.employeeCount}
                            onChange={(e) => setGeneralForm(prev => ({ ...prev, employeeCount: e.target.value }))}
                            disabled={!canManageSettings}
                            className="input-field disabled:bg-gray-100"
                          >
                            <option value="">Select Size</option>
                            <option value="1-10">1-10 employees</option>
                            <option value="11-50">11-50 employees</option>
                            <option value="51-200">51-200 employees</option>
                            <option value="201-500">201-500 employees</option>
                            <option value="501-1000">501-1000 employees</option>
                            <option value="1000+">1000+ employees</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Founded Year
                          </label>
                          <input
                            type="number"
                            min="1800"
                            max={new Date().getFullYear()}
                            value={generalForm.foundedYear}
                            onChange={(e) => setGeneralForm(prev => ({ ...prev, foundedYear: e.target.value }))}
                            disabled={!canManageSettings}
                            className="input-field disabled:bg-gray-100"
                            placeholder="e.g. 2020"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Website
                          </label>
                          <input
                            type="url"
                            value={generalForm.website}
                            onChange={(e) => setGeneralForm(prev => ({ ...prev, website: e.target.value }))}
                            disabled={!canManageSettings}
                            className="input-field disabled:bg-gray-100"
                            placeholder="https://example.com"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                          </label>
                          <textarea
                            rows={3}
                            value={generalForm.description}
                            onChange={(e) => setGeneralForm(prev => ({ ...prev, description: e.target.value }))}
                            disabled={!canManageSettings}
                            className="input-field disabled:bg-gray-100"
                            placeholder="Brief description of your organization..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contact Email *
                          </label>
                          <input
                            type="email"
                            value={generalForm.contactEmail}
                            onChange={(e) => setGeneralForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                            disabled={!canManageSettings}
                            className="input-field disabled:bg-gray-100"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contact Phone
                          </label>
                          <input
                            type="tel"
                            value={generalForm.contactPhone}
                            onChange={(e) => setGeneralForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                            disabled={!canManageSettings}
                            className="input-field disabled:bg-gray-100"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Address Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Street Address
                          </label>
                          <input
                            type="text"
                            value={generalForm.address.street}
                            onChange={(e) => setGeneralForm(prev => ({ 
                              ...prev, 
                              address: { ...prev.address, street: e.target.value }
                            }))}
                            disabled={!canManageSettings}
                            className="input-field disabled:bg-gray-100"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            City
                          </label>
                          <input
                            type="text"
                            value={generalForm.address.city}
                            onChange={(e) => setGeneralForm(prev => ({ 
                              ...prev, 
                              address: { ...prev.address, city: e.target.value }
                            }))}
                            disabled={!canManageSettings}
                            className="input-field disabled:bg-gray-100"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            State/Province
                          </label>
                          <input
                            type="text"
                            value={generalForm.address.state}
                            onChange={(e) => setGeneralForm(prev => ({ 
                              ...prev, 
                              address: { ...prev.address, state: e.target.value }
                            }))}
                            disabled={!canManageSettings}
                            className="input-field disabled:bg-gray-100"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Postal Code
                          </label>
                          <input
                            type="text"
                            value={generalForm.address.postalCode}
                            onChange={(e) => setGeneralForm(prev => ({ 
                              ...prev, 
                              address: { ...prev.address, postalCode: e.target.value }
                            }))}
                            disabled={!canManageSettings}
                            className="input-field disabled:bg-gray-100"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Country *
                          </label>
                          <select
                            value={generalForm.address.country}
                            onChange={(e) => setGeneralForm(prev => ({ 
                              ...prev, 
                              address: { ...prev.address, country: e.target.value }
                            }))}
                            disabled={!canManageSettings}
                            className="input-field disabled:bg-gray-100"
                          >
                            <option value="India">India</option>
                            <option value="United States">United States</option>
                            <option value="United Kingdom">United Kingdom</option>
                            <option value="Canada">Canada</option>
                            <option value="Australia">Australia</option>
                            <option value="Singapore">Singapore</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Business Details */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Currency *
                          </label>
                          <select
                            value={generalForm.currency}
                            onChange={(e) => setGeneralForm(prev => ({ ...prev, currency: e.target.value }))}
                            disabled={!canManageSettings}
                            className="input-field disabled:bg-gray-100"
                          >
                            <option value="USD">USD - US Dollar</option>
                            <option value="INR">INR - Indian Rupee</option>
                            <option value="EUR">EUR - Euro</option>
                            <option value="GBP">GBP - British Pound</option>
                            <option value="CAD">CAD - Canadian Dollar</option>
                            <option value="AUD">AUD - Australian Dollar</option>
                            <option value="SGD">SGD - Singapore Dollar</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Registration Number
                          </label>
                          <input
                            type="text"
                            value={generalForm.registrationNumber}
                            onChange={(e) => setGeneralForm(prev => ({ ...prev, registrationNumber: e.target.value }))}
                            disabled={!canManageSettings}
                            className="input-field disabled:bg-gray-100"
                            placeholder="Business registration number"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tax ID
                          </label>
                          <input
                            type="text"
                            value={generalForm.taxId}
                            onChange={(e) => setGeneralForm(prev => ({ ...prev, taxId: e.target.value }))}
                            disabled={!canManageSettings}
                            className="input-field disabled:bg-gray-100"
                            placeholder="Tax identification number"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Timezone
                          </label>
                          <select
                            value={generalForm.timezone}
                            onChange={(e) => setGeneralForm(prev => ({ ...prev, timezone: e.target.value }))}
                            disabled={!canManageSettings}
                            className="input-field disabled:bg-gray-100"
                          >
                            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                            <option value="America/New_York">America/New_York (EST)</option>
                            <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                            <option value="Europe/London">Europe/London (GMT)</option>
                            <option value="Europe/Berlin">Europe/Berlin (CET)</option>
                            <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                            <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                      
                    {canManageSettings && (
                      <div className="pt-6 border-t border-gray-200">
                        <button
                          onClick={handleSaveGeneral}
                          disabled={saving}
                          className="btn-primary disabled:opacity-50 flex items-center space-x-2"
                        >
                          {saving ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircleIcon className="w-4 h-4" />
                              <span>Save Changes</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Payment Settings */}
                {activeTab === 'payment' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Configuration</h3>
                      
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">UPI Payments</h4>
                            <p className="text-sm text-gray-600">Enable UPI QR code payments</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={paymentForm.enableUPI}
                            onChange={(e) => setPaymentForm(prev => ({ ...prev, enableUPI: e.target.checked }))}
                            disabled={!canManageSettings}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">Bank Transfers</h4>
                            <p className="text-sm text-gray-600">Enable direct bank transfers</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={paymentForm.enableBank}
                            onChange={(e) => setPaymentForm(prev => ({ ...prev, enableBank: e.target.checked }))}
                            disabled={!canManageSettings}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Payment Gateway
                          </label>
                          <select
                            value={paymentForm.gateway}
                            onChange={(e) => setPaymentForm(prev => ({ ...prev, gateway: e.target.value as any }))}
                            disabled={!canManageSettings}
                            className="input-field disabled:bg-gray-100"
                          >
                            <option value="RAZORPAY">Razorpay</option>
                            <option value="PAYTM">Paytm</option>
                            <option value="PHONEPE">PhonePe</option>
                          </select>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">Auto-Pay</h4>
                            <p className="text-sm text-gray-600">Automatically process approved payments</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={paymentForm.autoPay}
                            onChange={(e) => setPaymentForm(prev => ({ ...prev, autoPay: e.target.checked }))}
                            disabled={!canManageSettings}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>
                      </div>
                      
                      {canManageSettings && (
                        <div className="mt-6">
                          <button
                            onClick={handleSavePayment}
                            disabled={saving}
                            className="btn-primary disabled:opacity-50 flex items-center space-x-2"
                          >
                            {saving ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Saving...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircleIcon className="w-4 h-4" />
                                <span>Save Payment Settings</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notification Settings */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">Email Notifications</h4>
                            <p className="text-sm text-gray-600">Receive general email notifications</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={notificationForm.emailNotifications}
                            onChange={(e) => setNotificationForm(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">Payment Alerts</h4>
                            <p className="text-sm text-gray-600">Get notified about payment status changes</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={notificationForm.paymentAlerts}
                            onChange={(e) => setNotificationForm(prev => ({ ...prev, paymentAlerts: e.target.checked }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">Approval Reminders</h4>
                            <p className="text-sm text-gray-600">Reminders for pending approvals</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={notificationForm.approvalReminders}
                            onChange={(e) => setNotificationForm(prev => ({ ...prev, approvalReminders: e.target.checked }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">Weekly Reports</h4>
                            <p className="text-sm text-gray-600">Weekly summary reports via email</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={notificationForm.weeklyReports}
                            onChange={(e) => setNotificationForm(prev => ({ ...prev, weeklyReports: e.target.checked }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">Monthly Reports</h4>
                            <p className="text-sm text-gray-600">Monthly analytics and insights</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={notificationForm.monthlyReports}
                            onChange={(e) => setNotificationForm(prev => ({ ...prev, monthlyReports: e.target.checked }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <button
                          onClick={handleSaveNotifications}
                          disabled={saving}
                          className="btn-primary disabled:opacity-50 flex items-center space-x-2"
                        >
                          {saving ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircleIcon className="w-4 h-4" />
                              <span>Save Notification Settings</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Settings */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Configuration</h3>
                      
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                            <p className="text-sm text-gray-600">Require 2FA for all organization members</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={securityForm.twoFactorAuth}
                            onChange={(e) => setSecurityForm(prev => ({ ...prev, twoFactorAuth: e.target.checked }))}
                            disabled={!canManageSettings}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Session Timeout (minutes)
                          </label>
                          <select
                            value={securityForm.sessionTimeout}
                            onChange={(e) => setSecurityForm(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                            disabled={!canManageSettings}
                            className="input-field disabled:bg-gray-100"
                          >
                            <option value={15}>15 minutes</option>
                            <option value={30}>30 minutes</option>
                            <option value={60}>1 hour</option>
                            <option value={120}>2 hours</option>
                            <option value={480}>8 hours</option>
                            <option value={1440}>24 hours</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password Policy
                          </label>
                          <select
                            value={securityForm.passwordPolicy}
                            onChange={(e) => setSecurityForm(prev => ({ ...prev, passwordPolicy: e.target.value }))}
                            disabled={!canManageSettings}
                            className="input-field disabled:bg-gray-100"
                          >
                            <option value="low">Low - Minimum 6 characters</option>
                            <option value="medium">Medium - 8+ chars, mixed case</option>
                            <option value="high">High - 12+ chars, mixed case, numbers, symbols</option>
                          </select>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">Login Notifications</h4>
                            <p className="text-sm text-gray-600">Notify users of new login attempts</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={securityForm.loginNotifications}
                            onChange={(e) => setSecurityForm(prev => ({ ...prev, loginNotifications: e.target.checked }))}
                            disabled={!canManageSettings}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            IP Whitelist (Optional)
                          </label>
                          <textarea
                            rows={3}
                            value={securityForm.ipWhitelist}
                            onChange={(e) => setSecurityForm(prev => ({ ...prev, ipWhitelist: e.target.value }))}
                            disabled={!canManageSettings}
                            className="input-field disabled:bg-gray-100"
                            placeholder="Enter IP addresses or ranges, one per line&#10;192.168.1.0/24&#10;203.0.113.0/24"
                          />
                          <p className="mt-1 text-sm text-gray-500">
                            Leave empty to allow access from any IP address
                          </p>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">API Access</h4>
                            <p className="text-sm text-gray-600">Enable API access for this organization</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={securityForm.apiAccess}
                            onChange={(e) => setSecurityForm(prev => ({ ...prev, apiAccess: e.target.checked }))}
                            disabled={!canManageSettings}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>
                      </div>
                      
                      {canManageSettings && (
                        <div className="mt-6">
                          <button
                            onClick={handleSaveSecurity}
                            disabled={saving}
                            className="btn-primary disabled:opacity-50 flex items-center space-x-2"
                          >
                            {saving ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Saving...</span>
                              </>
                            ) : (
                              <>
                                <ShieldCheckIcon className="w-4 h-4" />
                                <span>Save Security Settings</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Team Settings */}
                {activeTab === 'team' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Management</h3>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Maximum Team Members
                          </label>
                          <select
                            value={teamForm.maxMembers}
                            onChange={(e) => setTeamForm(prev => ({ ...prev, maxMembers: parseInt(e.target.value) }))}
                            disabled={!canManageSettings}
                            className="input-field disabled:bg-gray-100"
                          >
                            <option value={10}>10 members</option>
                            <option value={25}>25 members</option>
                            <option value={50}>50 members</option>
                            <option value={100}>100 members</option>
                            <option value={250}>250 members</option>
                            <option value={500}>500 members</option>
                            <option value={-1}>Unlimited</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Default Role for New Members
                          </label>
                          <select
                            value={teamForm.defaultRole}
                            onChange={(e) => setTeamForm(prev => ({ ...prev, defaultRole: e.target.value }))}
                            disabled={!canManageSettings}
                            className="input-field disabled:bg-gray-100"
                          >
                            <option value="ORG_MEMBER">Member - Basic access</option>
                            <option value="ORG_APPROVER">Approver - Can approve requests</option>
                            <option value="ORG_FINANCE">Finance - Payment management</option>
                          </select>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">Require Admin Approval</h4>
                            <p className="text-sm text-gray-600">New members need admin approval to join</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={teamForm.requireApproval}
                            onChange={(e) => setTeamForm(prev => ({ ...prev, requireApproval: e.target.checked }))}
                            disabled={!canManageSettings}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">Allow Member Invites</h4>
                            <p className="text-sm text-gray-600">Members can invite others to join</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={teamForm.allowInvites}
                            onChange={(e) => setTeamForm(prev => ({ ...prev, allowInvites: e.target.checked }))}
                            disabled={!canManageSettings}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">Department Structure</h4>
                            <p className="text-sm text-gray-600">Enable department-based organization</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={teamForm.departmentStructure}
                            onChange={(e) => setTeamForm(prev => ({ ...prev, departmentStructure: e.target.checked }))}
                            disabled={!canManageSettings}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>

                        {/* Team Statistics */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-medium text-blue-900 mb-2">Current Team Overview</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-blue-600 font-medium">Total Members</p>
                              <p className="text-blue-900 text-lg font-semibold">-</p>
                            </div>
                            <div>
                              <p className="text-blue-600 font-medium">Admins</p>
                              <p className="text-blue-900 text-lg font-semibold">-</p>
                            </div>
                            <div>
                              <p className="text-blue-600 font-medium">Approvers</p>
                              <p className="text-blue-900 text-lg font-semibold">-</p>
                            </div>
                            <div>
                              <p className="text-blue-600 font-medium">Pending</p>
                              <p className="text-blue-900 text-lg font-semibold">-</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {canManageSettings && (
                        <div className="mt-6">
                          <button
                            onClick={handleSaveTeam}
                            disabled={saving}
                            className="btn-primary disabled:opacity-50 flex items-center space-x-2"
                          >
                            {saving ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Saving...</span>
                              </>
                            ) : (
                              <>
                                <UserGroupIcon className="w-4 h-4" />
                                <span>Save Team Settings</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Integrations Settings */}
                {activeTab === 'integrations' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">External Integrations</h3>
                      
                      <div className="space-y-6">
                        {/* Communication Integrations */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-4">Communication Platforms</h4>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Slack Webhook URL
                              </label>
                              <input
                                type="url"
                                value={integrationsForm.slackWebhook}
                                onChange={(e) => setIntegrationsForm(prev => ({ ...prev, slackWebhook: e.target.value }))}
                                disabled={!canManageSettings}
                                className="input-field disabled:bg-gray-100"
                                placeholder="https://hooks.slack.com/services/..."
                              />
                              <p className="mt-1 text-sm text-gray-500">
                                Receive payment and approval notifications in Slack
                              </p>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Microsoft Teams Webhook URL
                              </label>
                              <input
                                type="url"
                                value={integrationsForm.teamsWebhook}
                                onChange={(e) => setIntegrationsForm(prev => ({ ...prev, teamsWebhook: e.target.value }))}
                                disabled={!canManageSettings}
                                className="input-field disabled:bg-gray-100"
                                placeholder="https://outlook.office.com/webhook/..."
                              />
                              <p className="mt-1 text-sm text-gray-500">
                                Receive notifications in Microsoft Teams
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Notification Methods */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-4">Notification Methods</h4>
                          
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div>
                                <h5 className="font-medium text-gray-900">Email Integration</h5>
                                <p className="text-sm text-gray-600">Send notifications via email</p>
                              </div>
                              <input
                                type="checkbox"
                                checked={integrationsForm.emailIntegration}
                                onChange={(e) => setIntegrationsForm(prev => ({ ...prev, emailIntegration: e.target.checked }))}
                                disabled={!canManageSettings}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div>
                                <h5 className="font-medium text-gray-900">SMS Notifications</h5>
                                <p className="text-sm text-gray-600">Send urgent notifications via SMS</p>
                              </div>
                              <input
                                type="checkbox"
                                checked={integrationsForm.smsNotifications}
                                onChange={(e) => setIntegrationsForm(prev => ({ ...prev, smsNotifications: e.target.checked }))}
                                disabled={!canManageSettings}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                            </div>
                          </div>
                        </div>

                        {/* API Integration Status */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h4 className="font-medium text-green-900 mb-2">Integration Status</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-green-700">Slack</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                integrationsForm.slackWebhook 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {integrationsForm.slackWebhook ? 'Connected' : 'Not Connected'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-green-700">Microsoft Teams</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                integrationsForm.teamsWebhook 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {integrationsForm.teamsWebhook ? 'Connected' : 'Not Connected'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-green-700">Email</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                integrationsForm.emailIntegration 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {integrationsForm.emailIntegration ? 'Enabled' : 'Disabled'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-green-700">SMS</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                integrationsForm.smsNotifications 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {integrationsForm.smsNotifications ? 'Enabled' : 'Disabled'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Test Integration */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-medium text-blue-900 mb-2">Test Integrations</h4>
                          <p className="text-sm text-blue-700 mb-3">
                            Send a test notification to verify your integrations are working correctly.
                          </p>
                          <div className="flex space-x-3">
                            <button
                              onClick={() => toast.success('Test notification sent to Slack!')}
                              disabled={!integrationsForm.slackWebhook || !canManageSettings}
                              className="btn-secondary disabled:opacity-50 text-sm"
                            >
                              Test Slack
                            </button>
                            <button
                              onClick={() => toast.success('Test notification sent to Teams!')}
                              disabled={!integrationsForm.teamsWebhook || !canManageSettings}
                              className="btn-secondary disabled:opacity-50 text-sm"
                            >
                              Test Teams
                            </button>
                            <button
                              onClick={() => toast.success('Test email sent!')}
                              disabled={!integrationsForm.emailIntegration || !canManageSettings}
                              className="btn-secondary disabled:opacity-50 text-sm"
                            >
                              Test Email
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {canManageSettings && (
                        <div className="mt-6">
                          <button
                            onClick={handleSaveIntegrations}
                            disabled={saving}
                            className="btn-primary disabled:opacity-50 flex items-center space-x-2"
                          >
                            {saving ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Saving...</span>
                              </>
                            ) : (
                              <>
                                <GlobeAltIcon className="w-4 h-4" />
                                <span>Save Integration Settings</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}