export interface User {
  id: string;
  email: string;
  name: string; // Full name of the user
  role: 'SUPER_ADMIN' | 'ORG_ADMIN' | 'ORG_MEMBER' | 'ORG_FINANCE' | 'ORG_AUDITOR' | 'ORG_USER';
  orgId?: string;
  department?: string;
  active: boolean;
  isSuperAdmin?: boolean;
  createdAt: Date;
  createdBy?: string; // Who created this user
}

export interface Organization {
  id: string;
  name: string;
  businessType: string;
  country: string;
  currency: string;
  timezone: string;
  createdBy: string; // Super Admin who created it
  status: 'PENDING' | 'DRAFT' | 'ACTIVE' | 'SUSPENDED';
  lockedAt?: Date;
  createdAt: Date;
  contactEmail: string; // Organization's contact email
  contactPhone?: string;
  adminUserId?: string; // The org admin user ID
  // Enhanced organization details
  logoUrl?: string; // URL to organization logo
  description?: string; // Organization description
  website?: string; // Organization website
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  industry?: string; // Industry type
  employeeCount?: string; // Employee count range
  foundedYear?: number; // Year founded
  registrationNumber?: string; // Business registration number
  taxId?: string; // Tax identification number
}

export interface OrganizationRequest {
  id: string;
  organizationName: string;
  contactEmail: string;
  contactName: string;
  contactPhone?: string;
  businessType: string;
  country: string;
  message?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
  processedBy?: string; // Super Admin who processed it
  processedAt?: Date;
}

export interface ApprovalLevel {
  id: string;
  orgId: string;
  levelOrder: number;
  levelName: string;
  approverType: 'ROLE' | 'USER';
  approverValue: string; // Role name or User ID
  conditions?: {
    amountRange?: {
      min: number;
      max: number;
    };
    department?: string;
  };
}

export interface PaymentConfig {
  id: string;
  orgId: string;
  enableUPI: boolean;
  enableBank: boolean;
  gateway?: 'PAYTM' | 'PHONEPE' | 'RAZORPAY';
  autoPay: boolean;
}

export interface Payee {
  id: string;
  name: string;
  upiId?: string;
  bankAccount?: {
    accountNumber: string;
    ifsc: string;
    bankName: string;
  };
}