import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Lock, Save, Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api';

const SettingsModal = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Profile Form
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });

  // Password Form
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await userService.updateProfile(profileData);
      updateUser(res.data.user);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi cập nhật thông tin");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Mật khẩu mới không khớp!");
      return;
    }
    setSaving(true);
    setError('');
    try {
      await userService.changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi đổi mật khẩu");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        />
        
        <motion.div 
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          className="relative bg-slate-900 w-full max-w-xl rounded-[3rem] border border-white/10 overflow-hidden shadow-3xl"
        >
          {/* Header */}
          <div className="p-8 border-b border-white/5 flex items-center justify-between bg-slate-800/50">
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Cài đặt tài khoản</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Quản lý bảo mật & thông tin</p>
            </div>
            <button onClick={onClose} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors cursor-pointer text-slate-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex bg-slate-950/30 p-2 m-6 rounded-2xl border border-white/5">
            <button 
              onClick={() => { setActiveTab('profile'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'profile' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <User size={16} /> Thông tin
            </button>
            <button 
              onClick={() => { setActiveTab('password'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'password' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Lock size={16} /> Mật khẩu
            </button>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mx-8 mb-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500"
              >
                <AlertCircle size={18} />
                <p className="text-xs font-bold uppercase tracking-tight">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content */}
          <div className="p-8 pt-2">
            {activeTab === 'profile' ? (
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Tên hiển thị</label>
                  <input 
                    type="text" 
                    value={profileData.username}
                    onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white font-bold focus:ring-2 focus:ring-rose-500/20 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Địa chỉ Email</label>
                  <input 
                    type="email" 
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white font-bold focus:ring-2 focus:ring-rose-500/20 outline-none"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={saving}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest cursor-pointer transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="animate-spin" size={16} /> : (success ? <CheckCircle size={16} /> : <Save size={16} />)}
                  {success ? 'Đã lưu thành công' : 'Lưu thông tin'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Mật khẩu hiện tại</label>
                  <div className="relative">
                    <input 
                      type={!showOldPassword ? "password" : "text"} 
                      required
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 pr-12 text-white font-bold focus:ring-2 focus:ring-rose-500/20 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    >
                      {showOldPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Mật khẩu mới</label>
                    <div className="relative">
                      <input 
                        type={showNewPassword ? "text" : "password"} 
                        required
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 pr-12 text-white font-bold focus:ring-2 focus:ring-rose-500/20 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                      >
                        {showNewPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Xác nhận lại</label>
                    <div className="relative">
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        required
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 pr-12 text-white font-bold focus:ring-2 focus:ring-rose-500/20 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                      >
                        {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={saving}
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest cursor-pointer transition-all shadow-xl shadow-rose-500/20 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="animate-spin" size={16} /> : (success ? <CheckCircle size={16} /> : <Lock size={16} />)}
                  {success ? 'Đã đổi mật khẩu' : 'Cập nhật mật khẩu'}
                </button>
              </form>
            )}
            
            <p className="mt-8 text-center text-slate-600 text-[10px] font-bold uppercase tracking-widest px-10 leading-relaxed">
              TimPhongTro bảo vệ quyền riêng tư của bạn. Toàn bộ thông tin đều được mã hóa an toàn.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SettingsModal;
