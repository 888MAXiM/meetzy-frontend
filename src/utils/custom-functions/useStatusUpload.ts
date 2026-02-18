import { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { mutations } from '../../api';

export const useStatusUpload = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showCaptionModal, setShowCaptionModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const createStatusMutation = mutations.useCreateStatus();

  const validateFile = (file: File): boolean => {
    const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    if (![...validImageTypes, ...validVideoTypes].includes(file.type)) {
      toast.error('Please select a valid image or video file');
      return false;
    }
    return true;
  };

  const validateVideoDuration = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > 30) {
          toast.error('Video must be 30 seconds or less');
          resolve(false);
        } else {
          resolve(true);
        }
      };
      video.onerror = () => {
        toast.error('Error loading video');
        resolve(false);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    if (!file) return;
    if (!validateFile(file)) return;
    
    if (file.type.startsWith('video/')) {
      const isValid = await validateVideoDuration(file);
      if (!isValid) return;
    }
    
    setSelectedFile(file);
    setShowCaptionModal(true);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('status', selectedFile);
      formData.append('type', selectedFile.type.startsWith('image/') ? 'image' : 'video');
      
      if (caption.trim()) {
        formData.append('caption', caption.trim());
      }
      
      await createStatusMutation.mutateAsync(formData);
      toast.success('Status uploaded successfully!');
      
      resetUploadState();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to upload status');
    } finally {
      setUploading(false);
    }
  };

  const resetUploadState = () => {
    setSelectedFile(null);
    setCaption('');
    setShowCaptionModal(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    if (!showCaptionModal && !selectedFile) {
      fileInputRef.current?.click();
    }
  };

  return {
    fileInputRef,
    uploading,
    showCaptionModal,
    selectedFile,
    caption,
    setCaption,
    handleFileSelect,
    handleUpload,
    resetUploadState,
    openFileDialog,
    setShowCaptionModal,
  };
};