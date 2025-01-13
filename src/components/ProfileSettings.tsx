'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { FaCamera, FaTrash } from 'react-icons/fa';
import { auth } from '@/services/api';

interface ProfileSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileSettings({ isOpen, onClose }: ProfileSettingsProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(auth.getUser()?.avatarUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/avatar`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to upload avatar');

      const data = await response.json();
      setAvatarUrl(data.avatarUrl);
      
      // Update user in local storage
      const user = auth.getUser();
      if (user) {
        user.avatarUrl = data.avatarUrl;
        auth.setUser(user);
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setIsUploading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/avatar`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to remove avatar');

      setAvatarUrl(null);
      
      // Update user in local storage
      const user = auth.getUser();
      if (user) {
        user.avatarUrl = undefined;
        auth.setUser(user);
      }
    } catch (error) {
      console.error('Error removing avatar:', error);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-purple-500">Profile Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col items-center space-y-4">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-700 relative">
              {avatarUrl ? (
                <Image
                  src={`${process.env.NEXT_PUBLIC_API_URL}${avatarUrl}`}
                  alt="Profile avatar"
                  layout="fill"
                  objectFit="cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <FaCamera size={32} />
                </div>
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                </div>
              )}
            </div>
            
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex space-x-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-purple-600 p-2 rounded-full hover:bg-purple-700 transition-colors"
                  disabled={isUploading}
                >
                  <FaCamera size={16} />
                </button>
                {avatarUrl && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="bg-red-600 p-2 rounded-full hover:bg-red-700 transition-colors"
                    disabled={isUploading}
                  >
                    <FaTrash size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <p className="text-sm text-gray-400">
            Click the camera icon to upload a new avatar
          </p>
        </div>
      </div>
    </div>
  );
} 