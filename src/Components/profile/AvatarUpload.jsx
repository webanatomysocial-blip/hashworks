"use client";

import { useState, useRef } from 'react';
import { FiCamera, FiLoader } from 'react-icons/fi';
import { uploadFile, getPublicUrl, deleteFile } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

export default function AvatarUpload({ userId, currentUrl, userName, onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const initials = userName?.[0]?.toUpperCase() || '?';

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image (PNG, JPG, or WEBP)');
      return;
    }

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB');
      return;
    }

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    try {
      setUploading(true);
      
      // Upload to 'Avatar' bucket
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}.${fileExt}`;
      
      await uploadFile('Avatar', filePath, file);
      
      // Get the final public URL and add a cache-buster
      const publicUrl = `${getPublicUrl('Avatar', filePath)}?t=${Date.now()}`;
      
      // Update profiles.avatar_url in DB
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (error) throw error;

      console.log('Successfully uploaded avatar:', publicUrl);

      // Clean up old file if extension changed
      if (currentUrl) {
        try {
          const oldPathMatch = currentUrl.match(new RegExp(`${userId}\\.[a-zA-Z]+`));
          const oldPath = oldPathMatch ? oldPathMatch[0] : null;
          
          if (oldPath && oldPath !== filePath) {
            console.log('Cleaning up old avatar:', oldPath);
            await deleteFile('Avatar', oldPath);
          }
        } catch (cleanupError) {
          console.warn('Failed to cleanup old avatar:', cleanupError);
          // Don't fail the whole upload just because cleanup failed
        }
      }

      setPreview(null); // Clear local preview so the final URL is used
      if (onUploadSuccess) onUploadSuccess(publicUrl);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert(`Failed to upload image: ${error.message || 'Please try again.'}`);
      setPreview(null); // Clear preview on failure
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="wh-avatar-upload">
      <div className="avatar-preview-container">
        {preview || currentUrl ? (
          <img src={preview || currentUrl} alt="Profile" className="avatar-img" />
        ) : (
          <div className="avatar-placeholder">
            <span>{initials}</span>
          </div>
        )}
        
        <div 
          className="avatar-overlay" 
          onClick={() => !uploading && fileInputRef.current.click()}
        >
          {uploading ? (
            <FiLoader className="loading-spinner" size={24} />
          ) : (
            <FiCamera size={24} />
          )}
        </div>
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/webp"
        style={{ display: 'none' }}
      />
    </div>
  );
}
