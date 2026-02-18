export const validateStatusFile = (file: File): { valid: boolean; error?: string } => {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  if (!isImage && !isVideo) {
    return { valid: false, error: 'Please upload an image or video file' };
  }

  const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `File too large. Max size: ${isVideo ? '50MB' : '10MB'}` 
    };
  }

  return { valid: true };
};

export const createStatusFormData = (
  file: File, 
  caption?: string
): FormData => {
  const formData = new FormData();
  const type = file.type.startsWith('image/') ? 'image' : 'video';
  
  formData.append('type', type);
  formData.append('status', file);
  
  if (caption) {
    formData.append('caption', caption);
  }

  return formData;
};

export const getStatusTimeRemaining = (expiresAt: string): string => {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires.getTime() - now.getTime();

  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }
  return `${minutes}m left`;
};