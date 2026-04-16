import React, { useState, useEffect } from 'react';
import { roomService, userService } from '../services/api';
import RoomCard from '../components/RoomCard';
import { Heart, Loader2, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const FavoritesPage = () => {
  const [favoriteRooms, setFavoriteRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const res = await userService.getFavorites();
      setFavoriteRooms(res.data);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-6">
        <Loader2 className="animate-spin text-rose-500" size={40} />
        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-sm italic">Đang tìm lại các phòng bạn đã yêu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-rose-500">
            <Heart size={24} fill="currentColor" />
            <span className="text-xs font-black uppercase tracking-[0.3em]">Danh sách của bạn</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none">
            Phòng đã <span className="text-rose-500">Thả tim</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-md">Lưu trữ tất cả những căn phòng bạn quan tâm để dễ dàng so sánh và đưa ra quyết định cuối cùng.</p>
        </div>
        
        <div className="bg-slate-900 px-6 py-4 rounded-3xl border border-white/5 flex items-center gap-4">
            <div className="text-right">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Tổng cộng</p>
                <p className="text-xl font-black text-white leading-none">{favoriteRooms.length} Phòng</p>
            </div>
            <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 border border-rose-500/20">
                <Heart size={20} fill="currentColor" />
            </div>
        </div>
      </div>

      {/* Grid Section */}
      {favoriteRooms.length === 0 ? (
        <div className="bg-slate-900/50 rounded-[3rem] border border-white/5 py-32 flex flex-col items-center justify-center text-center gap-8">
            <div className="w-24 h-24 bg-slate-950 rounded-full flex items-center justify-center border border-white/5 text-slate-700">
                <Heart size={40} />
            </div>
            <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-300">Bạn chưa thả tim phòng nào</h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto font-medium">Hãy dạo quanh trang chủ và lưu lại những căn phòng bạn ưng ý nhé!</p>
            </div>
            <Link to="/" className="bg-rose-500 hover:bg-rose-600 text-white font-black px-8 py-4 rounded-2xl transition-all shadow-xl shadow-rose-500/20 flex items-center gap-3 active:scale-95">
                <Home size={18} />
                Quay về trang chủ
            </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          <AnimatePresence>
            {favoriteRooms.map((room) => (
              <motion.div
                key={room._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <RoomCard 
                  room={room} 
                  onCompareToggle={() => {}} 
                  isSelected={false}
                  onFavoriteToggle={() => {
                    // Cập nhật local state để phòng biến mất ngay lập tức
                    setFavoriteRooms(prev => prev.filter(r => r._id !== room._id));
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
