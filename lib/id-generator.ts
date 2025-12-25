/**
 * Utility functions for generating unique IDs
 */

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Generate a random organization ID
 */
export const generateOrgId = (): string => {
  const prefix = 'ORG';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}_${timestamp}_${random}`;
};

/**
 * Generate a unique organization ID that doesn't exist in the database
 */
export const generateUniqueOrgId = async (): Promise<string> => {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const orgId = generateOrgId();
    
    try {
      // Check if this ID already exists in organizations collection
      const orgQuery = query(
        collection(db, 'organizations'),
        where('__name__', '==', orgId)
      );
      const orgSnapshot = await getDocs(orgQuery);
      
      // Check if this ID is used as orgId in users collection
      const userQuery = query(
        collection(db, 'users'),
        where('orgId', '==', orgId)
      );
      const userSnapshot = await getDocs(userQuery);
      
      // If both queries return empty, the ID is unique
      if (orgSnapshot.empty && userSnapshot.empty) {
        return orgId;
      }
    } catch (error) {
      console.warn('Error checking org ID uniqueness:', error);
    }
    
    attempts++;
  }
  
  // Fallback: add more randomness if we couldn't find a unique ID
  const fallbackId = `ORG_${Date.now()}_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
  console.warn('Using fallback org ID after max attempts:', fallbackId);
  return fallbackId;
};

/**
 * Generate a user-friendly organization code (shorter)
 */
export const generateOrgCode = (organizationName: string): string => {
  // Take first 3 letters of organization name
  const namePrefix = organizationName
    .replace(/[^a-zA-Z]/g, '')
    .substring(0, 3)
    .toUpperCase();
  
  // Add random 4-digit number
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  
  return `${namePrefix}${randomNum}`;
};

/**
 * Generate department codes
 */
export const generateDepartmentCode = (departmentName: string): string => {
  return departmentName
    .replace(/[^a-zA-Z]/g, '')
    .substring(0, 4)
    .toUpperCase();
};

/**
 * Generate user reference ID
 */
export const generateUserRefId = (orgId: string, role: string): string => {
  const rolePrefix = role.replace('ORG_', '').substring(0, 3);
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${orgId}_${rolePrefix}_${randomSuffix}`;
};

/**
 * Validate organization ID format
 */
export const isValidOrgId = (orgId: string): boolean => {
  const orgIdPattern = /^ORG_[A-Z0-9]+_[A-Z0-9]+$/;
  return orgIdPattern.test(orgId);
};

/**
 * Generate payment request ID
 */
export const generatePaymentRequestId = (orgId: string): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PAY_${orgId}_${timestamp}_${random}`;
};

/**
 * Generate approval level ID
 */
export const generateApprovalLevelId = (orgId: string, levelOrder: number): string => {
  const paddedOrder = levelOrder.toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 4).toUpperCase();
  return `APPR_${orgId}_L${paddedOrder}_${random}`;
};