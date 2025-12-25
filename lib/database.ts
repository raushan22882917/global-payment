import { db } from './firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  serverTimestamp 
} from 'firebase/firestore';
import { User, Organization, ApprovalLevel, PaymentConfig, OrganizationRequest } from '@/types';

// User operations
export const createUser = async (userId: string, userData: Omit<User, 'id' | 'createdAt'>) => {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    ...userData,
    createdAt: serverTimestamp()
  });
};

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(usersQuery);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as User[];
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
};

export const getUser = async (userId: string): Promise<User | null> => {
  try {
    console.log('🔍 [getUser] Starting user lookup with ID:', userId);
    console.log('🔍 [getUser] Firestore instance:', !!db);
    
    const userRef = doc(db, 'users', userId);
    console.log('🔍 [getUser] Document reference created for path: users/' + userId);
    
    const snapshot = await getDoc(userRef);
    console.log('🔍 [getUser] Firestore snapshot retrieved, exists:', snapshot.exists());
    
    if (snapshot.exists()) {
      const data = snapshot.data();
      console.log('🔍 [getUser] Raw Firestore data:', JSON.stringify(data, null, 2));
      
      const user = {
        id: userId,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date()
      } as User;
      
      console.log('✅ [getUser] Processed user data:', JSON.stringify({
        id: user.id,
        email: user.email,
        role: user.role,
        active: user.active,
        isSuperAdmin: user.isSuperAdmin,
        orgId: user.orgId,
        name: user.name
      }, null, 2));
      
      return user;
    }
    
    console.log('❌ [getUser] No user document found in Firestore for ID:', userId);
    return null;
  } catch (error) {
    console.error('❌ [getUser] Error getting user from Firestore:', error);
    console.error('❌ [getUser] Error details:', {
      code: (error as any)?.code,
      message: (error as any)?.message,
      userId: userId
    });
    return null;
  }
};

export const updateUser = async (userId: string, updates: Partial<User>) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, updates);
};

export const deleteUser = async (userId: string) => {
  const userRef = doc(db, 'users', userId);
  await deleteDoc(userRef);
};

// Organization operations
// Utility function to remove undefined values from objects before saving to Firestore
const removeUndefinedValues = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedValues).filter(item => item !== undefined);
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        const cleanedValue = removeUndefinedValues(value);
        if (cleanedValue !== undefined) {
          cleaned[key] = cleanedValue;
        }
      }
    }
    return cleaned;
  }
  
  return obj;
};

export const createOrganization = async (orgData: Omit<Organization, 'id' | 'createdAt'>) => {
  // Clean the data to remove undefined values
  const cleanedData = removeUndefinedValues(orgData);
  
  const orgRef = await addDoc(collection(db, 'organizations'), {
    ...cleanedData,
    createdAt: serverTimestamp()
  });
  return orgRef.id;
};

export const getOrganization = async (orgId: string): Promise<Organization | null> => {
  const orgRef = doc(db, 'organizations', orgId);
  const snapshot = await getDoc(orgRef);
  if (snapshot.exists()) {
    const data = snapshot.data();
    return {
      id: orgId,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      lockedAt: data.lockedAt?.toDate()
    } as Organization;
  }
  return null;
};

export const updateOrganization = async (orgId: string, updates: Partial<Organization>) => {
  const orgRef = doc(db, 'organizations', orgId);
  
  // Remove undefined fields and system fields that shouldn't be updated
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([key, value]) => {
      // Remove undefined values and system fields
      return value !== undefined && 
             key !== 'id' && 
             key !== 'createdAt' && 
             key !== 'createdBy';
    })
  );
  
  try {
    await updateDoc(orgRef, cleanUpdates);
  } catch (error: any) {
    if (error.code === 'not-found') {
      throw new Error(`Organization with ID "${orgId}" does not exist. Please contact your administrator to set up your organization.`);
    }
    throw error;
  }
};

// Create or update organization (upsert operation)
export const upsertOrganization = async (orgId: string, orgData: Partial<Organization>) => {
  const orgRef = doc(db, 'organizations', orgId);
  
  try {
    // Try to get the document first
    const snapshot = await getDoc(orgRef);
    
    if (snapshot.exists()) {
      // Document exists, update it
      const cleanUpdates = Object.fromEntries(
        Object.entries(orgData).filter(([key, value]) => {
          return value !== undefined && 
                 key !== 'id' && 
                 key !== 'createdAt' && 
                 key !== 'createdBy';
        })
      );
      await updateDoc(orgRef, cleanUpdates);
    } else {
      // Document doesn't exist, create it
      const newOrgData = {
        ...orgData,
        id: orgId,
        createdAt: serverTimestamp(),
        status: orgData.status || 'PENDING',
        name: orgData.name || 'Unknown Organization'
      };
      await setDoc(orgRef, newOrgData);
    }
  } catch (error) {
    console.error('Error upserting organization:', error);
    throw error;
  }
};

