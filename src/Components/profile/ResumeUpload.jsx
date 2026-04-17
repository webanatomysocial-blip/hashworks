"use client";

import { useState } from 'react';
import { FiFileText, FiUpload, FiLoader, FiExternalLink, FiCheckCircle } from 'react-icons/fi';
import { uploadFile, getSignedUrl } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

export default function ResumeUpload({ userId, resumePath, onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, success, error

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid document (PDF, DOC, or DOCX)');
      return;
    }

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }

    setSelectedFileName(file.name);

    try {
      setUploading(true);
      setStatus('uploading');

      // Use a consistent path for the resume
      const filePath = `${userId}/resume.pdf`;
      
      await uploadFile('Resume-CV', filePath, file);
      
      // Update profiles.resume_path in DB
      const { error } = await supabase
        .from('profiles')
        .update({ resume_path: filePath })
        .eq('id', userId);

      if (error) throw error;

      setStatus('success');
      if (onUploadSuccess) onUploadSuccess(filePath);
      
      setTimeout(() => setStatus('idle'), 3000); // Reset status after 3s
    } catch (error) {
      console.error('Error uploading resume:', error);
      alert(`Failed to upload resume: ${error.message || 'Please try again.'}`);
      setStatus('error');
    } finally {
      setUploading(false);
    }
  };

  const handleViewResume = async () => {
    if (!resumePath) return;
    try {
      // Get a signed URL since the bucket is private
      const signedUrl = await getSignedUrl('Resume-CV', resumePath, 60);
      window.open(signedUrl, '_blank');
    } catch (error) {
      console.error('Error getting signed URL:', error);
      alert('Failed to access resume. Please try again.');
    }
  };

  return (
    <div className="wh-resume-upload">
      <div className="resume-status-card">
        <div className="resume-icon-box">
          <FiFileText size={32} />
        </div>
        
        <div className="resume-info">
          {resumePath ? (
            <>
              <h3>Resume / CV</h3>
              <p className="resume-path-text">Your professional resume is uploaded</p>
            </>
          ) : (
            <>
              <h3>No Resume Uploaded</h3>
              <p>Upload your resume to apply for high-value gigs</p>
            </>
          )}
        </div>

        <div className="resume-actions">
          {resumePath && (
            <button 
              className="view-resume-btn" 
              onClick={handleViewResume}
              title="View Current Resume"
            >
              <FiExternalLink /> View
            </button>
          )}
          
          <label className={`upload-resume-btn ${uploading ? 'disabled' : ''}`}>
            {uploading ? (
              <FiLoader className="loading-spinner" />
            ) : status === 'success' ? (
              <FiCheckCircle />
            ) : (
              <FiUpload />
            )}
            <span>{resumePath ? 'Update' : 'Upload'}</span>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx"
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>
      
      {selectedFileName && status === 'uploading' && (
        <p className="upload-filename">Uploading: {selectedFileName}...</p>
      )}
    </div>
  );
}
