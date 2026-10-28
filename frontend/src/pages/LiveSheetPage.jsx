import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Radio, MapPin, Clock, Search } from 'lucide-react';
import { sheetService } from '../services/sheetService';

const LiveSheetPage = () => {
  const [rooms, setRooms] = useState([]);
  const roomsRef = useRef([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [search, setSearch] = useState('');
  const [highlightedIds, setHighlightedIds] = useState(new Set());
  
  const fetchLiveRooms = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setErrorMsg('');
    try {
      const liveData = await sheetService.getLiveRooms();
      const currentRooms = roomsRef.current;
      
      // Compare and find newly updated rooms to highlight
      if (currentRooms.length > 0) {
        const newHighlights = new Set();
        liveData.forEach(newRoom => {
          const oldRoom = currentRooms.find(r => r.roomId === newRoom.roomId);
          if (oldRoom && oldRoom.updatedAt !== newRoom.updatedAt) {
            newHighlights.add(newRoom.roomId);
          } else if (!oldRoom) {
            newHighlights.add(newRoom.roomId); // Also highlight completely new rooms
          }
        });
        
        if (newHighlights.size > 0) {
          setHighlightedIds(prev => {
            const next = new Set(prev);
            newHighlights.forEach(id => next.add(id));
            return next;
          });
          
          // Remove highlights after 10 seconds
          setTimeout(() => {
            setHighlightedIds(prev => {
              const next = new Set(prev);
              newHighlights.forEach(id => next.delete(id));
              return next;
            });
          }, 10000);
        }
      }
      
      roomsRef.current = liveData;
      setRooms(liveData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load live data', error);
      setErrorMsg(error.message || JSON.stringify(error));
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchLiveRooms();
    
    // Set up auto-refresh interval (every 30 seconds)
    const interval = setInterval(() => {
      fetchLiveRooms(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const filteredRooms = rooms.filter(room => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      (room.address && room.address.toLowerCase().includes(term)) ||
      (room.district && room.district.toLowerCase().includes(term)) ||
      (room.roomId && room.roomId.toString().includes(term))
    );
  });

  return (
    <div className="space-y-12 pb-24 min-h-screen">
      {/* Header Section */}
      <section className="relative">
        <div className="absolute inset-0 bg-rose-500/10 blur-[100px] rounded-[4rem] pointer-events-none"></div>
        
        <div className="relative bg-slate-900/60 backdrop-blur-2xl border border-white/10 p-8 md:p-12 rounded-[3rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 px-4 py-2 rounded-full text-rose-500 text-xs font-black tracking-widest uppercase">
              <Radio size={14} className="animate-pulse" /> Live Board
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
              Bảng Phòng <span className="text-rose-500">Trực Tiếp</span>
            </h1>
            <p className="text-slate-400 font-medium flex items-center gap-2 justify-center md:justify-start">
              <Clock size={16} /> 
              Cập nhật lúc: {lastUpdated.toLocaleTimeString('vi-VN')} 
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-md uppercase tracking-widest ml-2 animate-pulse">Auto-refresh: 30s</span>
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-500" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm khu vực, mã phòng..."
                className="w-full bg-slate-950 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50 transition-colors"
              />
            </div>
            
            <button 
              onClick={() => fetchLiveRooms(false)}
              className="bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 transition-all group active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <RefreshCw size={18} className={loading ? "animate-spin text-rose-500" : "group-hover:rotate-180 transition-transform duration-500"} />
              <span className="uppercase text-xs tracking-widest font-black">Làm mới</span>
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng số phòng', value: rooms.length, color: 'text-white' },
          { label: 'Đang trống', value: rooms.filter(r => r.status?.toLowerCase().includes('trống')).length, color: 'text-emerald-500' },
          { label: 'Sắp trống', value: rooms.filter(r => r.status?.toLowerCase().includes('sắp')).length, color: 'text-amber-500' },
          { label: 'Đã cọc', value: rooms.filter(r => r.status?.toLowerCase().includes('cọc')).length, color: 'text-blue-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 text-center space-y-2">
            <div className={`text-3xl md:text-4xl font-black ${stat.color}`}>{loading ? '-' : stat.value}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Grid of Live Rooms */}
      {loading && rooms.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-slate-900/50 rounded-3xl h-64 animate-pulse border border-white/5"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredRooms.map((room) => {
              const isTrống = room.status?.toLowerCase().includes('trống');
              const statusColor = isTrống ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30';
              const isHighlighted = highlightedIds.has(room.roomId);
              
              return (
                <motion.div
                  key={room._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  layout
                  className={`bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border overflow-hidden transition-all duration-500 ${isHighlighted ? 'border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.3)] shadow-rose-500/20' : 'border-white/5 hover:border-white/20'}`}
                >
                  <div className="p-6 md:p-8 space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                          #{room.roomId}
                          {isHighlighted && <span className="bg-rose-500 text-white px-2 py-0.5 rounded text-[8px] animate-pulse">MỚI</span>}
                        </div>
                        <div className="flex items-center gap-2">
                           <MapPin size={16} className="text-slate-400" />
                           <h3 className="text-lg font-black text-white line-clamp-1">{room.address || 'Đang cập nhật'}</h3>
                        </div>
                        <p className="text-slate-500 text-xs font-medium ml-6">{room.district}</p>
                      </div>
                      <div className={`px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${statusColor}`}>
                        {room.status}
                      </div>
                    </div>
                    
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex justify-between items-center">
                       <div>
                           <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Giá thuê</div>
                           <div className="text-xl font-black text-rose-400">{room.price || 'Thoả thuận'}</div>
                       </div>
                       <div className="text-right">
                           <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Nhóm CTV</div>
                           <div className="text-sm font-bold text-white">{room.agentGroup || 'Chưa cập nhật'}</div>
                       </div>
                    </div>
                    
                    {room.info && (
                      <div className="text-sm text-slate-400 font-medium bg-slate-950/50 p-4 rounded-2xl line-clamp-2">
                        <span className="text-rose-500 mr-2">📌</span> {room.info}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                            <Clock size={12} /> Cập nhật: {room.updatedAt}
                        </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
      
      {!loading && errorMsg && (
        <div className="text-center py-24 bg-red-900/30 rounded-[3rem] border border-red-500/30 border-dashed">
          <p className="text-red-400 font-bold mb-2">Đã xảy ra lỗi khi tải dữ liệu:</p>
          <p className="text-red-300 text-sm max-w-xl mx-auto break-all">{errorMsg}</p>
        </div>
      )}
      
      {!loading && !errorMsg && filteredRooms.length === 0 && (
        <div className="text-center py-24 bg-slate-900/30 rounded-[3rem] border border-white/5 border-dashed">
          <p className="text-slate-500 font-medium">Không tìm thấy phòng nào phù hợp.</p>
        </div>
      )}
    </div>
  );
};

export default LiveSheetPage;
