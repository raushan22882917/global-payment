export const getAuthErrorMessage = (error: any): string => {
  const errorCode = error?.code || '';
  const errorMessage = error?.message || '';

  // Firebase Auth error codes
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-email':
      return 'Invalid email address format.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    case 'auth/popup-closed-by-user':
      return 'Login cancelled by user.';
    case 'auth/popup-blocked':
      return 'Popup blocked by browser. Please allow popups and try again.';
    case 'auth/cancelled-popup-request':
      return 'Login cancelled.';
    case 'auth/configuration-not-found':
      return 'Authentication configuration error. Please contact support.';
    case 'auth/invalid-api-key':
      return 'Invalid API key. Please contact support.';
    case 'auth/app-not-authorized':
      return 'App not authorized for this project. Please contact support.';
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a stronger password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/operation-not-allowed':
      return 'This operation is not allowed. Please contact support.';
    case 'auth/expired-action-code':
      return 'Reset link has expired. Please request a new one.';
    case 'auth/invalid-action-code':
      return 'Invalid or expired reset link. Please request a new one.';
    case 'auth/missing-action-code':
      return 'Missing reset code. Please use the link from your email.';
    case 'auth/user-token-expired':
      return 'Your session has expired. Please sign in again.';
    case 'auth/requires-recent-login':
      return 'Please sign in again to complete this action.';
    case 'unavailable':
      return 'Service temporarily unavailable. Please try again.';
    default:
      // Handle custom error messages
      if (errorMessage.includes('Account not found in system')) {
        return 'Account not found in system. Please contact your administrator to create your account first.';
      }
      if (errorMessage.includes('account is inactive')) {
        return 'Your account is inactive. Please contact your administrator.';
      }
      if (errorMessage.includes('not properly configured')) {
        return 'Authentication service is being configured. Please try again in a few minutes.';
      }
      
      // Generic fallback
      return errorMessage || 'An unexpected error occurred. Please try again.';
  }
};