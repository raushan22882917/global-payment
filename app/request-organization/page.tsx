'use client';

import { useState } from 'react';
import { createOrganizationRequest } from '@/lib/database';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const businessTypes = [
  'Private Limited Company',
  'Public Limited Company',
  'Partnership Firm',
  'Sole Proprietorship',
  'LLP (Limited Liability Partnership)',
  'NGO/Non-Profit',
  'Government Organization',
  'Other'
];

const countries = [
  'India',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Singapore',
  'UAE',
  'Other'
];

export default function RequestOrganization() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    organizationName: '',
    contactEmail: '',
    contactPhone: '',
    businessType: '',
    country: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const requestData = {
        organizationName: formData.organizationName,
        contactEmail: formData.contactEmail,
        contactName: formData.organizationName, // Using org name as contact name for now
        businessType: formData.businessType,
        description: formData.message || `Organization setup request for ${formData.organizationName}`,
        country: 'Not specified', // Default value since it's not in the form
        status: 'PENDING' as const,
        requestedBy: 'anonymous', // Since this is a public form
        createdAt: new Date()
      };

      // Try to create the request, but handle errors gracefully
      try {
        await createOrganizationRequest(requestData);
        toast.success('🎉 Request submitted successfully! Check your email for confirmation - we\'ll connect back in ~10 minutes!');
        router.push('/request-success');
      } catch (dbError: any) {
        console.error('Database error:', dbError);
        
        // Provide specific error messages based on the error type
        if (dbError.code === 'permission-denied') {
          toast.error('Permission denied. Please try again or contact support.');
        } else if (dbError.code === 'unavailable') {
          toast.error('Service temporarily unavailable. Please try again in a few minutes.');
        } else if (dbError.code === 'network-request-failed') {
          toast.error('Network error. Please check your connection and try again.');
        } else {
          // For any other database errors, still show a user-friendly message
          toast.error('Unable to submit request right now. Please try again or contact us directly at support@example.com');
        }
        
        // Log detailed error for debugging
        console.error('Detailed error info:', {
          code: dbError.code,
          message: dbError.message,
          stack: dbError.stack
        });
      }
    } catch (error: any) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit request. Please try again or contact us directly.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.organizationName && formData.contactEmail && formData.businessType && formData.country;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Request Organization Setup</h1>
          <p className="mt-2 text-gray-600">
            Submit your organization details and our admin team will set up your account
          </p>
        </div>

        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Organization Name */}
            <div>
              <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 mb-2">
                Organization Name *
              </label>
              <input
                type="text"
                id="organizationName"
                name="organizationName"
                required
                value={formData.organizationName}
                onChange={handleInputChange}
                className="input-field"
                placeholder="ABC Private Limited"
              />
            </div>

            {/* Contact Email */}
            <div>
              <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-2">
                Contact Email *
              </label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                required
                value={formData.contactEmail}
                onChange={handleInputChange}
                className="input-field"
                placeholder="admin@yourcompany.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be used to create your admin login
              </p>
            </div>

            {/* Contact Phone */}
            <div>
              <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-2">
                Contact Phone
              </label>
              <input
                type="tel"
                id="contactPhone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleInputChange}
                className="input-field"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {/* Business Type */}
            <div>
              <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-2">
                Business Type *
              </label>
              <select
                id="businessType"
                name="businessType"
                required
                value={formData.businessType}
                onChange={handleInputChange}
                className="input-field"
              >
                <option value="">Select business type</option>
                {businessTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Country */}
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                Country *
              </label>
              <select
                id="country"
                name="country"
                required
                value={formData.country}
                onChange={handleInputChange}
                className="input-field"
              >
                <option value="">Select country</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                value={formData.message}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Tell us about your organization and any specific requirements..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Login
              </Link>
              <button
                type="submit"
                disabled={!isFormValid || loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting Request...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>

        {/* Process Info */}
        <div className="mt-8 card bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">What happens next?</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex items-start space-x-2">
              <span className="font-medium">📧</span>
              <span><strong>Instant confirmation:</strong> You'll receive an auto-reply email within 10 minutes</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="font-medium">👥</span>
              <span><strong>Admin review:</strong> Our super admin team will review your request</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="font-medium">🔧</span>
              <span><strong>Setup:</strong> We'll create your organization and admin account</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="font-medium">🚀</span>
              <span><strong>Go live:</strong> Start managing your organization's workflows within 24 hours</span>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-green-100 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-800">Auto-Reply System Active</span>
            </div>
            <p className="text-xs text-green-700 mt-1">
              Confirmation emails are sent automatically within 10 minutes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}