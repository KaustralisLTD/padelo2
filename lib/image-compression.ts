/**
 * Utility functions for image compression on client side
 */

export interface CompressImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number; // Maximum file size in KB after compression
}

/**
 * Compress image file using Canvas API
 * @param file - Original image file
 * @param options - Compression options
 * @returns Promise with compressed image as base64 string
 */
export async function compressImage(
  file: File,
  options: CompressImageOptions = {}
): Promise<string> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.85,
    maxSizeKB = 500, // 500KB max
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Use high quality image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with quality compression
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            
            // Check if compressed size is acceptable
            const sizeKB = blob.size / 1024;
            
            if (sizeKB > maxSizeKB) {
              // Try again with lower quality
              canvas.toBlob(
                (smallerBlob) => {
                  if (!smallerBlob) {
                    reject(new Error('Failed to compress image'));
                    return;
                  }
                  
                  // Convert to base64
                  const reader2 = new FileReader();
                  reader2.onloadend = () => {
                    resolve(reader2.result as string);
                  };
                  reader2.onerror = () => {
                    reject(new Error('Failed to read compressed image'));
                  };
                  reader2.readAsDataURL(smallerBlob);
                },
                'image/jpeg',
                Math.max(0.5, quality - 0.2) // Reduce quality further
              );
            } else {
              // Convert to base64
              const reader2 = new FileReader();
              reader2.onloadend = () => {
                resolve(reader2.result as string);
              };
              reader2.onerror = () => {
                reject(new Error('Failed to read compressed image'));
              };
              reader2.readAsDataURL(blob);
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Compress image with automatic quality adjustment to meet size requirements
 * @param file - Original image file
 * @param maxSizeKB - Maximum size in KB (default: 500KB)
 * @returns Promise with compressed image as base64 string
 */
export async function compressImageToSize(
  file: File,
  maxSizeKB: number = 500
): Promise<string> {
  let quality = 0.9;
  let attempts = 0;
  const maxAttempts = 5;
  
  while (attempts < maxAttempts) {
    try {
      const compressed = await compressImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality,
        maxSizeKB,
      });
      
      // Check actual size
      const base64SizeKB = (compressed.length * 3) / 4 / 1024;
      
      if (base64SizeKB <= maxSizeKB) {
        return compressed;
      }
      
      // Reduce quality for next attempt
      quality -= 0.15;
      attempts++;
    } catch (error) {
      console.error('Image compression error:', error);
      throw error;
    }
  }
  
  // If still too large, use minimum quality
  return compressImage(file, {
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.6,
    maxSizeKB,
  });
}

