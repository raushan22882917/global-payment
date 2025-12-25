import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export interface FileUploadOptions {
  maxSize?: number; // in bytes, default 5MB
  allowedTypes?: string[]; // MIME types
  folder?: string; // Storage folder path
}

export const uploadFile = async (
  file: File,
  path: string,
  options: FileUploadOptions = {}
): Promise<string> => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    folder = 'uploads'
  } = options;

  // Validate file size
  if (file.size > maxSize) {
    throw new Error(`File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`);
  }

  // Validate file type
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }

  // Create storage reference
  const timestamp = Date.now();
  const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const storageRef = ref(storage, `${folder}/${path}/${fileName}`);

  try {
    console.log('🔄 Attempting to upload file to Firebase Storage:', `${folder}/${path}/${fileName}`);
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    console.log('✅ File uploaded successfully, getting download URL...');
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('✅ Download URL obtained:', downloadURL);
    
    return downloadURL;
  } catch (error: any) {
    console.error('❌ Firebase Storage upload failed:', error);
    console.error('   Error code:', error.code);
    console.error('   Error message:', error.message);
    
    // Provide detailed error analysis
    if (error.code === 'storage/unauthorized') {
      console.error('🔒 Permission denied - this is likely an IAM configuration issue');
      
      // Check if this is a rules propagation issue
      const now = Date.now();
      const deployTime = localStorage.getItem('storage-rules-deploy-time');
      const timeSinceDeployment = deployTime ? now - parseInt(deployTime) : Infinity;
      
      if (timeSinceDeployment < 10 * 60 * 1000) { // Less than 10 minutes
        throw new Error('Firebase Storage is still being configured. Please wait a few minutes and try again, or contact your administrator.');
      } else {
        throw new Error('Firebase Storage is not properly configured. The application will use a fallback method. Please contact your administrator to enable Firebase Storage.');
      }
    } else if (error.code === 'storage/canceled') {
      throw new Error('File upload was canceled. Please try again.');
    } else if (error.code === 'storage/unknown') {
      console.error('🌐 Network or server error detected');
      throw new Error('Network error occurred during upload. Please check your internet connection and try again.');
    } else if (error.code === 'storage/invalid-checksum') {
      throw new Error('File upload failed due to network issues. Please try again.');
    } else if (error.code === 'storage/retry-limit-exceeded') {
      throw new Error('Upload failed after multiple attempts. Please try again later.');
    } else if (error.message?.includes('does not have storage.buckets.get access')) {
      console.error('🔧 Service account lacks Google Cloud Storage permissions');
      throw new Error('Firebase Storage is not properly configured. Please contact your administrator to set up storage permissions.');
    } else if (error.message?.includes('CORS')) {
      console.error('🌐 CORS configuration issue detected');
      throw new Error('Storage configuration issue detected. Please contact your administrator.');
    } else {
      console.error('❓ Unknown storage error:', error);
      throw new Error(`Storage upload failed: ${error.message || 'Unknown error'}. Please try again or contact support.`);
    }
  }
};

export const deleteFile = async (url: string): Promise<void> => {
  try {
    // Extract path from URL
    const urlParts = url.split('/');
    const pathIndex = urlParts.findIndex(part => part.includes('firebase'));
    if (pathIndex === -1) return;
    
    const pathPart = urlParts.slice(pathIndex + 1).join('/');
    const decodedPath = decodeURIComponent(pathPart.split('?')[0]);
    
    const fileRef = ref(storage, decodedPath);
    await deleteObject(fileRef);
  } catch (error: any) {
    console.error('Error deleting file:', error);
    // Don't throw error for file deletion failures to avoid blocking UI
    if (error.code !== 'storage/object-not-found') {
      console.warn('Failed to delete file, but continuing...');
    }
  }
};

export const validateImageFile = (file: File): string | null => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return 'Please select a valid image file (JPEG, PNG, GIF, or WebP)';
  }

  if (file.size > maxSize) {
    return 'Image size must be less than 5MB';
  }

  return null;
};

export const resizeImage = (file: File, maxWidth: number = 800, maxHeight: number = 600, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(resizedFile);
          } else {
            reject(new Error('Failed to resize image'));
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// Fallback function for when Firebase Storage is not available
export const createDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

// Mark when storage rules were deployed (for troubleshooting)
export const markStorageRulesDeployed = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('storage-rules-deploy-time', Date.now().toString());
  }
};

// Test storage permissions
export const testStoragePermissions = async (): Promise<boolean> => {
  try {
    // Create a small test file
    const testContent = new Blob(['test'], { type: 'text/plain' });
    const testFile = new File([testContent], 'test.txt', { type: 'text/plain' });
    
    // Try to upload to a test location
    const testRef = ref(storage, `test/permissions-test-${Date.now()}.txt`);
    await uploadBytes(testRef, testFile);
    
    // Clean up
    await deleteObject(testRef);
    
    return true;
  } catch (error) {
    console.error('Storage permissions test failed:', error);
    return false;
  }
};