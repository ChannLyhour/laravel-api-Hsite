import React, { useState, useEffect, useRef } from 'react';
import { 
  FiUser, 
  FiLoader, 
  FiUploadCloud, 
  FiTrash2, 
  FiEye, 
  FiEyeOff, 
  FiSave, 
  FiMapPin, 
  FiMail, 
  FiPhone,
  FiLock
} from 'react-icons/fi';
import { toast } from '@/pages/owner_manage/utils/toast';
import { authService } from '@/api/auth';
import { resolveImageUrl } from '@/api/imageUtils';
import '@/pages/owner_manage/style/font.css';

interface ProfileOwnerTabProps {
  profile: any;
  onProfileUpdate: () => void;
}

export const ProfileOwnerTab: React.FC<ProfileOwnerTabProps> = ({ profile, onProfileUpdate }) => {
  const [saving, setSaving] = useState(false);

  // Profile Form States
  const [name, setName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('male');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');

  // Password Update States
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Avatar/Image Upload States
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarError, setAvatarError] = useState(false);

  // Delete Account States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize fields on profile load
  useEffect(() => {
    if (profile?.user) {
      const u = profile.user;
      setName(u.name || '');
      setFirstName(u.first_name || '');
      setLastName(u.last_name || '');
      setGender(u.gender || 'male');
      setEmail(u.email || '');
      setPhone(u.phone || '');
      setAddress(u.address || '');
      setCity(u.city || '');
      setState(u.state || '');
      setCountry(u.country || '');
      setAvatarPreview(u.image_url ? resolveImageUrl(u.image_url) : '');
      setAvatarError(false);
    }
  }, [profile]);

  // Handle Avatar Change
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Avatar image size must be under 2MB.');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarError(false);
  };

  // Handle Avatar Removal
  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Revert Form Changes
  const handleDiscardChanges = () => {
    if (profile?.user) {
      const u = profile.user;
      setName(u.name || '');
      setFirstName(u.first_name || '');
      setLastName(u.last_name || '');
      setGender(u.gender || 'male');
      setEmail(u.email || '');
      setPhone(u.phone || '');
      setAddress(u.address || '');
      setCity(u.city || '');
      setState(u.state || '');
      setCountry(u.country || '');
      setAvatarFile(null);
      setAvatarPreview(u.image_url ? resolveImageUrl(u.image_url) : '');
      setPassword('');
      setConfirmPassword('');
      setAvatarError(false);
      toast.success('Changes discarded. Form reset to server values.');
    }
  };

  // Form Submit Action
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Store Name / Display Name is required.');
      return;
    }

    if (!email.trim()) {
      toast.error('Email is required.');
      return;
    }

    // Password validations if filled
    if (password) {
      if (password.length < 6) {
        toast.error('New password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        toast.error('New password and confirm password fields must match.');
        return;
      }
    }

    setSaving(true);
    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('first_name', firstName.trim());
    formData.append('last_name', lastName.trim());
    formData.append('gender', gender);
    formData.append('email', email.trim());
    formData.append('phone', phone.trim());
    formData.append('address', address.trim());
    formData.append('city', city.trim());
    formData.append('state', state.trim());
    formData.append('country', country.trim());

    if (password) {
      formData.append('password', password);
    }

    if (avatarFile) {
      formData.append('image', avatarFile);
    } else if (!avatarPreview) {
      // If user cleared avatar, send empty string to indicate removal
      formData.append('image', '');
    }

    try {
      const res = await authService.updateProfile(formData);
      if (res.success) {
        toast.success(res.message || 'Owner profile updated successfully!');
        // Reset password fields
        setPassword('');
        setConfirmPassword('');
        setAvatarFile(null);
        // Call callback to refresh state in parent layout
        onProfileUpdate();
      } else {
        toast.error(res.message || 'Failed to update owner profile.');
      }
    } catch (err: any) {
      console.error('Profile update error:', err);
      const msg = err?.details?.message || err?.message || 'An error occurred while saving profile changes.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== 'DELETE') {
      toast.error("Please type 'DELETE' in uppercase to confirm account deletion.");
      return;
    }
    
    setDeletingAccount(true);
    try {
      const res = await authService.deleteAccount();
      if (res.success) {
        toast.success("Account and store data deleted successfully.");
        // Clear all token/auth info from storage
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
        localStorage.removeItem('selected_owner_id');
        window.location.href = '/login'; // Redirect to login page
      } else {
        toast.error(res.message || "Failed to delete account.");
      }
    } catch (err: any) {
      console.error('Account delete error:', err);
      toast.error(err?.message || "An error occurred during account deletion.");
    } finally {
      setDeletingAccount(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="border p-6 sm:p-8 rounded-[5px] shadow-xs space-y-8 animate-fade-in font-kuntomruy custom-card-container">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
          <FiUser className="text-orange-500" />
          <span>Owner Profile Management</span>
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Manage your personal details, contact coordinates, change your account password, and update your profile picture.
        </p>
      </div>

      <form onSubmit={handleSaveChanges} className="space-y-8">
        
        {/* Section 1: Avatar Upload */}
        <div className="border-b border-slate-100 pb-6 space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Avatar Picture</h4>
          <div className="flex items-start space-x-6">
            
            {/* Avatar Preview Container */}
            <div className="w-24 h-24 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 relative group">
              {avatarPreview && !avatarError ? (
                <img
                  src={avatarPreview}
                  alt="Owner Avatar"
                  className="w-full h-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-300">
                  <FiUser className="w-10 h-10 stroke-[1.5]" />
                </div>
              )}
              {saving && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center">
                  <FiLoader className="w-5 h-5 text-orange-500 animate-spin" />
                </div>
              )}
            </div>

            {/* Upload Buttons and Metadata */}
            <div className="space-y-2 mt-2">
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-[5px] text-xs font-extrabold flex items-center space-x-1.5 transition-all shadow-2xs hover:shadow-xs active:scale-98 cursor-pointer border-none"
                  disabled={saving}
                >
                  <FiUploadCloud className="w-4 h-4" />
                  <span>Choose Avatar</span>
                </button>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="p-2 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-[5px] border border-slate-200 hover:border-rose-100 transition-all cursor-pointer"
                    title="Remove Avatar"
                    disabled={saving}
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                PNG, JPG, WebP. Recommended: 300x300px square. Maximum file size: 2MB.
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />
          </div>
        </div>

        {/* Section 2: General Profile Info */}
        <div className="border-b border-slate-100 pb-6 space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Personal Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Display / Store Name */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs sm:text-sm font-bold text-slate-700 block">Display Name / Company Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John's Pizzeria"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 font-semibold"
                required
              />
            </div>

            {/* First Name */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-700 block">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 font-semibold"
              />
            </div>

            {/* Last Name */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-700 block">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 font-semibold"
              />
            </div>

            {/* Gender Select */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-700 block">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-[5px] text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-700 block flex items-center space-x-1">
                <FiMail className="text-slate-400" />
                <span>Authorized Email Contact</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@domain.com"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 font-semibold"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 3: Contact Details & Location */}
        <div className="border-b border-slate-100 pb-6 space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contact & Location</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-700 block flex items-center space-x-1">
                <FiPhone className="text-slate-400" />
                <span>Phone Number</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+855 12 345 678"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 font-semibold"
              />
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-700 block">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Phnom Penh"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 font-semibold"
              />
            </div>

            {/* State / Region */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-700 block">State / Province / Region</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Phnom Penh"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 font-semibold"
              />
            </div>

            {/* Country */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-700 block">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Cambodia"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 font-semibold"
              />
            </div>

            {/* Address */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs sm:text-sm font-bold text-slate-700 block flex items-center space-x-1">
                <FiMapPin className="text-slate-400" />
                <span>Physical Address</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="No. 123, St 456, Boeung Keng Kang"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Security (Password Modification) */}
        <div className="pb-4 space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Security Credentials</h4>
          <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-[5px] space-y-5">
            <div className="flex items-start space-x-3 text-slate-500">
              <FiLock className="w-5 h-5 mt-0.5 text-orange-500 shrink-0" />
              <div className="text-xs leading-relaxed">
                <strong className="text-slate-800 font-bold">Update Account Password</strong>
                <p className="text-slate-400 mt-0.5">
                  To keep your current password, simply leave both fields below blank. If you wish to change it, fill in both inputs.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
              
              {/* New Password */}
              <div className="space-y-1.5 relative">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full pl-4 pr-10 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer p-1"
                  >
                    {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5 relative">
                <label className="text-xs sm:text-sm font-bold text-slate-700 block">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full pl-4 pr-10 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer p-1"
                  >
                    {showConfirmPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="pt-6 border-t border-slate-100 flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleDiscardChanges}
            className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-[5px] text-xs font-extrabold transition-all cursor-pointer border-none"
            disabled={saving}
          >
            Discard Changes
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-[5px] text-xs font-extrabold shadow-xs active:scale-98 transition-all cursor-pointer flex items-center space-x-1.5 border-none"
            disabled={saving}
          >
            {saving ? (
              <>
                <FiLoader className="w-4 h-4 animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <FiSave className="w-4 h-4" />
                <span>Save Profile Updates</span>
              </>
            )}
          </button>
        </div>

      </form>

      {/* Danger Zone: Delete Account */}
      <div className="pt-8 border-t border-slate-100 space-y-4">
        <div className="bg-red-50/50 border border-red-100 rounded-[8px] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h4 className="text-sm font-extrabold text-red-600 uppercase tracking-wider flex items-center gap-2">
              <FiTrash2 className="w-4 h-4 shrink-0" />
              <span>Danger Zone: Delete Account</span>
            </h4>
            <p className="text-slate-500 text-xs sm:text-sm">
              Permanently delete your owner profile, your store configuration, and all associated items (products, menus, sales data). This action is irreversible.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-[5px] text-xs font-extrabold shadow-sm active:scale-98 transition-all cursor-pointer border-none shrink-0"
          >
            Delete Account & Store
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-[8px] border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-scale-up">
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-3 text-red-600">
                <FiTrash2 className="w-6 h-6" />
                <h3 className="text-lg font-black uppercase tracking-wider">Confirm Account Deletion</h3>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">
                This action is <span className="font-bold text-red-600">permanently destructive</span>. It will delete your owner profile, your store key-value settings, products, menus, categories, order logs, and chat histories.
              </p>
              <div className="bg-red-50 text-red-700 text-xs p-3 rounded-[5px] border border-red-100/50 leading-relaxed font-semibold">
                Please type <span className="font-extrabold text-red-800">DELETE</span> below to confirm that you understand and wish to proceed.
              </div>
              <div className="space-y-1.5">
                <input
                  type="text"
                  placeholder="Type DELETE to confirm"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-slate-700 font-bold tracking-wider"
                />
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex justify-end space-x-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmationText(''); }}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-[5px] text-xs font-extrabold transition-all cursor-pointer"
                disabled={deletingAccount}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmationText !== 'DELETE' || deletingAccount}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-[5px] text-xs font-extrabold shadow-sm active:scale-98 transition-all cursor-pointer border-none flex items-center space-x-1.5"
              >
                {deletingAccount ? (
                  <>
                    <FiLoader className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Permanently Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
