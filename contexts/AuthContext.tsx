'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, GoogleAuthProvider, signOut, getRedirectResult, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUser, createUser, createOrganization, getOrganization } from '@/lib/database';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (useRedirect?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check for redirect result first
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('Redirect result found:', result.user.email);
          // The auth state change handler will handle the rest
        }
      } catch (error: any) {
        console.error('Redirect result error:', error);
        if (error.message?.includes('Account not found in system')) {
          // Handle the error appropriately
          console.log('User not found in system after redirect');
        }
      }
    };
    
    checkRedirectResult();
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔄 Auth state changed, firebaseUser:', firebaseUser ? firebaseUser.email : 'null');
      
      try {
        if (firebaseUser) {
          console.log('✅ Firebase user found:', {
            email: firebaseUser.email,
            uid: firebaseUser.uid,
            emailVerified: firebaseUser.emailVerified,
            displayName: firebaseUser.displayName
          });
          
          // Try to get user data from database
          try {
            console.log('🔍 Looking up user in Firestore database...');
            console.log('   Using UID:', firebaseUser.uid);
            
            const userData = await getUser(firebaseUser.uid);
            console.log('📊 Database lookup result:', userData);
            
            if (userData) {
              console.log('✅ Database user found successfully:', {
                id: userData.id,
                email: userData.email,
                role: userData.role,
                active: userData.active,
                isSuperAdmin: userData.isSuperAdmin,
                orgId: userData.orgId
              });
              
              setUser(userData);
              console.log('✅ User state updated in context');
            } else {
              console.log('❌ No database user found for UID:', firebaseUser.uid);
              
              // Auto-create users for specific emails
              const autoCreateUsers = {
                'raushan22882917@gmail.com': {
                  role: 'SUPER_ADMIN' as const,
                  isSuperAdmin: true,
                  active: true,
                  name: 'Super Admin'
                },
                'su-22016@sitare.org': {
                  role: 'ORG_USER' as const,
                  isSuperAdmin: false,
                  active: true,
                  orgId: 'sitare-org', // You can change this to the appropriate org ID
                  name: firebaseUser.displayName || 'Raushan Kumar'
                }
              };

              const userConfig = autoCreateUsers[firebaseUser.email as keyof typeof autoCreateUsers];
              
              if (userConfig) {
                console.log(`🔧 Auto-creating ${userConfig.role} user for:`, firebaseUser.email);
                try {
                  // If user has an orgId, ensure the organization exists
                  if ('orgId' in userConfig && userConfig.orgId) {
                    console.log('🏢 Checking if organization exists:', userConfig.orgId);
                    const existingOrg = await getOrganization(userConfig.orgId);
                    
                    if (!existingOrg) {
                      console.log('🏢 Creating organization:', userConfig.orgId);
                      const orgData = {
                        name: 'Sitare Organization', // You can customize this
                        businessType: 'Technology',
                        country: 'India',
                        currency: 'INR',
                        timezone: 'Asia/Kolkata',
                        contactEmail: firebaseUser.email!,
                        status: 'ACTIVE' as const,
                        industry: 'Technology',
                        employeeCount: '1-10',
                        createdBy: firebaseUser.uid
                      };
                      
                      await createOrganization(orgData);
                      console.log('✅ Organization created successfully');
                    } else {
                      console.log('✅ Organization already exists');
                    }
                  }
                  
                  const userData = {
                    email: firebaseUser.email!,
                    ...userConfig
                  };
                  
                  await createUser(firebaseUser.uid, userData);
                  console.log('✅ User created successfully');
                  
                  // Fetch the newly created user
                  const newUserData = await getUser(firebaseUser.uid);
                  if (newUserData) {
                    console.log('✅ Newly created user fetched:', newUserData);
                    setUser(newUserData);
                  } else {
                    console.log('❌ Failed to fetch newly created user');
                    setUser(null);
                  }
                } catch (createError) {
                  console.error('❌ Failed to auto-create user:', createError);
                  setUser(null);
                }
              } else {
                // For all other users: they must be created by admin first
                console.log('⚠️ User not found in system. Must be created by admin first.');
                console.log('🚪 Signing out Firebase user since they are not in our system');
                setUser(null);
                // Sign out the Firebase user since they're not in our system
                await signOut(auth);
              }
            }
          } catch (dbError) {
            console.error('❌ Database lookup error:', dbError);
            console.error('   Error details:', {
              code: (dbError as any)?.code,
              message: (dbError as any)?.message,
              stack: (dbError as any)?.stack
            });
            setUser(null);
          }
          
          setFirebaseUser(firebaseUser);
          console.log('✅ Firebase user state updated in context');
        } else {
          console.log('❌ No Firebase user (signed out or never signed in)');
          setUser(null);
          setFirebaseUser(null);
        }
      } catch (error: any) {
        console.error('❌ Auth state change error:', error);
        console.error('   Error details:', {
          code: error.code,
          message: error.message,
          stack: error.stack
        });
        setUser(null);
        setFirebaseUser(null);
      } finally {
        console.log('🏁 Setting loading to false');
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async (useRedirect = false) => {
    console.log('🚀 [loginWithGoogle] Starting Google login, useRedirect:', useRedirect);
    
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    console.log('🔧 [loginWithGoogle] Google provider configured with scopes');
    
    try {
      let result;
      
      if (useRedirect) {
        console.log('🔄 [loginWithGoogle] Using redirect method');
        // Use redirect method
        await signInWithRedirect(auth, provider);
        console.log('✅ [loginWithGoogle] Redirect initiated successfully');
        return; // Redirect will handle the rest
      } else {
        console.log('🪟 [loginWithGoogle] Attempting popup method');
        // Try popup with better error handling for COOP issues
        try {
          result = await signInWithPopup(auth, provider);
          console.log('✅ [loginWithGoogle] Popup login successful:', {
            email: result.user.email,
            uid: result.user.uid,
            displayName: result.user.displayName
          });
        } catch (popupError: any) {
          console.log('❌ [loginWithGoogle] Popup error:', {
            code: popupError.code,
            message: popupError.message
          });
          
          if (popupError.code === 'auth/popup-blocked' || 
              popupError.code === 'auth/cancelled-popup-request' ||
              popupError.code === 'auth/popup-closed-by-user' ||
              popupError.message?.includes('Cross-Origin-Opener-Policy') ||
              popupError.message?.includes('window.close')) {
            console.log('🔄 [loginWithGoogle] Popup blocked or COOP issue, falling back to redirect');
            await signInWithRedirect(auth, provider);
            console.log('✅ [loginWithGoogle] Fallback redirect initiated');
            return;
          }
          throw popupError;
        }
      }
      
      // Only validate if we have a result (popup succeeded)
      if (result) {
        console.log('🔍 [loginWithGoogle] Validating user in database...');
        // Check if user exists in database
        const userData = await getUser(result.user.uid);
        if (!userData) {
          console.log('⚠️ [loginWithGoogle] User not found in database');
          // Special case for super admin email
          if (result.user.email === 'raushan22882917@gmail.com') {
            console.log('🔧 [loginWithGoogle] Super admin detected, will be auto-created');
            // Super admin will be auto-created in the auth state change handler
            return;
          }
          
          // For all other users, they must be created by admin first
          console.log('🚪 [loginWithGoogle] Signing out user not in system');
          await signOut(auth); // Sign them out since they're not in our system
          throw new Error('Account not found in system. Please contact your administrator to create your account first.');
        }
        
        // If user exists but is inactive
        if (!userData.active) {
          console.log('⚠️ [loginWithGoogle] User account is inactive');
          await signOut(auth); // Sign them out
          throw new Error('Your account is inactive. Please contact your administrator.');
        }
        
        console.log('✅ [loginWithGoogle] User validation successful');
      }
      
    } catch (error: any) {
      console.error('❌ [loginWithGoogle] Login error:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      // Handle specific Google login errors
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Login cancelled by user');
      } else if (error.code === 'auth/popup-blocked') {
        // This should be handled above, but just in case
        console.log('🔄 [loginWithGoogle] Popup blocked, trying redirect');
        await signInWithRedirect(auth, provider);
        return;
      } else if (error.code === 'auth/cancelled-popup-request') {
        throw new Error('Login cancelled');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your connection and try again.');
      } else if (error.code === 'auth/configuration-not-found') {
        throw new Error('Authentication configuration error. Please contact support.');
      } else if (error.code === 'auth/invalid-api-key') {
        throw new Error('Invalid API key. Please contact support.');
      } else if (error.code === 'auth/app-not-authorized') {
        throw new Error('App not authorized for this project. Please contact support.');
      } else {
        throw error;
      }
    }
  };

  const resetPassword = async (email: string) => {
    console.log('🔄 [resetPassword] Sending password reset email to:', email);
    
    try {
      await sendPasswordResetEmail(auth, email);
      console.log('✅ [resetPassword] Password reset email sent successfully');
    } catch (error: any) {
      console.error('❌ [resetPassword] Failed to send password reset email:', {
        code: error.code,
        message: error.message
      });
      
      // Handle specific password reset errors
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email address.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address format.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many password reset attempts. Please try again later.');
      } else {
        throw new Error('Failed to send password reset email. Please try again.');
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, login, loginWithGoogle, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}