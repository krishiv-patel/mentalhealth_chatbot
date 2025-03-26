import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, X, Edit, Calendar, Users, Save, Trash2, AlertTriangle, AlertCircle, Image, RefreshCw, Upload, Loader2, Lock, Unlock } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { useProfileStore } from '../store/useProfileStore';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import UserType from '@supabase/supabase-js';

interface ProfileModalProps {
  user: UserType.User | null;
  isOpen: boolean;
  onClose: () => void;
}

const IMGBB_API_KEY = '22160f47eda0fc1be9437cba5d879a58';
const DEFAULT_AVATAR = "https://img.icons8.com/?size=100&id=tZuAOUGm9AuS&format=png&color=000000";

const ProfileModal: React.FC<ProfileModalProps> = ({ user, isOpen, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { profile, fetchProfile, updateProfile, loading } = useProfileStore();
  const { deleteAccount } = useAuthStore();
  const { isEncryptionEnabled, isEncryptionInitialized, toggleEncryption, initializeEncryption } = useChatStore();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (user && isOpen) {
      fetchProfile();
    }
  }, [user, fetchProfile, isOpen]);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setGender(profile.gender || '');
      setDateOfBirth(profile.date_of_birth || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    if (!gender) {
      errors.gender = 'Gender is required';
    }
    
    if (!dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setImageError('Image size should be less than 2MB');
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setImageError('Please select an image file');
      return;
    }
    
    setImageError(null);
    setUploadingImage(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAvatarUrl(data.data.url);
      } else {
        setImageError('Failed to upload image. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setImageError('Error uploading image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDefaultAvatar = () => {
    setAvatarUrl(DEFAULT_AVATAR);
    setImageError(null);
  };

  const handleOpenFileSelector = () => {
    fileInputRef.current?.click();
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    try {
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        gender,
        date_of_birth: dateOfBirth,
        avatar_url: avatarUrl
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      setDeleteError(null);
      await deleteAccount();
      // The component will unmount after successful deletion as the user will be signed out
    } catch (error: any) {
      setIsDeleting(false);
      setDeleteError(error.message || 'Failed to delete account. Please try again.');
    }
  };

  const handleToggleEncryption = async () => {
    if (!isEncryptionInitialized) {
      // First initialize encryption
      await initializeEncryption();
    } else {
      // Toggle current encryption state
      toggleEncryption(!isEncryptionEnabled);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setIsEditing(false);
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black z-40"
          />

          {/* Modal Container - Using flex to center */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "w-[95%] sm:w-full max-w-md p-6 rounded-lg shadow-lg",
                "bg-white dark:bg-zinc-900",
                "border border-zinc-200 dark:border-zinc-800",
                "max-h-[85vh] overflow-y-auto"
              )}
            >
              {showDeleteConfirm ? (
                // Delete Confirmation Screen
                <div className="space-y-4">
                  <div className="flex items-center justify-center text-destructive mb-4">
                    <AlertTriangle className="h-12 w-12" />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-center">Delete Your Account?</h3>
                  
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center">
                    This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                  </p>
                  
                  {deleteError && (
                    <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                      {deleteError}
                    </div>
                  )}
                  
                  <div className="flex space-x-3 pt-2 pb-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete Account'}
                    </Button>
                  </div>
                </div>
              ) : (
                // Normal Profile Screen
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">Profile</h3>
                    <div className="flex space-x-2">
                      {!isEditing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditing(true)}
                          className="hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClose}
                        className="hover:rotate-90 transition-transform"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col items-center space-y-4 mb-6">
                    <div 
                      className={cn(
                        "w-24 h-24 rounded-full overflow-hidden bg-zinc-200 flex items-center justify-center relative group",
                        isEditing ? "cursor-pointer" : ""
                      )}
                      onClick={isEditing ? handleOpenFileSelector : undefined}
                    >
                      {uploadingImage ? (
                        <div className="flex flex-col items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <span className="text-xs mt-1">Uploading...</span>
                        </div>
                      ) : (
                        <>
                          {avatarUrl ? (
                            <img 
                              src={avatarUrl} 
                              alt={profile?.first_name || user?.email || ''} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = DEFAULT_AVATAR;
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-rose-400 to-indigo-500 flex items-center justify-center">
                              <span className="text-lg font-bold text-white">
                                {profile?.first_name ? profile.first_name.charAt(0).toUpperCase() : user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                              </span>
                            </div>
                          )}
                          {isEditing && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="text-white text-xs font-medium flex flex-col items-center">
                                <Upload className="h-5 w-5 mb-1" />
                                Upload Image
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      {/* Hidden file input */}
                      <input 
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {user?.email}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {isEditing && (
                      <div className="flex justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDefaultAvatar}
                          className="text-xs"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Reset to Default Avatar
                        </Button>
                      </div>
                    )}
                    
                    {imageError && (
                      <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400">
                        <div className="flex items-center">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          {imageError}
                        </div>
                      </div>
                    )}

                    {isEditing ? (
                      // Edit Mode
                      <>
                        {/* Name Fields */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-zinc-500 mb-1 block">
                              First Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              className={cn(
                                "w-full px-3 py-2 rounded-md border bg-white dark:bg-zinc-800 text-sm",
                                validationErrors.firstName ? "border-red-500" : ""
                              )}
                              required
                            />
                            {validationErrors.firstName && (
                              <p className="text-red-500 text-xs mt-1 flex items-center">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {validationErrors.firstName}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="text-xs text-zinc-500 mb-1 block">
                              Last Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              className={cn(
                                "w-full px-3 py-2 rounded-md border bg-white dark:bg-zinc-800 text-sm",
                                validationErrors.lastName ? "border-red-500" : ""
                              )}
                              required
                            />
                            {validationErrors.lastName && (
                              <p className="text-red-500 text-xs mt-1 flex items-center">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {validationErrors.lastName}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Gender and DOB Fields */}
                        <div>
                          <label className="text-xs text-zinc-500 mb-1 block">
                            Gender <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            className={cn(
                              "w-full px-3 py-2 rounded-md border bg-white dark:bg-zinc-800 text-sm",
                              validationErrors.gender ? "border-red-500" : ""
                            )}
                            required
                          >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="non-binary">Non-binary</option>
                            <option value="prefer-not-to-say">Prefer not to say</option>
                          </select>
                          {validationErrors.gender && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {validationErrors.gender}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="text-xs text-zinc-500 mb-1 block">
                            Date of Birth <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={dateOfBirth}
                            onChange={(e) => setDateOfBirth(e.target.value)}
                            className={cn(
                              "w-full px-3 py-2 rounded-md border bg-white dark:bg-zinc-800 text-sm",
                              validationErrors.dateOfBirth ? "border-red-500" : ""
                            )}
                            required
                          />
                          {validationErrors.dateOfBirth && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {validationErrors.dateOfBirth}
                            </p>
                          )}
                        </div>

                        <Button
                          onClick={handleSaveProfile}
                          disabled={isSaving || uploadingImage}
                          className="w-full mt-2"
                        >
                          {isSaving ? 'Saving...' : 'Save Changes'}
                          <Save className="h-4 w-4 ml-2" />
                        </Button>
                      </>
                    ) : (
                      // View Mode
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-xs uppercase text-zinc-500">First Name</h4>
                            <p className="text-sm font-medium">{profile?.first_name || 'Not set'}</p>
                          </div>
                          <div>
                            <h4 className="text-xs uppercase text-zinc-500">Last Name</h4>
                            <p className="text-sm font-medium">{profile?.last_name || 'Not set'}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-xs uppercase text-zinc-500">Gender</h4>
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4 text-zinc-400" />
                              <p className="text-sm font-medium capitalize">{profile?.gender || 'Not set'}</p>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs uppercase text-zinc-500">Date of Birth</h4>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-zinc-400" />
                              <p className="text-sm font-medium">{formatDate(profile?.date_of_birth)}</p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {/* Encryption Settings */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                      <h3 className="text-lg font-medium mb-2 flex items-center">
                        {isEncryptionEnabled ? <Lock className="w-4 h-4 mr-2" /> : <Unlock className="w-4 h-4 mr-2" />}
                        End-to-End Encryption
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {isEncryptionEnabled 
                          ? "Your messages are encrypted and can only be read by you." 
                          : "Enable encryption to protect your messages."}
                      </p>
                      <div className="flex items-center">
                        <button
                          onClick={handleToggleEncryption}
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full",
                            isEncryptionEnabled 
                              ? "bg-emerald-600" 
                              : "bg-gray-300 dark:bg-gray-600"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition",
                              isEncryptionEnabled ? "translate-x-6" : "translate-x-1"
                            )}
                          />
                        </button>
                        <span className="ml-2 text-sm">
                          {isEncryptionEnabled ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-zinc-200 dark:border-zinc-700">
                      <Button
                        variant="destructive"
                        className="w-full mb-4"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(true)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProfileModal; 