/**
 * Profile Picture Upload Utility
 * 
 * Handles validation and preparation of profile picture uploads:
 * - File size validation (max 5MB)
 * - File type validation (JPG, PNG, WebP)
 * - Image dimension validation (min 100x100, max 4096x4096)
 * - Client-side image compression for files > 2MB
 * - Security checks and sanitization
 */

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Maximum file size before compression: 2MB
const COMPRESSION_THRESHOLD = 2 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

// Image dimension constraints
const MIN_DIMENSION = 100;
const MAX_DIMENSION = 4096;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Validates file size
 */
export function validateFileSize(file: File): ValidationResult {
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      isValid: false,
      error: `File size (${sizeMB}MB) exceeds maximum allowed size of 5MB`,
    };
  }
  return { isValid: true };
}

/**
 * Validates file type
 */
export function validateFileType(file: File): ValidationResult {
  // Check MIME type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `File type "${file.type}" is not supported. Please use JPG, PNG, or WebP`,
    };
  }

  // Check file extension as additional security
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      isValid: false,
      error: `File extension "${extension}" is not allowed. Please use .jpg, .png, or .webp`,
    };
  }

  return { isValid: true };
}

/**
 * Gets image dimensions from a file
 */
export function getImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.width,
        height: img.height,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Validates image dimensions
 */
export async function validateImageDimensions(file: File): Promise<ValidationResult> {
  try {
    const dimensions = await getImageDimensions(file);

    if (dimensions.width < MIN_DIMENSION || dimensions.height < MIN_DIMENSION) {
      return {
        isValid: false,
        error: `Image is too small. Minimum size is ${MIN_DIMENSION}x${MIN_DIMENSION} pixels`,
      };
    }

    if (dimensions.width > MAX_DIMENSION || dimensions.height > MAX_DIMENSION) {
      return {
        isValid: false,
        error: `Image is too large. Maximum size is ${MAX_DIMENSION}x${MAX_DIMENSION} pixels`,
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: 'Failed to read image dimensions',
    };
  }
}

/**
 * Compresses an image file if it exceeds the compression threshold
 */
export async function compressImage(file: File, quality: number = 0.8): Promise<File> {
  // Skip compression if file is small enough
  if (file.size <= COMPRESSION_THRESHOLD) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Set canvas dimensions to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw image to canvas
      ctx.drawImage(img, 0, 0);

      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          // Create new file from blob
          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });

          // Log compression results
          const originalSizeMB = (file.size / (1024 * 1024)).toFixed(2);
          const compressedSizeMB = (compressedFile.size / (1024 * 1024)).toFixed(2);
          console.log(
            `Image compressed: ${originalSizeMB}MB → ${compressedSizeMB}MB (${quality * 100}% quality)`
          );

          resolve(compressedFile);
        },
        file.type,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for compression'));
    };

    img.src = url;
  });
}

/**
 * Validates and prepares a profile picture file for upload
 * Returns the processed file or throws an error
 */
export async function validateAndPrepareProfilePicture(file: File): Promise<File> {
  // Validate file size
  const sizeValidation = validateFileSize(file);
  if (!sizeValidation.isValid) {
    throw new Error(sizeValidation.error);
  }

  // Validate file type
  const typeValidation = validateFileType(file);
  if (!typeValidation.isValid) {
    throw new Error(typeValidation.error);
  }

  // Validate image dimensions
  const dimensionValidation = await validateImageDimensions(file);
  if (!dimensionValidation.isValid) {
    throw new Error(dimensionValidation.error);
  }

  // Compress image if needed
  const processedFile = await compressImage(file);

  return processedFile;
}

/**
 * Generates a unique filename for the profile picture
 */
export function generateProfilePictureFilename(childId: string, file: File): string {
  const timestamp = Date.now();
  const extension = file.name.substring(file.name.lastIndexOf('.'));
  return `${childId}_${timestamp}${extension}`;
}