// Get organizations by creator
export const getOrganizationsByCreator = async (creatorId: string): Promise<Organization[]> => {
  const orgsQuery = query(
    collection(db, 'organizations'),
    where('createdBy', '==', creatorId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(orgsQuery);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    lockedAt: doc.data().lockedAt?.toDate()
  })) as Organization[];
};

// User management operations
export const getUsersByOrg = async (orgId: string): Promise<User[]> => {
  const usersQuery = query(
    collection(db, 'users'),
    where('orgId', '==', orgId)
  );
  const snapshot = await getDocs(usersQuery);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date()
  })) as User[];
};

export const inviteUser = async (userData: Omit<User, 'id'>) => {
  const userRef = await addDoc(collection(db, 'users'), {
    ...userData,
    createdAt: serverTimestamp()
  });
  return userRef.id;
};

// Approval Level operations
export const createApprovalLevel = async (levelData: Omit<ApprovalLevel, 'id'>) => {
  const levelRef = await addDoc(collection(db, 'approvalLevels'), levelData);
  return levelRef.id;
};

export const getApprovalLevelsByOrg = async (orgId: string): Promise<ApprovalLevel[]> => {
  const levelsQuery = query(
    collection(db, 'approvalLevels'),
    where('orgId', '==', orgId),
    orderBy('levelOrder', 'asc')
  );
  const snapshot = await getDocs(levelsQuery);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as ApprovalLevel[];
};

export const updateApprovalLevel = async (levelId: string, updates: Partial<ApprovalLevel>) => {
  const levelRef = doc(db, 'approvalLevels', levelId);
  await updateDoc(levelRef, updates);
};

export const deleteApprovalLevel = async (levelId: string) => {
  const levelRef = doc(db, 'approvalLevels', levelId);
  await deleteDoc(levelRef);
};

// Payment Config operations
export const createPaymentConfig = async (configData: Omit<PaymentConfig, 'id'>) => {
  const configRef = doc(db, 'paymentConfigs', configData.orgId);
  await setDoc(configRef, configData);
  return configData.orgId;
};

export const getPaymentConfig = async (orgId: string): Promise<PaymentConfig | null> => {
  const configRef = doc(db, 'paymentConfigs', orgId);
  const snapshot = await getDoc(configRef);
  
  if (snapshot.exists()) {
    return {
      id: orgId,
      ...snapshot.data()
    } as PaymentConfig;
  }
  
  // Return default configuration if none exists
  console.log('No payment config found for org:', orgId, 'returning default config');
  return {
    id: orgId,
    orgId: orgId,
    enableUPI: false,
    enableBank: false,
    gateway: 'RAZORPAY',
    autoPay: false
  } as PaymentConfig;
};

export const updatePaymentConfig = async (orgId: string, updates: Partial<PaymentConfig>) => {
  const configRef = doc(db, 'paymentConfigs', orgId);
  
  try {
    // First try to update the document
    await updateDoc(configRef, updates);
  } catch (error: any) {
    if (error.code === 'not-found') {
      // Document doesn't exist, create it with default values
      console.log('Payment config not found, creating new one for org:', orgId);
      
      const defaultConfig: PaymentConfig = {
        id: orgId,
        orgId: orgId,
        enableUPI: false,
        enableBank: false,
        gateway: 'RAZORPAY',
        autoPay: false,
        ...updates // Apply the updates to the default config
      };
      
      await setDoc(configRef, defaultConfig);
      console.log('Payment config created successfully for org:', orgId);
    } else {
      throw error;
    }
  }
};

// Approval Workflow operations
export const saveApprovalWorkflow = async (orgId: string, nodes: any[]) => {
  try {
    // Delete existing approval levels for this org
    const existingLevels = await getApprovalLevelsByOrg(orgId);
    const deletePromises = existingLevels.map(level => deleteApprovalLevel(level.id));
    await Promise.all(deletePromises);

    // Create new approval levels from nodes
    const createPromises = nodes.map(node => {
      const levelData: any = {
        orgId,
        levelOrder: node.levelOrder,
        levelName: node.levelName,
        approverType: node.approverType,
        approverValue: node.approverValue
      };
      
      // Only add conditions if it's not undefined
      if (node.conditions !== undefined && node.conditions !== null) {
        levelData.conditions = node.conditions;
      }
      
      return createApprovalLevel(levelData);
    });

    await Promise.all(createPromises);
    console.log('✅ Approval workflow saved successfully');
  } catch (error) {
    console.error('❌ Failed to save approval workflow:', error);
    throw error;
  }
};

