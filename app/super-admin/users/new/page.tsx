'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUser, getOrganizationRequests } from '@/lib/database';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import toast from 'react-hot-toast';
import SuperAdminLayout from '@/components/SuperAdminLayout';
import { generateUniqueOrgId, generateOrgCode, isValidOrgId } from '@/lib/id-generator';
import { User, OrganizationRequest } from '@/types';

export default function AddNewUserPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'ORG_MEMBER',
    orgId: '',
    department: '',
    active: true
  });
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<OrganizationRequest[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const orgsData = await getOrganizationRequests();
      setOrganizations(orgsData.filter(org => org.status === 'APPROVED'));
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
      setOrganizations([]);
    } finally {
      setDataLoading(false);
    }
  };

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
      
      // Clear org ID if switching to Super Admin
      if (name === 'role' && value === 'SUPER_ADMIN') {
        updated.orgId = '';
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
      if (!formData.email || !formData.password || !formData.name) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Handle organization assignment for organization roles
      let finalOrgId = formData.orgId;
      if (formData.role.startsWith('ORG_')) {
        if (!formData.orgId && organizations.length > 0) {
          // Auto-assign to first available organization
          finalOrgId = organizations[0].id;
          toast.success(`Auto-assigned to organization: ${organizations[0].organizationName}`);
        } else if (!formData.orgId && organizations.length === 0) {
          toast.error('No organizations available. Please create an organization first.');
          return;
        }
      } else if (formData.role === 'SUPER_ADMIN') {
        finalOrgId = ''; // Super Admin doesn't need organization
      }

      // Create Firebase Auth user
      console.log('Creating Firebase Auth user...');
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      
      const firebaseUser = userCredential.user;
      console.log('Firebase user created with UID:', firebaseUser.uid);

      // Create user document in Firestore
      const userData = {
        email: formData.email,
        name: formData.name,
        role: formData.role as User['role'],
        orgId: finalOrgId || undefined,
        department: formData.department || undefined,
        active: formData.active,
        isSuperAdmin: formData.role === 'SUPER_ADMIN',
        createdBy: auth.currentUser?.uid || 'system'
      };

      console.log('Creating user document in Firestore:', userData);
      await createUser(firebaseUser.uid, userData);

      toast.success(`User ${formData.name} created successfully!`);
      console.log('User created successfully:', {
        uid: firebaseUser.uid,
        email: formData.email,
        role: formData.role,
        orgId: finalOrgId
      });

      // Reset form
      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'ORG_MEMBER',
        orgId: '',
        department: '',
        active: true
      });

      // Redirect to users list after 2 seconds
      setTimeout(() => {
        router.push('/super-admin/users');
      }, 2000);

    } catch (error: any) {
      console.error('Error creating user:', error);
      
      let errorMessage = 'Failed to create user';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email address is already in use';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add New User</h1>
          <p className="mt-2 text-gray-600">
            Create a new user account with Firebase Authentication and database access
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 input-field"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 input-field"
                  placeholder="john@company.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleInputChange}
                className="mt-1 input-field"
                placeholder="Minimum 6 characters"
              />
              <p className="mt-1 text-sm text-gray-500">
                User will be able to login with this email and password
              </p>
            </div>

            {/* Role and Organization */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role *
                </label>
                <select
                  id="role"
                  name="role"
                  required
                  value={formData.role}
                  onChange={handleInputChange}
                  className="mt-1 input-field"
                >
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="ORG_ADMIN">Organization Admin</option>
                  <option value="ORG_MEMBER">Organization Member</option>
                  <option value="ORG_FINANCE">Finance Member</option>
                  <option value="ORG_AUDITOR">Auditor</option>
                </select>
              </div>

              {formData.role.startsWith('ORG_') && (
                <div>
                  <label htmlFor="orgId" className="block text-sm font-medium text-gray-700">
                    Organization {organizations.length > 1 ? '' : '(Auto-assigned)'}
                  </label>
                  {organizations.length > 1 ? (
                    <select
                      id="orgId"
                      name="orgId"
                      value={formData.orgId}
                      onChange={handleInputChange}
                      className="mt-1 input-field"
                    >
                      <option value="">Select Organization</option>
                      {organizations.map(org => (
                        <option key={org.id} value={org.id}>
                          {org.organizationName}
                        </option>
                      ))}
                    </select>
                  ) : organizations.length === 1 ? (
                    <div className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                      <span className="text-gray-700">{organizations[0].organizationName}</span>
                      <span className="text-sm text-gray-500 ml-2">(Auto-assigned)</span>
                    </div>
                  ) : (
                    <div className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-red-50">
                      <span className="text-red-600">No organizations available</span>
                    </div>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    {organizations.length > 1 
                      ? 'Choose organization or leave blank to auto-assign to first available'
                      : organizations.length === 1 
                      ? 'Will be automatically assigned to the available organization'
                      : 'Please create an organization first before adding organization users'
                    }
                  </p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                Department
              </label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="mt-1 input-field"
                placeholder="IT, Finance, Operations, etc."
              />
            </div>

            {/* Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                name="active"
                checked={formData.active}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                Active User (can login)
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/super-admin/users')}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || (formData.role.startsWith('ORG_') && organizations.length === 0)}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating User...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>

        {/* Information Panel */}
        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-medium text-blue-900 mb-4">Smart Organization Assignment</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex items-center">
              <span className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mr-3">1</span>
              Super Admin roles don't require organization assignment
            </div>
            <div className="flex items-center">
              <span className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mr-3">2</span>
              Organization roles auto-assign to first available organization if none selected
            </div>
            <div className="flex items-center">
              <span className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mr-3">3</span>
              Multiple organizations allow manual selection
            </div>
            <div className="flex items-center">
              <span className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mr-3">4</span>
              Creates Firebase Authentication account automatically
            </div>
            <div className="flex items-center">
              <span className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mr-3">5</span>
              User can immediately login with email/password
            </div>
          </div>
        </div>

        {/* Organization Status */}
        <div className="mt-6 p-6 bg-green-50 rounded-lg">
          <h3 className="text-lg font-medium text-green-900 mb-4">Organization Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-green-900">Available Organizations</h4>
              <p className="text-green-700 mb-2">{organizations.length} approved organizations</p>
              {organizations.length > 0 ? (
                <ul className="text-green-600 space-y-1">
                  {organizations.slice(0, 3).map(org => (
                    <li key={org.id}>• {org.organizationName}</li>
                  ))}
                  {organizations.length > 3 && (
                    <li>• ... and {organizations.length - 3} more</li>
                  )}
                </ul>
              ) : (
                <p className="text-orange-600">No organizations available. Create one first.</p>
              )}
            </div>
            <div>
              <h4 className="font-medium text-green-900">Assignment Logic</h4>
              <ul className="text-green-600 space-y-1">
                <li>• Super Admin: No organization needed</li>
                <li>• Single org: Auto-assigned</li>
                <li>• Multiple orgs: Manual selection or auto-assign to first</li>
                <li>• No orgs: Creation blocked for org roles</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Role Descriptions */}
        <div className="mt-6 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Role Descriptions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-900">Super Admin</h4>
              <p className="text-gray-600">Full system access, manages all organizations</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Organization Admin</h4>
              <p className="text-gray-600">Manages their organization, users, and settings</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Organization Member</h4>
              <p className="text-gray-600">Basic access to organization features</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Finance Member</h4>
              <p className="text-gray-600">Access to payment and financial features</p>
            </div>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}