import React, { useState, useEffect } from 'react';
import RoomCard from '../components/RoomCard';
import { roomService } from '../services/api';
import { Sparkles, ArrowRight, Scale, X, Check, Loader2, Search, MapPin, Ticket, TicketCheck, Rotate3D, Loader, Calendar, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const HomePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParam = new URLSearchParams(location.search).get('search');

  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [compareRooms, setCompareRooms] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  
  const [sortBy, setSortBy] = useState('latest');
  const [userLocation, setUserLocation] = useState(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => window.innerWidth >= 768 ? 9 : 8);
  const [districtOpen, setDistrictOpen] = useState(false);

  const [filters, setFilters] = useState({
    district: '',
    priceRange: [0, 20000000],
    amenities: []
  });

  const fetchRooms = async (currentSort = sortBy, loc = userLocation, query = searchParam) => {
    setLoading(true);
    try {
      const params = { sortBy: currentSort };
      if (currentSort === 'nearest' && loc) {
        params.lat = loc.lat;
        params.lng = loc.lng;
      }
      if (query) {
        params.q = query;
      }
      const res = await roomService.getAll(params);
      setRooms(res.data);
      setFilteredRooms(res.data);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  // Responsive items-per-page: 9 on desktop (md+), 8 on mobile
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)');
    const handleChange = (e) => {
      setItemsPerPage(e.matches ? 9 : 8);
      setCurrentPage(1);
    };
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    fetchRooms(sortBy, userLocation, searchParam);
  }, [searchParam]);

  useEffect(() => {
    // Socket Real-time Listeners
    const socketUrl = import.meta.env.MODE === 'development' ? "http://localhost:3000" : window.location.origin;
    import('socket.io-client').then(({ io }) => {
      const socket = io(socketUrl);

      socket.on('newRoomCreated', (newRoom) => {
        setRooms(prev => [newRoom, ...prev]);
      });

      socket.on('roomUpdated', (updatedRoom) => {
        setRooms(prev => prev.map(r => r._id === updatedRoom._id ? updatedRoom : r));
      });

      socket.on('roomDeleted', (roomId) => {
        setRooms(prev => prev.filter(r => r._id !== roomId));
      });

      return () => socket.disconnect();
    });
  }, []);

  const handleSortChange = async (newSort) => {
    if (newSort === 'nearest') {
        setIsLocating(true);
        if (!navigator.geolocation) {
            alert("Trình duyệt của bạn không hỗ trợ định vị.");
            setSortBy('latest');
            setIsLocating(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserLocation(loc);
                setSortBy('nearest');
                fetchRooms('nearest', loc).finally(() => setIsLocating(false));
            },
            (err) => {
                console.error(err);
                alert("Không thể lấy vị trí của bạn.");
                setSortBy('latest');
                setIsLocating(false);
            }
        );
    } else {
        setSortBy(newSort);
        fetchRooms(newSort, null);
    }
  };

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
    // Reset page on filter/rooms changes
    setCurrentPage(1);
  }, [filters, rooms]);

  // Also reset to page 1 when itemsPerPage changes (screen resize)
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  const districts = ["Cầu Giấy", "Đống Đa", "Thanh Xuân", "Hai Bà Trưng", "Hoàn Kiếm", "Ba Đình", "Nam Từ Liêm", "Bắc Từ Liêm"];
  const commonAmenities = ["Điều hòa", "Nóng lạnh", "Máy giặt", "Tủ lạnh", "Ban công", "Thang máy", "Khép kín"];

  // Tính số phòng theo quận (từ toàn bộ rooms, không bị ảnh hưởng bởi filter khác)
  const roomCountByDistrict = districts.reduce((acc, d) => {
    acc[d] = rooms.filter(r => r.address?.toLowerCase().includes(d.toLowerCase())).length;
    return acc;
  }, {});
  const totalRoomCount = rooms.length;

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRooms = filteredRooms.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);

  const paginate = (pageNumber) => {
      setCurrentPage(pageNumber);
      // Scroll smoothly to top of results grid
      window.scrollTo({ top: document.getElementById('search-results')?.offsetTop - 100, behavior: 'smooth' });
  };

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
      {/* Hero Section - Reimagined for Maximum Impact */}
      <section className="relative min-h-[500px] flex items-center">
        {/* Cinematic Background */}
        <div className="absolute inset-0 bg-slate-950 rounded-[3rem] md:rounded-[4rem] overflow-hidden border border-white/5 shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(244,63,94,0.15),transparent_50%)]"></div>
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_80%,rgba(249,115,22,0.1),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        </div>

        <div className="relative z-10 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 py-12 lg:py-24 px-8 md:px-16 lg:px-20 items-center">
          {/* Left Column: Content */}
          <div className="space-y-10">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-2 rounded-full text-rose-400 text-[11px] font-black tracking-[0.2em] uppercase backdrop-blur-md"
            >
              <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></div>
              Nền tảng tìm kiếm phòng trọ tốt nhất Hà Nội
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <h1 className="text-4xl md:text-6xl xl:text-8xl font-black text-white leading-[0.95] tracking-tight">
                Thuê phòng, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-orange-400 to-amber-300">Hoàn tiền 9%</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-400 font-medium max-w-lg leading-relaxed">
                Hệ thống tìm kiếm thông minh giúp bạn tìm được căn phòng ưng ý và nhận ngay ưu đãi hoàn tiền mặt hấp dẫn khi ký hợp đồng.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap gap-5"
            >
              <button className="group relative bg-rose-500 hover:bg-rose-600 text-white px-10 py-5 rounded-2xl font-black transition-all shadow-[0_20px_40px_rgba(244,63,94,0.3)] flex items-center gap-3 cursor-pointer overflow-hidden active:scale-95">
                <span className="relative z-10 flex items-center gap-2 uppercase tracking-widest text-xs">Bắt đầu tìm ngay <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </button>
              <button 
                onClick={() => setShowOfferModal(true)}
                className="bg-white/5 hover:bg-white/10 text-white px-10 py-5 rounded-2xl font-black border border-white/10 transition-all backdrop-blur-md cursor-pointer flex items-center gap-2 uppercase tracking-widest text-xs active:scale-95"
              >
                Xem chi tiết
              </button>
            </motion.div>
          </div>

          {/* Right Column: Dynamic Visuals */}
          <div className="relative hidden lg:block h-[500px]">
             {/* Floating Stats 1 */}
             <motion.div 
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-10 right-10 z-30 bg-slate-900/80 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] shadow-2xl w-56"
             >
                <div className="bg-rose-500/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                    <TicketCheck className="text-rose-500" size={24} />
                </div>
                <div className="text-3xl font-black text-white">9% Hoàn</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Dành cho mọi hợp đồng</div>
             </motion.div>

             {/* Floating Stats 2 */}
             <motion.div 
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute bottom-10 left-0 z-30 bg-slate-900/80 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] shadow-2xl w-64"
             >
                <div className="flex items-center gap-4 mb-3">
                    <div className="flex -space-x-3">
                        {[1,2,3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white">
                                {String.fromCharCode(64 + i)}
                            </div>
                        ))}
                    </div>
                    <div className="text-[10px] font-black text-rose-500 uppercase">1k+ Tin dùng</div>
                </div>
                <div className="text-xl font-black text-white leading-tight">Tìm phòng nhanh <br/> Chốt hợp đồng ngay</div>
             </motion.div>

             {/* Large Central Element - Pure Glow */}
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 bg-rose-500/20 blur-[100px] rounded-full animate-pulse"></div>
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute w-80 h-80 border-2 border-white/5 rounded-full"
                ></motion.div>
                <motion.div 
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute w-64 h-64 border border-rose-500/20 rounded-full border-dashed"
                ></motion.div>
             </div>
          </div>
        </div>
      </section>

      {/* Search results indicator */}
      <AnimatePresence>
        {searchParam && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-rose-500 p-3 rounded-2xl shadow-lg shadow-rose-500/20">
                  <Search className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">Đang hiển thị kết quả cho</p>
                  <h3 className="text-xl font-black text-white italic">"{searchParam}"</h3>
                </div>
              </div>
              <button 
                onClick={() => navigate('/')}
                className="bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <X size={14} />
                Xoá tìm kiếm
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
 
      {/* Advanced Filter Bar */}
      <section className="bg-slate-900/40 border border-white/5 rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 space-y-8 md:space-y-10 shadow-2xl relative">
        {/* Glow effect — isolated overflow so dropdown is not clipped */}
        <div className="absolute inset-0 rounded-[2rem] md:rounded-[3rem] overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
        </div>
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-1.5 h-8 bg-rose-500 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.5)]"></div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Bộ lọc thông minh</h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-999">
          {/* District Filter — Custom Dropdown */}
          <div className="lg:col-span-5 space-y-5">
             <div className="flex items-center gap-2 px-1">
                <MapPin size={14} className="text-rose-500" />
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Khu vực ưu tiên</label>
             </div>
             <div className="relative">
               {/* Trigger button */}
               <button
                 type="button"
                 onClick={() => setDistrictOpen(prev => !prev)}
                 className="w-full bg-slate-950 border border-white/10 rounded-[1.5rem] p-5 text-white font-bold flex items-center justify-between cursor-pointer focus:ring-2 focus:ring-rose-500/20 transition-all hover:border-white/20"
               >
                 <span className={filters.district ? 'text-white' : 'text-slate-400'}>
                   {filters.district || 'Tất cả Hà Nội'}
                 </span>
                 <div className="flex items-center gap-3">
                   {filters.district && (
                     <span className="bg-rose-500/20 text-rose-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-rose-500/20">
                       {roomCountByDistrict[filters.district]} phòng
                     </span>
                   )}
                   <svg className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${districtOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                 </div>
               </button>

               {/* Dropdown list */}
               {districtOpen && (
                 <div className="absolute top-full left-0 right-0 mt-2 bg-slate-950 border border-white/10 rounded-[1.5rem] overflow-hidden z-50 shadow-2xl shadow-black/50">
                   {/* Tất cả */}
                   <button
                     type="button"
                     onClick={() => { setFilters({...filters, district: ''}); setDistrictOpen(false); }}
                     className={`w-full flex items-center justify-between px-5 py-4 transition-all cursor-pointer text-left group ${
                       filters.district === '' ? 'bg-rose-500/15 text-rose-400' : 'text-white hover:bg-white/5'
                     }`}
                   >
                     <span className="font-bold text-sm">Tất cả Hà Nội</span>
                     <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                       filters.district === '' 
                         ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' 
                         : 'bg-white/5 text-slate-400 border-white/10 group-hover:border-white/20'
                     }`}>
                       {totalRoomCount} phòng
                     </span>
                   </button>

                   <div className="h-px bg-white/5 mx-4" />

                   {/* Từng quận */}
                   {districts.map((d) => {
                     const count = roomCountByDistrict[d];
                     const isActive = filters.district === d;
                     return (
                       <button
                         key={d}
                         type="button"
                         onClick={() => { setFilters({...filters, district: d}); setDistrictOpen(false); }}
                         className={`w-full flex items-center justify-between px-5 py-3.5 transition-all cursor-pointer text-left group ${
                           isActive ? 'bg-rose-500/15 text-rose-400' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                         }`}
                       >
                         <span className="font-bold text-sm">{d}</span>
                         <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border transition-all ${
                           isActive
                             ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                             : count > 0
                               ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:bg-emerald-500/20'
                               : 'bg-white/5 text-slate-600 border-white/5'
                         }`}>
                           {count} phòng
                         </span>
                       </button>
                     );
                   })}
                 </div>
               )}

               {/* Click-outside overlay */}
               {districtOpen && (
                 <div className="fixed inset-0 z-40" onClick={() => setDistrictOpen(false)} />
               )}
             </div>
          </div>

          {/* Price Filter */}
          <div className="lg:col-span-7 space-y-5">
             <div className="flex items-center gap-2 px-1">
                <Scale size={14} className="text-emerald-500" />
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ngân sách dự kiến</label>
             </div>
             <div className="grid grid-cols-3 gap-3">
               {[
                 { label: 'Tất cả', range: [0, 20000000] },
                 { label: 'Dưới 1tr', range: [0, 1000000] },
                 { label: '1tr - 3tr', range: [1000000, 3000000] },
                 { label: '3tr - 5tr', range: [3000000, 5000000] },
                 { label: '5tr - 7tr', range: [5000000, 7000000] },
                 { label: 'Trên 7tr', range: [7000000, 20000000] }
               ].map((item) => {
                 const isActive = filters.priceRange[0] === item.range[0] && filters.priceRange[1] === item.range[1];
                 return (
                   <button
                    key={item.label}
                    onClick={() => setFilters({...filters, priceRange: item.range})}
                    className={`py-4 rounded-2xl border text-[11px] font-black uppercase transition-all cursor-pointer text-center ${isActive ? 'bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/20' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
                   >
                     {item.label}
                   </button>
                 );
               })}
             </div>
          </div>
        </div>

        {/* Reset button — full width, clear CTA */}
        <div className="relative z-10 pt-2">
          <button
            onClick={() => setFilters({ district: '', priceRange: [0, 20000000], amenities: [] })}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-[1.5rem] border border-white/10 bg-white/5 hover:bg-white/10 active:bg-rose-500/20 active:border-rose-500/40 active:text-rose-400 text-slate-400 hover:text-white font-black text-xs uppercase tracking-widest transition-all group cursor-pointer select-none"
          >
            <Loader size={14} className="group-hover:animate-spin group-active:animate-spin" />
            Làm mới bộ lọc
          </button>
        </div>
      </section>

      {/* Room Grid Section */}
      <div id="search-results" className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              {sortBy === 'nearest' ? 'Phòng gần bạn' : 'Phòng mới nhất'}
            </h2>
            <p className="text-slate-500 font-medium">Tìm thấy <span className="text-rose-400 font-bold">{filteredRooms.length}</span> lựa chọn đang trống</p>
          </div>
          <div className="flex gap-2 p-1.5 bg-white/5 border border-white/5 rounded-2xl backdrop-blur-sm">
             <button 
                onClick={() => handleSortChange('latest')}
                className={`px-6 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${sortBy === 'latest' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-slate-400 hover:bg-white/5'}`}
             >
                Mới nhất
             </button>
             <button 
                onClick={() => handleSortChange('nearest')}
                disabled={isLocating}
                className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${sortBy === 'nearest' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-slate-400 hover:bg-white/5 disabled:opacity-50'}`}
             >
                {isLocating ? <Loader2 className="animate-spin" size={14} /> : null}
                {isLocating ? 'Đang định vị...' : 'Gần bạn nhất'}
             </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 lg:gap-10">
            {[1, 2, 3, 4].map(i => (
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
            className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 lg:gap-10"
          >
            {currentRooms.map(room => (
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

        {/* Pagination UI */}
        {!loading && totalPages > 1 && (
            <div className="flex justify-center items-center pt-8 gap-2">
                <button 
                    onClick={() => paginate(currentPage - 1)} 
                    disabled={currentPage === 1}
                    className="px-6 py-4 bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-[1.5rem] text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all font-black text-xs uppercase shadow-xl shadow-slate-900/50"
                >
                    Trước
                </button>
                <div className="flex gap-2">
                    {Array.from({ length: totalPages }).map((_, idx) => {
                        // Logic to limit visible pages
                        if (
                            idx === 0 || 
                            idx === totalPages - 1 || 
                            (idx >= currentPage - 2 && idx <= currentPage)
                        ) {
                            return (
                                <button 
                                    key={idx}
                                    onClick={() => paginate(idx + 1)}
                                    className={`w-12 h-12 flex items-center justify-center rounded-[1.5rem] font-black text-sm transition-all ${currentPage === idx + 1 ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-xl shadow-rose-500/20' : 'bg-slate-900/60 backdrop-blur-md border border-white/5 text-slate-400 hover:bg-white/5 hover:text-white'}`}
                                >
                                    {idx + 1}
                                </button>
                            );
                        } else if (
                            idx === currentPage - 3 || 
                            idx === currentPage + 1
                        ) {
                            return <span key={idx} className="w-12 h-12 flex items-center justify-center text-slate-500 font-black">...</span>;
                        }
                        return null;
                    })}
                </div>
                <button 
                    onClick={() => paginate(currentPage + 1)} 
                    disabled={currentPage === totalPages}
                    className="px-6 py-4 bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-[1.5rem] text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all font-black text-xs uppercase shadow-xl shadow-slate-900/50"
                >
                    Tiếp
                </button>
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
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 sm:px-8 py-3 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer flex items-center gap-1 sm:gap-2"
              >
                <Scale size={16} />
                <span className="hidden sm:inline">So sánh ngay</span>
                <span className="sm:hidden">So sánh</span>
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
            className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-slate-900 w-full max-w-6xl max-h-[90vh] rounded-[3rem] border border-white/10 overflow-hidden flex flex-col shadow-3xl"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-slate-950/20">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 border border-rose-500/20">
                        <Scale size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Danh sách phòng đã chọn</h3>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Xem nhanh thông tin {compareRooms.length} phòng</p>
                    </div>
                </div>
                <button onClick={() => setShowCompareModal(false)} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors cursor-pointer text-slate-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-auto p-8 md:p-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 min-w-[300px]">
                  {compareRooms.map(room => (
                    <div key={room._id} className="bg-slate-950/40 rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col group h-full hover:border-rose-500/30 transition-all duration-500">
                      {/* Room Banner */}
                      <div className="relative aspect-video overflow-hidden">
                        <img src={room.images?.[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="phòng" />
                        <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                            <span className="bg-rose-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg tracking-widest uppercase">
                                #{room.displayId}
                            </span>
                            <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg ${room.status === 'rented' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                {room.status === 'available' ? 'Còn phòng' : 'Hết phòng'}
                            </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-8 space-y-6 flex-1 flex flex-col">
                        <div className="space-y-4 flex-1">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-1">Địa chỉ</p>
                                <h4 className="text-lg font-black text-white leading-tight">{room.address}</h4>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1 bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Giá thuê</p>
                                    <p className="text-xl font-black text-white">{(room.price / 1000000).toFixed(1)}tr</p>
                                </div>
                                <div className="space-y-1 bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Hoàn trả</p>
                                    <p className="text-xl font-black text-emerald-400">{room.cashbackAmount?.toLocaleString()}₫</p>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tiện ích phòng</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {commonAmenities.map(a => {
                                        const hasit = room.amenities?.some(roomA => roomA.toLowerCase().includes(a.toLowerCase()));
                                        if (!hasit) return null;
                                        return (
                                            <span key={a} className="bg-slate-800 text-slate-300 text-[9px] font-bold px-3 py-1.5 rounded-lg border border-white/5">
                                                {a}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <Link 
                            to={`/room/${room._id}`}
                            className="w-full bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl border border-white/5 transition-all text-center text-xs uppercase tracking-widest active:scale-95 mt-4"
                        >
                            Xem chi tiết phòng
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-8 bg-slate-950/40 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                   <div className="bg-rose-500/20 p-3 rounded-2xl text-rose-500">
                      <Sparkles size={20} />
                   </div>
                   <div>
                       <p className="text-white text-sm font-black uppercase tracking-tight">Cơ hội nhận tiền mặt</p>
                       <p className="text-slate-500 text-[10px] font-bold">Hoàn tiền 9% giá trị hợp đồng khi thuê qua hệ thống.</p>
                   </div>
                </div>
                <button 
                  onClick={() => setShowCompareModal(false)}
                  className="w-full md:w-auto bg-rose-500 text-white px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-rose-500/20 cursor-pointer active:scale-95 transition-all"
                >
                  Đóng danh sách
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Offer Explanation Modal */}
      <AnimatePresence>
        {showOfferModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-8"
          >
            <motion.div 
                initial={{ scale: 0.9, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 30 }}
                className="bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-[3rem] md:rounded-[4rem] border border-white/10 overflow-hidden shadow-[0_0_100px_rgba(244,63,94,0.1)] flex flex-col relative"
            >
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                
                <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-8 relative z-10 scrollbar-hide">
                    <div className="flex items-start justify-between">
                        <div className="space-y-3">
                            <motion.div 
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full text-rose-500 text-[9px] font-black tracking-widest uppercase"
                            >
                                <Sparkles size={12} /> Đặc quyền hội viên
                            </motion.div>
                            <h2 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tighter uppercase">
                                QUÀ TẶNG <br/> <span className="text-rose-500 font-black">TÂN GIA 9%</span>
                            </h2>
                            <p className="text-rose-500/80 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
                                Hoàn tiền 01 lần duy nhất khi ký hợp đồng
                            </p>
                        </div>
                        <button 
                            onClick={() => setShowOfferModal(false)}
                            className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors text-slate-500 hover:text-white cursor-pointer"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { step: '01', title: 'Đặt lịch xem', desc: 'Chọn phòng & đặt lịch hẹn trên website.', Icon: Calendar, color: 'text-emerald-500' },
                            { step: '02', title: 'Ký hợp đồng', desc: 'Thực hiện ký thuê phòng với chủ nhà/môi giới.', Icon: ShieldCheck, color: 'text-blue-500' },
                            { step: '03', title: 'Nhận lộc 9%', desc: 'Báo Admin để nhận quà tặng vào ví.', Icon: Ticket, color: 'text-amber-500' }
                        ].map((s, i) => (
                            <div key={i} className="bg-white/5 border border-white/5 p-6 md:p-8 rounded-[2.5rem] space-y-4 hover:bg-white/10 transition-all group">
                                <div className="flex items-center justify-between">
                                    <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${s.color} group-hover:scale-110 transition-transform`}>
                                        <s.Icon size={20} />
                                    </div>
                                    <span className="text-xl font-black text-white/10">{s.step}</span>
                                </div>
                                <div>
                                    <h4 className="text-md font-black text-white mb-1.5 tracking-tight">{s.title}</h4>
                                    <p className="text-[11px] font-bold text-slate-500 leading-relaxed">{s.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-slate-950/60 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-500">
                                <Ticket size={16} />
                            </div>
                            <h5 className="text-[11px] font-black text-white uppercase tracking-widest">Ví dụ phần thưởng (01 lần)</h5>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Giá phòng hàng tháng</p>
                                <p className="text-2xl font-black text-white tracking-tighter">5.000.000 vnđ</p>
                            </div>
                            <div className="p-5 bg-rose-500 rounded-2xl shadow-xl shadow-rose-500/20 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 opacity-20 rotate-12 group-hover:rotate-45 transition-transform">
                                    <Sparkles size={32} />
                                </div>
                                <p className="text-[9px] font-black text-white/70 uppercase tracking-widest mb-1">Quà tân gia nhận ngay</p>
                                <p className="text-2xl font-black text-white tracking-tighter">450.000 vnđ</p>
                            </div>
                        </div>
                        <p className="text-[12px] font-bold text-slate-500 italic leading-relaxed">* Lưu ý: Ưu đãi này không phải là giảm giá tiền phòng hàng tháng. Đây là quà tặng tiền mặt trao 01 lần duy nhất từ hệ thống TimPhongTro cho mỗi hợp đồng thành công.</p>
                    </div>

                    <button 
                        onClick={() => setShowOfferModal(false)}
                        className="w-full bg-slate-100 hover:bg-white text-slate-950 py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all shadow-2xl active:scale-95 cursor-pointer"
                    >
                        Đã hiểu - Khám phá phòng ngay
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
