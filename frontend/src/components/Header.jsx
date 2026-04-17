import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Home, User, LogOut, Settings, Menu, Heart, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Header = ({ onMenuClick, onOpenSettings }) => {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Animated Placeholder Logic
  const placeholders = [
    "Bạn muốn tìm phòng ở đâu?",
    "Tìm căn hộ, trọ giá rẻ...",
    "Phòng trọ gần đại học...",
    "Ban công, cửa sổ thoáng..."
  ];
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Đảm bảo menu luôn đóng khi chuyển trạng thái đăng nhập
  useEffect(() => {
    setShowDropdown(false);
  }, [isAuthenticated]);

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowMobileSearch(false);
    }
  };

  return (
    <header className="sticky top-[44px] z-50 bg-slate-900/70 backdrop-blur-xl border-b border-white/5 flex flex-col shadow-lg shadow-slate-900/50">
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-12 flex h-20 items-center justify-between gap-4 sm:gap-8">
        
        {/* Left: Logo */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <Link to="/" className={`flex items-center gap-2 sm:gap-3 group ${isAdmin ? 'lg:hidden' : ''}`}>
            <motion.div 
               whileHover={{ scale: 1.1, rotate: 5 }}
               whileTap={{ scale: 0.9 }}
               className="relative overflow-hidden bg-gradient-to-br from-rose-500 to-orange-500 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl shadow-xl shadow-rose-500/20"
            >
              <motion.div 
                className="absolute inset-0 bg-white/30 skew-x-12"
                initial={{ x: '-150%' }}
                animate={{ x: '150%' }}
                transition={{ repeat: Infinity, duration: 1.5, repeatDelay: 3, ease: 'easeInOut' }}
              />
              <Home className="text-white w-5 h-5 sm:w-6 sm:h-6 relative z-10" />
            </motion.div>
            <span className="text-xl sm:text-2xl font-black tracking-tighter text-white hidden sm:block">
              TimPhong<span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-500">Online</span>
            </span>
          </Link>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-2xl hidden md:block">
          <div className="relative group">
            {/* Glowing background */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500 to-orange-500 rounded-[1.25rem] opacity-0 group-hover:opacity-20 group-focus-within:opacity-40 blur-md transition-all duration-500"></div>
            
            <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-rose-500 transition-colors z-10" size={18} />
                <AnimatePresence mode="popLayout">
                   {!searchQuery && (
                      <motion.span 
                        key={placeholderIdx}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute left-14 top-1/2 -translate-y-1/2 text-sm text-slate-500 pointer-events-none select-none z-10"
                      >
                         {placeholders[placeholderIdx]}
                      </motion.span>
                   )}
                </AnimatePresence>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyUp={handleSearchSubmit}
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl py-3.5 pl-14 pr-16 text-sm focus:outline-none focus:ring-1 focus:ring-rose-500/50 transition-all text-white relative z-0 shadow-inner block"
                />
                
                {/* Enter shortcut hint */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/5 border border-white/10 text-slate-400 text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity z-10 shadow-sm pointer-events-none">
                   Enter ↵
                </div>
            </div>
          </div>
        </div>

        {/* Right: Profile & Actions */}
        <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 shrink-0">
          {/* Mobile Search Toggle */}
          <button 
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="md:hidden p-2 sm:p-3 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 cursor-pointer relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Search size={20} className="relative z-10 group-hover:scale-110 transition-transform" />
          </button>

          {isAuthenticated && (
            <Link 
              to="/favorites" 
              className="p-2 sm:p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all relative group cursor-pointer border border-transparent hover:border-rose-500/20"
              title="Phòng đã lưu"
            >
              <Heart size={22} className="group-hover:scale-110 group-hover:fill-rose-500/20 transition-all" />
            </Link>
          )}

          {isAuthenticated ? (
            <div className="relative">
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-3 sm:gap-4 bg-white/5 pl-2 pr-4 sm:pr-5 py-2 rounded-full border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-sm font-black text-white shadow-xl shadow-rose-500/20 group-hover:rotate-12 transition-transform">
                  {user?.username?.[0].toUpperCase()}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-black text-white leading-none">{user?.username}</div>
                  <div className="text-[10px] font-bold fill-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 uppercase tracking-widest mt-1">
                    {isAdmin ? 'Quản trị viên' : 'Hội viên Pro'}
                  </div>
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform hidden sm:block ${showDropdown ? 'rotate-180 text-white' : ''}`} />
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
                        className="absolute right-0 mt-4 w-64 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl z-50 overflow-hidden"
                    >
                        <div className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 border-b border-white/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-3xl rounded-full translate-x-10 -translate-y-10 pointer-events-none"></div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest relative z-10">Tài khoản quản lý</p>
                            <p className="text-sm font-black text-white mt-1 truncate relative z-10">{user?.email}</p>
                        </div>
                        <div className="p-3">
                            <Link 
                                to="/favorites"
                                onClick={() => setShowDropdown(false)}
                                className="w-full flex items-center gap-3 p-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-2xl transition-all cursor-pointer group"
                            >
                                <Heart size={18} className="text-rose-500 group-hover:scale-110 transition-transform" />
                                <span>Phòng đã thả tim</span>
                            </Link>
                            <button 
                                onClick={() => { setShowDropdown(false); onOpenSettings(); }}
                                className="w-full flex items-center gap-3 p-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-2xl transition-all cursor-pointer group"
                            >
                                <Settings size={18} className="text-slate-500 group-hover:rotate-45 transition-transform" />
                                <span>Cài đặt tài khoản</span>
                            </button>
                            <button 
                                onClick={logout}
                                className="w-full flex items-center gap-3 p-3 text-sm text-rose-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all cursor-pointer"
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
            <Link to="/login" className="flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-rose-500 to-orange-500 text-white px-5 sm:px-8 py-3 rounded-2xl text-[10px] sm:text-sm font-black uppercase tracking-widest hover:shadow-xl hover:shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
              <User size={16} className="sm:w-[18px] sm:h-[18px] relative z-10" />
              <span className="hidden sm:inline relative z-10">Đăng nhập</span>
              <span className="sm:hidden relative z-10">Login</span>
            </Link>
          )}

          {/* Admin Burger Menu Toggle (Mobile Only) */}
          {isAdmin && (
            <button 
              onClick={onMenuClick}
              className="lg:hidden p-2 sm:p-2.5 bg-white/5 text-slate-400 hover:text-white rounded-xl border border-white/5 transition-all cursor-pointer"
            >
              <Menu size={20} className="sm:w-6 sm:h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Search Bar Expandable */}
      <AnimatePresence>
        {showMobileSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden px-4 pb-4 w-full overflow-hidden"
          >
            <div className="relative group w-full">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-rose-500 transition-colors z-10" size={18} />
                <AnimatePresence mode="popLayout">
                   {!searchQuery && (
                      <motion.span 
                        key={placeholderIdx}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute left-14 top-1/2 -translate-y-1/2 text-sm text-slate-500 pointer-events-none select-none z-10 max-w-[80%] truncate"
                      >
                         {placeholders[placeholderIdx]}
                      </motion.span>
                   )}
                </AnimatePresence>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyUp={handleSearchSubmit}
                  className="w-full bg-slate-800/60 border border-white/10 rounded-2xl py-3 pl-14 pr-6 text-sm focus:outline-none focus:ring-1 focus:ring-rose-500/50 transition-all text-white z-0 relative shadow-inner"
                />
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
