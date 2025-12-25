'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createOrganization } from '@/lib/database';
import toast from 'react-hot-toast';
import SuperAdminLayout from '@/components/SuperAdminLayout';
import { generateUniqueOrgId, generateOrgCode } from '@/lib/id-generator';

export default function AddNewOrganizationPage() {
  const [formData, setFormData] = useState({
    name: '',
    businessType: '',
    country: '',
    currency: 'USD',
    timezone: 'UTC',
    contactEmail: '',
    contactPhone: '',
    orgId: '',
    autoGenerateOrgId: true,
    status: 'DRAFT' as const
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let newValue: any = value;
    
    if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
    }
    
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: newValue
      };
      
      // Auto-generate org ID when name changes and auto-generation is enabled
      if (name === 'name' && updated.autoGenerateOrgId && value.trim()) {
        updated.orgId = generateOrgCode(value);
      }
      
      return updated;
    });
  };

  const handleGenerateOrgId = async () => {
    try {
      const newOrgId = await generateUniqueOrgId();
      setFormData(prev => ({ ...prev, orgId: newOrgId }));
      toast.success('Unique Organization ID generated!');
    } catch (error) {
      console.error('Error generating org ID:', error);
      toast.error('Failed to generate organization ID');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.businessType || !formData.country || !formData.contactEmail || !formData.orgId) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Create organization
      const orgData = {
        name: formData.name,
        businessType: formData.businessType,
        country: formData.country,
        currency: formData.currency,
        timezone: formData.timezone,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone || undefined,
        status: formData.status,
        createdBy: 'current-super-admin' // You might want to get this from auth context
      };

      console.log('Creating organization with ID:', formData.orgId);
      const orgId = await createOrganization(orgData);

      toast.success(`Organization "${formData.name}" created successfully!`);
      console.log('Organization created:', { orgId, data: orgData });

      // Reset form
      setFormData({
        name: '',
        businessType: '',
        country: '',
        currency: 'USD',
        timezone: 'UTC',
        contactEmail: '',
        contactPhone: '',
        orgId: '',
        autoGenerateOrgId: true,
        status: 'DRAFT'
      });

      // Redirect to organizations list after 2 seconds
      setTimeout(() => {
        router.push('/super-admin/organizations');
      }, 2000);

    } catch (error: any) {
      console.error('Error creating organization:', error);
      toast.error(error.message || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SuperAdminLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add New Organization</h1>
          <p className="mt-2 text-gray-600">
            Create a new organization with auto-generated ID
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Organization Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 input-field"
                  placeholder="ABC Private Limited"
                />
              </div>

              <div>
                <label htmlFor="businessType" className="block text-sm font-medium text-gray-700">
                  Business Type *
                </label>
                <select
                  id="businessType"
                  name="businessType"
                  required
                  value={formData.businessType}
                  onChange={handleInputChange}
                  className="mt-1 input-field"
                >
                  <option value="">Select Business Type</option>
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
            </div>

            {/* Location and Currency */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                  Country *
                </label>
                <select
                  id="country"
                  name="country"
                  required
                  value={formData.country}
                  onChange={handleInputChange}
                  className="mt-1 input-field"
                >
                  <option value="">Select Country</option>
                  <option value="India">India</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                  <option value="Singapore">Singapore</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                  Currency *
                </label>
                <select
                  id="currency"
                  name="currency"
                  required
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="mt-1 input-field"
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
                <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                  Timezone
                </label>
                <select
                  id="timezone"
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleInputChange}
                  className="mt-1 input-field"
                >
                  <option value="UTC">UTC</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                </select>
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
                  Contact Email *
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  required
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  className="mt-1 input-field"
                  placeholder="admin@company.com"
                />
              </div>

              <div>
                <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  id="contactPhone"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  className="mt-1 input-field"
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>

            {/* Organization ID Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    id="autoGenerateOrgId"
                    name="autoGenerateOrgId"
                    checked={formData.autoGenerateOrgId}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                <label htmlFor="autoGenerateOrgId" className="text-sm text-gray-900">
                  Auto-generate Organization ID from name
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="orgId" className="block text-sm font-medium text-gray-700">
                    Organization ID *
                  </label>
                  <input
                    type="text"
                    id="orgId"
                    name="orgId"
                    required
                    value={formData.orgId}
                    onChange={handleInputChange}
                    disabled={formData.autoGenerateOrgId && !!formData.name}
                    className="mt-1 input-field disabled:bg-gray-100"
                    placeholder="ABC1234 or ORG_XXX_XXX"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {formData.autoGenerateOrgId 
                      ? 'Auto-generated from organization name'
                      : 'Enter manually or use generate button'
                    }
                  </p>
                </div>
                
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleGenerateOrgId}
                    className="w-full btn-secondary text-sm"
                    disabled={loading}
                  >
                    Generate Unique ID
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/super-admin/organizations')}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Organization...' : 'Create Organization'}
              </button>
            </div>
          </form>
        </div>

        {/* Information Panel */}
        <div className="mt-8 p-6 bg-green-50 rounded-lg">
          <h3 className="text-lg font-medium text-green-900 mb-4">Organization ID Generation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-green-900">Auto-Generation (Recommended)</h4>
              <p className="text-green-700 mb-2">From organization name: "ABC Private Ltd" → "ABC1234"</p>
              <ul className="text-green-600 space-y-1">
                <li>• Takes first 3 letters of company name</li>
                <li>• Adds 4-digit random number</li>
                <li>• Easy to remember and type</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-green-900">Unique ID Generation</h4>
              <p className="text-green-700 mb-2">Format: "ORG_TIMESTAMP_RANDOM"</p>
              <ul className="text-green-600 space-y-1">
                <li>• Guaranteed uniqueness</li>
                <li>• Database collision checking</li>
                <li>• Suitable for large systems</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}