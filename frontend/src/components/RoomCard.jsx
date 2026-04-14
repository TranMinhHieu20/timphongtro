import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Zap, Star, Heart, Scale } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const RoomCard = ({ room, onCompareToggle, isSelected }) => {
  const { user, isAuthenticated } = useAuth();
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
    
    setLoadingFav(true);
    try {
      const res = await userService.toggleFavorite(room._id);
      setIsFavorite(res.data.favorites.includes(room._id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFav(false);
    }
  };

  // Format price: 3500000 -> 3.5tr
  const formatPrice = (price) => {
    return (price / 1000000).toFixed(1) + 'tr';
  };

  // Format currency: 315000 -> 315.000₫
  const formatCurrency = (val) => {
    return val?.toLocaleString('vi-VN') + '₫';
  };

  return (
    <Link to={`/room/${room._id}`} className="block group">
      <div className="bg-slate-900 border border-white/5 rounded-[2rem] overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:border-rose-500/30">
        <div className="relative aspect-[4/5] overflow-hidden">
          <img 
            src={room.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop'} 
            alt={room.address}
            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${room.status === 'rented' ? 'grayscale opacity-50' : ''}`} 
          />
          {room.status === 'rented' && (
            <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center p-4">
              <span className="bg-slate-950/80 text-rose-500 text-[10px] font-black px-4 py-2 rounded-full border border-rose-500/30 uppercase tracking-[0.2em] shadow-2xl backdrop-blur-md">
                HẾT PHÒNG
              </span>
            </div>
          )}
          <div className="absolute top-5 left-5 flex flex-col gap-2">
            <span className="bg-rose-500 text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg shadow-rose-500/20 backdrop-blur-sm">
              Tiềm năng
            </span>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onCompareToggle(room);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border transition-all cursor-pointer ${isSelected ? 'bg-emerald-500 border-emerald-400 shadow-xl' : 'bg-slate-950/40 border-white/10 hover:bg-white/10'}`}
            >
              <Scale size={12} className={isSelected ? 'text-white' : 'text-slate-400'} />
              <span className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                {isSelected ? 'Đang so sánh' : 'So sánh'}
              </span>
            </button>
          </div>
          <div className="absolute top-5 right-5 flex flex-col items-end gap-2">
             <button 
              onClick={toggleFav}
              className={`p-2.5 rounded-full backdrop-blur-md border transition-all cursor-pointer ${isFavorite ? 'bg-rose-500 border-rose-400 shadow-lg shadow-rose-500/40' : 'bg-slate-950/40 border-white/10 hover:bg-white/10'}`}
             >
               <motion.div
                 animate={{ scale: isFavorite ? [1, 1.4, 1] : 1 }}
                 transition={{ duration: 0.3 }}
               >
                <Heart size={18} fill={isFavorite ? "white" : "none"} className={isFavorite ? "text-white" : "text-slate-400"} />
               </motion.div>
             </button>
             <span className="bg-slate-950/60 backdrop-blur-md text-white text-[9px] font-mono px-3 py-1.5 rounded-full border border-white/10 tracking-[0.1em] cursor-default">
              {room.code.toUpperCase()}{room.roomNumber ? ` - ${room.roomNumber.toUpperCase()}` : ''}
            </span>
            {room.availability && (
              <span className="bg-amber-500 text-slate-950 text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-wider shadow-lg">
                {room.availability}
              </span>
            )}
          </div>
          
          {/* Cashback Badge */}
          <div className="absolute bottom-5 left-5 right-5">
            <div className="bg-emerald-500/80 backdrop-blur-md p-4 rounded-2xl border border-emerald-400/50 shadow-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl">
                  <Zap size={16} className="text-white" fill="white" />
                </div>
                <div className="space-y-0.5">
                   <p className="text-white text-[9px] font-black uppercase tracking-widest leading-none">Hoàn tiền 9%</p>
                   <p className="text-white/70 text-[8px] font-medium leading-none">Ký HĐ nhận ngay</p>
                </div>
              </div>
              <span className="text-white font-black text-xl tracking-tight">{formatCurrency(room.cashbackAmount)}</span>
            </div>
          </div>
        </div>

        <div className="p-7 space-y-4">
          <div className="flex items-center gap-2 text-rose-500/80">
            <MapPin size={14} className="shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-widest truncate">{room.address}</span>
          </div>
          
          <h3 className="text-xl font-black text-white leading-[1.3] group-hover:text-rose-500 transition-colors truncate">
            {room.description?.split('\n')[0] || 'Phòng trọ cao cấp HN'}
          </h3>

          <div className="flex items-center justify-between pt-5 border-t border-white/5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white ">{formatPrice(room.price)}</span>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">/ Tháng</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/10">
              <Star size={12} fill="#fbbf24" className="text-amber-400" />
              <span className="text-[11px] font-black text-amber-500">4.9</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default RoomCard;
