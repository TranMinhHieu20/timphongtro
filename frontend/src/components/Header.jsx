import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Home, User, LogOut, ShieldCheck, Bell, ChevronDown, Settings, Menu, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { leadService } from '../services/api';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Header = ({ onMenuClick, onOpenSettings }) => {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Đảm bảo menu luôn đóng khi chuyển trạng thái đăng nhập
  useEffect(() => {
    setShowDropdown(false);
  }, [isAuthenticated]);

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-[44px] z-50 bg-slate-900/60 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 flex h-20 items-center justify-between gap-8">
        
        {/* Left: Logo - Hidden on PC for Admin because it's in Sidebar */}
        {!isAdmin && (
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <div className="bg-rose-500 p-2.5 rounded-2xl group-hover:rotate-12 transition-transform duration-300">
              <Home className="text-white" size={24} />
            </div>
            <span className="text-2xl font-black tracking-tighter text-white hidden sm:block">
              TimPhong<span className="text-rose-500">Tro</span>
            </span>
          </Link>
        )}

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-2xl hidden md:block">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-rose-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Bạn muốn tìm phòng ở đâu?" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyUp={handleSearchSubmit}
              className="w-full bg-slate-800/40 border border-white/5 rounded-2xl py-3.5 pl-14 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all placeholder:text-slate-600 text-slate-200"
            />
          </div>
        </div>

        {/* Right: Profile & Actions */}
        <div className="flex items-center gap-4 lg:gap-6">
          {isAuthenticated && (
            <Link 
              to="/favorites" 
              className="p-3 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all relative group cursor-pointer"
              title="Phòng đã lưu"
            >
              <Heart size={22} className="group-hover:scale-110 transition-transform" />
            </Link>
          )}

          {isAuthenticated ? (
            <div className="relative">
              {/* ... Profile Button ... */}
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-4 bg-white/5 pl-2 pr-5 py-2 rounded-full border border-white/5 hover:border-white/10 transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center text-sm font-black text-white shadow-xl shadow-rose-500/20 group-hover:scale-105 transition-transform">
                  {user?.username?.[0].toUpperCase()}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-black text-white leading-none">{user?.username}</div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                    {isAdmin ? 'Quản trị viên' : 'Hội viên Pro'}
                  </div>
                </div>
                <ChevronDown size={14} className={`text-slate-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showDropdown && (
                  <>
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowDropdown(false)}
                    />
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-4 w-64 bg-slate-900 border border-white/10 rounded-3xl shadow-3xl z-50 overflow-hidden"
                    >
                        <div className="p-6 bg-slate-800/50 border-b border-white/5">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tài khoản quản lý</p>
                            <p className="text-sm font-black text-white mt-1 truncate">{user?.email}</p>
                        </div>
                        <div className="p-3">
                            <Link 
                                to="/favorites"
                                onClick={() => setShowDropdown(false)}
                                className="w-full flex items-center gap-3 p-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-2xl transition-all cursor-pointer"
                            >
                                <Heart size={18} className="text-rose-500" />
                                <span>Phòng đã thả tim</span>
                            </Link>
                            <button 
                                onClick={() => { setShowDropdown(false); onOpenSettings(); }}
                                className="w-full flex items-center gap-3 p-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-2xl transition-all cursor-pointer"
                            >
                                <Settings size={18} className="text-slate-500" />
                                <span>Cài đặt tài khoản</span>
                            </button>
                            <button 
                                onClick={logout}
                                className="w-full flex items-center gap-3 p-3 text-sm text-rose-400 hover:text-rose-500 hover:bg-rose-500/5 rounded-2xl transition-all cursor-pointer"
                            >
                                <LogOut size={18} />
                                <span>Đăng xuất</span>
                            </button>
                        </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link to="/login" className="flex items-center gap-2 bg-rose-500 text-white px-8 py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/20 active:scale-95 cursor-pointer">
              <User size={18} />
              <span>Đăng nhập</span>
            </Link>
          )}

          {/* Admin Burger Menu Toggle (Mobile Only) */}
          {isAdmin && (
            <button 
              onClick={onMenuClick}
              className="lg:hidden p-3 bg-white/5 text-slate-400 hover:text-white rounded-2xl border border-white/5 transition-all cursor-pointer"
            >
              <Menu size={24} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
