import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Zap, Heart, Scale, BadgeCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api';
import { motion } from 'framer-motion';

const RoomCard = ({ room, onCompareToggle, isSelected, onFavoriteToggle }) => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loadingFav, setLoadingFav] = useState(false);

  useEffect(() => {
    if (user?.favorites) {
      setIsFavorite(user.favorites.includes(room._id));
    }
  }, [user, room._id]);

  const toggleFav = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return alert("Vui lòng đăng nhập để lưu phòng!");
    
    // Phản hồi tức thì trên UI
    const previousState = isFavorite;
    setIsFavorite(!previousState);

    try {
      await userService.toggleFavorite(room._id);
      if (onFavoriteToggle) onFavoriteToggle();
      // Backend handles toggle, we already updated UI
    } catch (err) {
      console.error(err);
      setIsFavorite(previousState); // Hoàn tác nếu lỗi
    }
  };

  // Format: 4300000 → "4.3tr"
  const formatPrice = (price) => {
    const millions = price / 1_000_000;
    return millions % 1 === 0 ? `${millions}tr` : `${millions.toFixed(1)}tr`;
  };

  // Format: 387000 → "387.000₫"
  const formatCurrency = (val) => val?.toLocaleString('vi-VN') + '₫';

  // Availability color
  const availColor = room.availability?.toLowerCase().includes('trống')
    ? 'bg-emerald-400 text-slate-900'
    : 'bg-amber-400 text-slate-900';

  return (
    <Link to={`/room/${room._id}`} className="block group">
      <div className="bg-slate-900 border border-white/5 rounded-[2rem] overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:border-rose-500/30">

        {/* ── Image Section ─────────────────────────────────────────────────── */}
        <div className="relative aspect-[4/5] overflow-hidden">
          <img
            src={room.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop'}
            alt={room.address}
            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${room.status === 'rented' ? 'grayscale opacity-50' : ''}`}
          />

          {/* Rented overlay */}
          {room.status === 'rented' && (
            <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center p-4">
              <span className="bg-slate-950/80 text-rose-500 text-[10px] font-black px-4 py-2 rounded-full border border-rose-500/30 uppercase tracking-[0.2em] shadow-2xl backdrop-blur-md">
                HẾT PHÒNG
              </span>
            </div>
          )}

          {/* Top-left: Compare button */}
          <div className="absolute top-5 left-5 flex flex-col gap-2">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCompareToggle(room); }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border transition-all cursor-pointer ${isSelected ? 'bg-emerald-500 border-emerald-400 shadow-xl' : 'bg-slate-950/40 border-white/10 hover:bg-white/10'}`}
            >
              <Scale size={12} className={isSelected ? 'text-white' : 'text-slate-400'} />
              <span className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                {isSelected ? 'Đang so sánh' : 'So sánh'}
              </span>
            </button>
          </div>

          {/* Top-right: Favorite + ID badges */}
          <div className="absolute top-5 right-5 flex flex-col items-end gap-2">
            {/* Favorite */}
            <button
              onClick={toggleFav}
              className={`p-3 rounded-full backdrop-blur-xl border-2 transition-all duration-300 cursor-pointer ${isFavorite 
                ? 'bg-rose-500 border-white shadow-xl shadow-rose-500/50 scale-110' 
                : 'bg-slate-950/40 border-white/10 hover:bg-white/10 hover:border-white/30'}`}
            >
              <motion.div 
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.8 }}
                animate={{ scale: isFavorite ? [1, 1.4, 1] : 1 }} 
                transition={{ duration: 0.3 }}
              >
                <Heart 
                  size={20} 
                  fill={isFavorite ? "white" : "none"} 
                  className={isFavorite ? "text-white" : "text-white/70"}
                  strokeWidth={isFavorite ? 3 : 2}
                />
              </motion.div>
            </button>

            {/* Public display ID (user & admin) */}
            {room.displayId && (
              <span className="bg-rose-500/90 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg tracking-widest uppercase">
                #{room.displayId}
              </span>
            )}

            {/* Real code — admin only */}
            {isAdmin && (
              <span className="bg-slate-950/70 backdrop-blur-md text-slate-400 text-[9px] font-mono px-2.5 py-1 rounded-full border border-white/10 tracking-[0.1em]" title="Mã nội bộ (chỉ admin)">
                {room.code?.toUpperCase()}{room.roomNumber ? ` · ${room.roomNumber.toUpperCase()}` : ''}
              </span>
            )}

            {/* Availability badge */}
            {room.availability && (
              <span className={`text-[8px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider shadow-lg ${availColor}`}>
                {room.availability}
              </span>
            )}
          </div>

          {/* Cashback badge */}
          {room.cashbackAmount > 0 && (
            <div className="absolute bottom-5 left-5 right-5">
              <div className="bg-emerald-500/80 backdrop-blur-md p-4 rounded-2xl border border-emerald-400/50 shadow-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl">
                    <Zap size={16} className="text-white" fill="white" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-white text-[9px] font-black uppercase tracking-widest leading-none">TIỀN HOÀN TRẢ</p>
                    <p className="text-white/70 text-[8px] font-medium leading-none">Nhận ngay khi ký HĐ</p>
                  </div>
                </div>
                <span className="text-white font-black text-xl tracking-tight">{formatCurrency(room.cashbackAmount)}</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Info Section ──────────────────────────────────────────────────── */}
        <div className="p-7 space-y-4">
          {/* Address */}
          <div className="flex items-center gap-2 text-rose-500/80">
            <MapPin size={14} className="shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-widest truncate">{room.address}</span>
          </div>

          {/* Description preview — first meaningful line */}
          <h3 className="text-xl font-black text-white leading-[1.3] group-hover:text-rose-400 transition-colors line-clamp-2">
            {room.description?.split('\n').find(l => l.trim()) || (room.roomNumber ? `Phòng ${room.roomNumber}` : 'Phòng trọ cao cấp')}
          </h3>

          {/* Price + room number */}
          <div className="flex items-center justify-between pt-5 border-t border-white/5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white">{formatPrice(room.price)}</span>
              {room.roomNumber && (
                <span className="text-xs text-slate-500 font-bold">· {room.roomNumber}</span>
              )}
              <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">/ Tháng</span>
            </div>

          </div>
        </div>
      </div>
    </Link>
  );
};

export default RoomCard;