// Payment Request operations
export interface PaymentRequest {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  requestedBy: string;
  requestedAt: Date;
  category: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  currentApprovalLevel: number;
  orgId: string;
  attachments?: string[];
  metadata?: Record<string, any>;
  // Enhanced fields
  payeeDetails?: {
    name: string;
    email?: string;
    phone?: string;
  };
  bankDetails?: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    accountHolderName: string;
    accountType: 'SAVINGS' | 'CURRENT';
  };
  upiDetails?: {
    upiId: string;
    qrCodeImage?: string; // URL or path to uploaded QR code image
  };
  preferredPaymentMethod?: 'BANK' | 'UPI' | 'BOTH';
  invoiceNumber?: string;
  dueDate?: Date;
  taxDetails?: {
    gstNumber?: string;
    panNumber?: string;
    taxAmount?: number;
    taxType: 'GST' | 'TDS' | 'NONE';
  };
  notes?: string;
}

export const createPaymentRequest = async (requestData: Omit<PaymentRequest, 'id' | 'requestedAt'>) => {
  // Remove undefined values to prevent Firestore errors
  const cleanData = removeUndefinedValues(requestData);
  
  const requestRef = await addDoc(collection(db, 'paymentRequests'), {
    ...cleanData,
    requestedAt: serverTimestamp()
  });
  return requestRef.id;
};

export const getPaymentRequest = async (requestId: string): Promise<PaymentRequest | null> => {
  const requestRef = doc(db, 'paymentRequests', requestId);
  const snapshot = await getDoc(requestRef);
  if (snapshot.exists()) {
    const data = snapshot.data();
    return {
      id: requestId,
      ...data,
      requestedAt: data.requestedAt?.toDate() || new Date()
    } as PaymentRequest;
  }
  return null;
};

export const getPaymentRequestsByOrg = async (orgId: string): Promise<PaymentRequest[]> => {
  const requestsQuery = query(
    collection(db, 'paymentRequests'),
    where('orgId', '==', orgId),
    orderBy('requestedAt', 'desc')
  );
  const snapshot = await getDocs(requestsQuery);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    requestedAt: doc.data().requestedAt?.toDate() || new Date()
  })) as PaymentRequest[];
};

export const updatePaymentRequest = async (requestId: string, updates: Partial<PaymentRequest>) => {
  const requestRef = doc(db, 'paymentRequests', requestId);
  await updateDoc(requestRef, updates);
};

// Workflow Instance operations
export interface WorkflowInstance {
  id: string;
  paymentRequestId: string;
  orgId: string;
  currentStep: number;
  totalSteps: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  steps: any[];
  createdAt: Date;
  completedAt?: Date;
  metadata: Record<string, any>;
}

export const createWorkflowInstance = async (instanceData: Omit<WorkflowInstance, 'id' | 'createdAt'>) => {
  const instanceRef = await addDoc(collection(db, 'workflowInstances'), {
    ...instanceData,
    createdAt: serverTimestamp()
  });
  return instanceRef.id;
};

export const getWorkflowInstance = async (instanceId: string): Promise<WorkflowInstance | null> => {
  const instanceRef = doc(db, 'workflowInstances', instanceId);
  const snapshot = await getDoc(instanceRef);
  if (snapshot.exists()) {
    const data = snapshot.data();
    return {
      id: instanceId,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      completedAt: data.completedAt?.toDate()
    } as WorkflowInstance;
  }
  return null;
};

export const updateWorkflowInstance = async (instanceId: string, updates: Partial<WorkflowInstance>) => {
  const instanceRef = doc(db, 'workflowInstances', instanceId);
  await updateDoc(instanceRef, updates);
};

// Organization Request operations
export const createOrganizationRequest = async (requestData: Omit<OrganizationRequest, 'id'>) => {
  const requestRef = await addDoc(collection(db, 'organizationRequests'), {
    ...requestData,
    createdAt: serverTimestamp()
  });
  
  // Trigger auto-reply system
  try {
    const { sendAutoReply } = await import('./auto-reply');
    const fullRequest = {
      id: requestRef.id,
      ...requestData,
      createdAt: new Date()
    } as OrganizationRequest;
    
    await sendAutoReply(fullRequest);
    console.log('✅ Auto-reply triggered for organization request:', requestData.organizationName);
  } catch (error) {
    console.error('❌ Failed to trigger auto-reply:', error);
    // Don't fail the request creation if auto-reply fails
  }
  
  return requestRef.id;
};

export const getOrganizationRequests = async (): Promise<OrganizationRequest[]> => {
  const requestsQuery = query(
    collection(db, 'organizationRequests'),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(requestsQuery);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    processedAt: doc.data().processedAt?.toDate()
  })) as OrganizationRequest[];
};

export const updateOrganizationRequest = async (requestId: string, updates: Partial<OrganizationRequest>) => {
  const requestRef = doc(db, 'organizationRequests', requestId);
  await updateDoc(requestRef, {
    ...updates,
    processedAt: serverTimestamp()
  });
};

export const getOrganizationRequest = async (requestId: string): Promise<OrganizationRequest | null> => {
  const requestRef = doc(db, 'organizationRequests', requestId);
  const snapshot = await getDoc(requestRef);
  if (snapshot.exists()) {
    const data = snapshot.data();
    return {
      id: requestId,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      processedAt: data.processedAt?.toDate()
    } as OrganizationRequest;
  }
  return null;
};