import React, { useState, useEffect } from 'react';
import RoomCard from '../components/RoomCard';
import { roomService } from '../services/api';
import { Sparkles, ArrowRight, Scale, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const HomePage = () => {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [compareRooms, setCompareRooms] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  
  const [filters, setFilters] = useState({
    district: '',
    priceRange: [0, 20000000],
    amenities: []
  });

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await roomService.getAll();
        setRooms(res.data);
        setFilteredRooms(res.data);
      } catch (error) {
        console.error("Error fetching rooms:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  useEffect(() => {
    let result = rooms;

    if (filters.district) {
      result = result.filter(r => r.address.toLowerCase().includes(filters.district.toLowerCase()));
    }

    result = result.filter(r => r.price >= filters.priceRange[0] && r.price <= filters.priceRange[1]);

    if (filters.amenities.length > 0) {
      result = result.filter(r => 
        filters.amenities.every(a => r.amenities.some(roomA => roomA.toLowerCase().includes(a.toLowerCase())))
      );
    }

    setFilteredRooms(result);
  }, [filters, rooms]);

  const districts = ["Cầu Giấy", "Đống Đa", "Thanh Xuân", "Hai Bà Trưng", "Hoàn Kiếm", "Ba Đình", "Nam Từ Liêm", "Bắc Từ Liêm"];
  const commonAmenities = ["Điều hòa", "Nóng lạnh", "Máy giặt", "Tủ lạnh", "Ban công", "Thang máy", "Khép kín"];

  const toggleCompareRoom = (room) => {
    setCompareRooms(prev => {
      if (prev.find(r => r._id === room._id)) {
        return prev.filter(r => r._id !== room._id);
      }
      if (prev.length >= 3) {
        alert("Bạn chỉ có thể so sánh tối đa 3 phòng cùng lúc.");
        return prev;
      }
      return [...prev, room];
    });
  };

  return (
    <div className="space-y-24 md:space-y-32">
      {/* Hero Section - Refined for strict alignment */}
      <section className="relative overflow-hidden group">
        <div className="absolute inset-0 bg-slate-900/40 border border-white/5 rounded-[2.5rem] md:rounded-[3rem]"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3"></div>
        
        <div className="relative z-10 py-12 md:py-20 lg:py-24 px-6 md:px-12 lg:px-16 space-y-8">
          <div className="inline-flex items-center gap-2.5 bg-rose-500/10 border border-rose-500/20 px-4 py-1.5 rounded-full text-rose-400 text-[10px] font-black tracking-[0.2em] uppercase">
            <Sparkles size={14} className="animate-pulse" />
            Nền tảng affiliate phòng trọ Hà Nội
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black leading-[1.1] text-white tracking-tight">
            Thuê phòng, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-400">Hoàn ngay 9% tiền</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-xl font-medium">
            Hỗ trợ tìm kiếm hàng trăm phòng trọ chất lượng. Nhận tiền mặt hoàn lại ngay khi ký kết hợp đồng thành công.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <button className="bg-rose-500 hover:bg-rose-600 active:scale-95 text-white px-8 py-4 rounded-full font-black transition-all shadow-xl shadow-rose-500/25 flex items-center gap-3 cursor-pointer">
              Khám phá ngay <ArrowRight size={20} />
            </button>
            <button className="bg-white/5 hover:bg-white/10 active:scale-95 text-white px-8 py-4 rounded-full font-black border border-white/10 transition-all backdrop-blur-sm cursor-pointer">
              Xem ưu đãi
            </button>
          </div>
        </div>
      </section>

      {/* Advanced Filter Bar */}
      <section className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 md:p-10 space-y-8 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-6 bg-rose-500 rounded-full"></div>
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">Bộ lọc tìm kiếm nâng cao</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* District Filter */}
          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Khu vực / Quận</label>
             <select 
              value={filters.district}
              onChange={(e) => setFilters({...filters, district: e.target.value})}
              className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white font-bold appearance-none cursor-pointer focus:ring-2 focus:ring-rose-500/20"
             >
               <option value="">Tất cả Hà Nội</option>
               {districts.map(d => <option key={d} value={d}>{d}</option>)}
             </select>
          </div>

          {/* Price Filter */}
          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Khoảng giá hiện tại</label>
             <div className="flex items-center gap-3">
               <button 
                onClick={() => setFilters({...filters, priceRange: [0, 3000000]})}
                className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase transition-all cursor-pointer ${filters.priceRange[1] === 3000000 ? 'bg-rose-500 border-rose-400 text-white' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
               >
                 Dưới 3tr
               </button>
               <button 
                onClick={() => setFilters({...filters, priceRange: [3000000, 5000000]})}
                className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase transition-all cursor-pointer ${filters.priceRange[0] === 3000000 ? 'bg-rose-500 border-rose-400 text-white' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
               >
                 3tr - 5tr
               </button>
               <button 
                onClick={() => setFilters({...filters, priceRange: [5000000, 20000000]})}
                className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase transition-all cursor-pointer ${filters.priceRange[0] === 5000000 ? 'bg-rose-500 border-rose-400 text-white' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
               >
                 Trên 5tr
               </button>
             </div>
          </div>

          {/* Reset button */}
          <div className="flex items-end">
            <button 
              onClick={() => setFilters({ district: '', priceRange: [0, 20000000], amenities: [] })}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl transition-all cursor-pointer text-xs uppercase tracking-widest"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        </div>

        {/* Amenities Chips */}
        <div className="space-y-3 pt-4 border-t border-white/5">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Tiện ích ưu tiên</label>
          <div className="flex flex-wrap gap-2">
            {commonAmenities.map(a => (
              <button
                key={a}
                onClick={() => {
                  const newA = filters.amenities.includes(a) 
                    ? filters.amenities.filter(item => item !== a)
                    : [...filters.amenities, a];
                  setFilters({...filters, amenities: newA});
                }}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase transition-all cursor-pointer border ${filters.amenities.includes(a) ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'}`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Room Grid Section */}
      <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">Phòng mới nhất</h2>
            <p className="text-slate-500 font-medium">Tìm thấy <span className="text-rose-400 font-bold">{rooms.length}</span> lựa chọn đang trống</p>
          </div>
          <div className="flex gap-2 p-1.5 bg-white/5 border border-white/5 rounded-2xl backdrop-blur-sm">
             <button className="bg-rose-500 text-white px-6 py-2 rounded-xl text-xs font-bold shadow-lg shadow-rose-500/20">Mới nhất</button>
             <button className="hover:bg-white/5 text-slate-400 px-6 py-2 rounded-xl text-xs font-bold transition-all">Gần bạn nhất</button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-slate-900/50 rounded-[2rem] aspect-[4/5] animate-pulse border border-white/5"></div>
            ))}
          </div>
        ) : filteredRooms.length > 0 ? (
          <motion.div 
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10"
          >
            {filteredRooms.map(room => (
              <motion.div
                key={room._id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 }
                }}
              >
                <RoomCard 
                  room={room} 
                  onCompareToggle={toggleCompareRoom}
                  isSelected={compareRooms.some(r => r._id === room._id)}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-32 rounded-[2rem] bg-slate-900/10 border border-white/5 border-dashed">
            <p className="text-slate-500 font-medium text-lg">Không tìm thấy phòng nào khớp với tiêu chuẩn của bạn.</p>
          </div>
        )}
      </div>

      {/* Sticky Comparison Bar */}
      <AnimatePresence>
        {compareRooms.length > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-2xl bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-full p-3 shadow-3xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3 pl-4">
              <div className="flex -space-x-3">
                {compareRooms.map(room => (
                  <div key={room._id} className="w-10 h-10 rounded-full border-2 border-slate-900 overflow-hidden shadow-lg">
                    <img src={room.images?.[0]} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <p className="text-xs font-black text-white uppercase tracking-widest hidden sm:block">
                Đang chọn {compareRooms.length}/3 phòng
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setCompareRooms([])}
                className="p-3 text-slate-500 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
              <button 
                onClick={() => setShowCompareModal(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <Scale size={16} />
                So sánh ngay
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison Modal */}
      <AnimatePresence>
        {showCompareModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-slate-900 w-full max-w-5xl max-h-[90vh] rounded-[3rem] border border-white/10 overflow-hidden flex flex-col shadow-3xl"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Bảng so sánh chi tiết</h3>
                <button onClick={() => setShowCompareModal(false)} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors cursor-pointer text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-auto p-8">
                <div className="grid grid-cols-4 gap-8 min-w-[800px]">
                  {/* Row: Icons / Labels */}
                  <div className="space-y-12 pt-48">
                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] h-12 flex items-center">Giá thuê</div>
                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] h-12 flex items-center">Hoàn tiền</div>
                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] h-12 flex items-center">Khu vực</div>
                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Tiện ích</div>
                  </div>

                  {compareRooms.map(room => (
                    <div key={room._id} className="space-y-12">
                      {/* Image & Address */}
                      <div className="space-y-4">
                        <div className="aspect-[4/5] rounded-3xl overflow-hidden border border-white/10 group relative">
                          <img src={room.images?.[0]} className="w-full h-full object-cover" />
                        </div>
                        <p className="text-sm font-black text-white line-clamp-2 h-10">{room.address}</p>
                      </div>

                      {/* Values */}
                      <div className="text-2xl font-black text-white h-12 flex items-center">{(room.price / 1000000).toFixed(1)}tr</div>
                      <div className="text-xl font-black text-emerald-400 h-12 flex items-center">{room.cashbackAmount?.toLocaleString()}₫</div>
                      <div className="text-sm font-bold text-slate-400 h-12 flex items-center">{districts.find(d => room.address.includes(d)) || "Hà Nội"}</div>
                      
                      {/* Amenities List */}
                      <div className="space-y-2">
                        {commonAmenities.map(a => {
                          const hasit = room.amenities?.some(roomA => roomA.toLowerCase().includes(a.toLowerCase()));
                          return (
                            <div key={a} className={`flex items-center gap-2 text-[10px] font-bold uppercase transition-colors ${hasit ? 'text-emerald-400' : 'text-slate-600 opacity-30'}`}>
                              {hasit ? <Check size={12} /> : <X size={12} />}
                              {a}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-8 bg-slate-800/50 border-t border-white/5 flex justify-end">
                <button 
                  onClick={() => setShowCompareModal(false)}
                  className="bg-rose-500 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-rose-500/20 cursor-pointer active:scale-95 transition-all"
                >
                  Xong rồi
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomePage;
