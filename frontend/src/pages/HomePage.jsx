import React, { useState, useEffect, useRef } from 'react';
import SearchHero from '../components/SearchHero';
import { matchesRoom, normalize } from '../services/roomSearch';
import './home.css';
import RoomCard from '../components/RoomCard';
import { roomService } from '../services/api';
import { Sparkles, ArrowRight, Scale, X, Check, Loader2, Search, MapPin, Ticket, TicketCheck, Rotate3D, Loader, Calendar, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const HomePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParam = new URLSearchParams(location.search).get('search');

  const fetchVersion = useRef(0);
  const [fetchError, setFetchError] = useState(false);
  const [onlyAvailable, setOnlyAvailable] = useState(true);
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
    const version = ++fetchVersion.current;
    setLoading(true);
    setFetchError(false);
    try {
      const params = { sortBy: currentSort };
      if (currentSort === 'nearest' && loc) {
        params.lat = loc.lat;
        params.lng = loc.lng;
      }

      const res = await roomService.getAll(params);
      if (version !== fetchVersion.current) return;
      if (!Array.isArray(res.data)) throw new Error('Invalid room list');
      setRooms(res.data.filter(room => room && typeof room === 'object' && room._id));
    } catch (error) {
      if (version !== fetchVersion.current) return;
      setFetchError(true);
      console.error("Error fetching rooms:", error);
    } finally {
      if (version === fetchVersion.current) setLoading(false);
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
  }, []);

  useEffect(() => {
    let socket;
    let disposed = false;
    const socketUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin);
    import('socket.io-client').then(({ io }) => {
      if (disposed) return;
      socket = io(socketUrl);
      socket.on('newRoomCreated', room => setRooms(prev => [room, ...prev.filter(r => r._id !== room._id)]));
      socket.on('roomUpdated', room => setRooms(prev => prev.map(r => r._id === room._id ? room : r)));
      socket.on('roomDeleted', id => setRooms(prev => prev.filter(r => r._id !== id)));
    });
    return () => { disposed = true; socket?.disconnect(); };
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
    let result = rooms.filter(r => (!onlyAvailable || r.status !== 'rented') && matchesRoom(r, searchParam || ''));

    if (filters.district) {
      result = result.filter(r => normalize(r.address).includes(normalize(filters.district)));
    }

    result = result.filter(r => r.price >= filters.priceRange[0] && r.price <= filters.priceRange[1]);

    if (filters.amenities.length > 0) {
      result = result.filter(r => 
        filters.amenities.every(a => (Array.isArray(r.amenities) ? r.amenities : []).some(roomA => roomA.toLowerCase().includes(a.toLowerCase())))
      );
    }

    setFilteredRooms(result);
    // Reset page on filter/rooms changes
    setCurrentPage(1);
  }, [filters, rooms, searchParam, onlyAvailable]);

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
    <div className="rental-home">
      <SearchHero rooms={rooms.filter(r => r.status !== 'rented')} loading={loading} failed={fetchError} query={searchParam || ''} onSearch={value => navigate(value ? `/?search=${encodeURIComponent(value)}` : '/')} />
      <div className="discovery-strip"><span><ShieldCheck size={18}/> Xem ảnh và thông tin phòng trước khi đặt lịch</span><span><Calendar size={18}/> Chủ động chọn lịch xem phòng</span><button onClick={() => setShowOfferModal(true)}>Tìm hiểu ưu đãi hoàn tiền <ArrowRight size={16}/></button></div>
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
                  <p className="text-[10px] font-normal text-rose-500 normal-case tracking-normal">Đang hiển thị kết quả cho</p>
                  <h3 className="text-xl font-normal text-white italic">"{searchParam}"</h3>
                </div>
              </div>
              <button 
                onClick={() => navigate('/')}
                className="bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-2xl text-xs font-normal normal-case tracking-normal transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <X size={14} />
                Xoá tìm kiếm
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
 
      <section className="compact-filters" aria-label="Bộ lọc phòng">
        <label>Khu vực<select value={filters.district} onChange={e => setFilters({...filters, district: e.target.value})}><option value="">Tất cả Hà Nội</option>{districts.map(d => <option key={d} value={d}>{d} ({roomCountByDistrict[d]})</option>)}</select></label>
        <label>Ngân sách / tháng<select value={filters.priceRange.join('-')} onChange={e => setFilters({...filters, priceRange: e.target.value.split('-').map(Number)})}><option value="0-20000000">Tất cả mức giá</option><option value="0-3000000">Đến 3 triệu</option><option value="3000000-5000000">3 – 5 triệu</option><option value="5000000-7000000">5 – 7 triệu</option><option value="7000000-20000000">Từ 7 triệu</option></select></label>
        <label className="available-toggle"><input type="checkbox" checked={onlyAvailable} onChange={e => setOnlyAvailable(e.target.checked)}/> Ẩn phòng đã thuê</label>
        <button className="reset-filter" onClick={() => {setFilters({district: '', priceRange: [0, 20000000], amenities: []}); setOnlyAvailable(true); navigate('/');}}>Xóa bộ lọc</button>
      </section>
      {/* Room Grid Section */}
      <div id="search-results" className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-5xl font-normal text-white tracking-normal">
              {sortBy === 'nearest' ? 'Phòng gần bạn' : (searchParam ? 'Kết quả tìm phòng' : 'Phòng đang cho thuê')}
            </h2>
            <p className="text-slate-500 font-normal">Tìm thấy <span className="text-rose-400 font-normal">{filteredRooms.length}</span> phòng phù hợp</p>
          </div>
          <div className="flex gap-2 p-1.5 bg-white/5 border border-white/5 rounded-2xl backdrop-blur-sm">
             <button 
                onClick={() => handleSortChange('latest')}
                className={`px-6 py-2 rounded-xl text-xs font-normal transition-all cursor-pointer ${sortBy === 'latest' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-slate-400 hover:bg-white/5'}`}
             >
                Mới nhất
             </button>
             <button 
                onClick={() => handleSortChange('nearest')}
                disabled={isLocating}
                className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-normal transition-all cursor-pointer ${sortBy === 'nearest' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-slate-400 hover:bg-white/5 disabled:opacity-50'}`}
             >
                {isLocating ? <Loader2 className="animate-spin" size={14} /> : null}
                {isLocating ? 'Đang định vị...' : 'Gần bạn nhất'}
             </button>
          </div>
        </div>

        {fetchError ? <div className="search-empty" role="alert"><h3>Chưa kết nối được danh sách phòng</h3><p>Hãy kiểm tra kết nối hoặc khởi động máy chủ rồi thử lại.</p><button onClick={() => fetchRooms()}>Tải lại danh sách</button></div> : loading ? (
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
            <h3 className="text-xl font-normal text-white">Chưa có phòng khớp với tìm kiếm này</h3><p className="text-slate-400 my-4">Thử tên quận, tên đường ngắn hơn hoặc mở rộng mức giá.</p><button className="reset-filter" onClick={() => {setFilters({district: '', priceRange: [0, 20000000], amenities: []}); navigate('/');}}>Xem tất cả phòng</button>
          </div>
        )}

        {/* Pagination UI */}
        {!loading && totalPages > 1 && (
            <div className="flex justify-center items-center pt-8 gap-2">
                <button 
                    onClick={() => paginate(currentPage - 1)} 
                    disabled={currentPage === 1}
                    className="px-6 py-4 bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-[1.5rem] text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all font-normal text-xs normal-case shadow-xl shadow-slate-900/50"
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
                                    className={`w-12 h-12 flex items-center justify-center rounded-[1.5rem] font-normal text-sm transition-all ${currentPage === idx + 1 ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-xl shadow-rose-500/20' : 'bg-slate-900/60 backdrop-blur-md border border-white/5 text-slate-400 hover:bg-white/5 hover:text-white'}`}
                                >
                                    {idx + 1}
                                </button>
                            );
                        } else if (
                            idx === currentPage - 3 || 
                            idx === currentPage + 1
                        ) {
                            return <span key={idx} className="w-12 h-12 flex items-center justify-center text-slate-500 font-normal">...</span>;
                        }
                        return null;
                    })}
                </div>
                <button 
                    onClick={() => paginate(currentPage + 1)} 
                    disabled={currentPage === totalPages}
                    className="px-6 py-4 bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-[1.5rem] text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all font-normal text-xs normal-case shadow-xl shadow-slate-900/50"
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
              <p className="text-xs font-normal text-white normal-case tracking-normal hidden sm:block">
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
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 sm:px-8 py-3 rounded-full text-[10px] sm:text-xs font-normal normal-case tracking-normal transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer flex items-center gap-1 sm:gap-2"
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
                        <h3 className="text-2xl font-normal text-white normal-case tracking-normal">Danh sách phòng đã chọn</h3>
                        <p className="text-slate-500 text-xs font-normal normal-case tracking-normal mt-1">Xem nhanh thông tin {compareRooms.length} phòng</p>
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
                            <span className="bg-rose-500 text-white text-[10px] font-normal px-3 py-1.5 rounded-full shadow-lg tracking-normal normal-case">
                                #{room.displayId}
                            </span>
                            <span className={`text-[9px] font-normal px-3 py-1.5 rounded-full normal-case tracking-normal shadow-lg ${room.status === 'rented' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                {room.status === 'available' ? 'Còn phòng' : 'Hết phòng'}
                            </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-8 space-y-6 flex-1 flex flex-col">
                        <div className="space-y-4 flex-1">
                            <div className="space-y-1">
                                <p className="text-[10px] font-normal text-rose-500 normal-case tracking-normal mb-1">Địa chỉ</p>
                                <h4 className="text-lg font-normal text-white leading-tight">{room.address}</h4>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1 bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <p className="text-[9px] font-normal text-slate-500 normal-case tracking-normal">Giá thuê</p>
                                    <p className="text-xl font-normal text-white">{(room.price / 1000000).toFixed(1)}tr</p>
                                </div>
                                <div className="space-y-1 bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                                    <p className="text-[9px] font-normal text-emerald-500 normal-case tracking-normal">Hoàn trả</p>
                                    <p className="text-xl font-normal text-emerald-400">{room.cashbackAmount?.toLocaleString()}₫</p>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <p className="text-[10px] font-normal text-slate-500 normal-case tracking-normal">Tiện ích phòng</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {commonAmenities.map(a => {
                                        const hasit = room.amenities?.some(roomA => roomA.toLowerCase().includes(a.toLowerCase()));
                                        if (!hasit) return null;
                                        return (
                                            <span key={a} className="bg-slate-800 text-slate-300 text-[9px] font-normal px-3 py-1.5 rounded-lg border border-white/5">
                                                {a}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <Link 
                            to={`/room/${room._id}`}
                            className="w-full bg-white/5 hover:bg-white/10 text-white font-normal py-4 rounded-2xl border border-white/5 transition-all text-center text-xs normal-case tracking-normal active:scale-95 mt-4"
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
                       <p className="text-white text-sm font-normal normal-case tracking-normal">Cơ hội nhận tiền mặt</p>
                       <p className="text-slate-500 text-[10px] font-normal">Hoàn tiền 9% giá trị hợp đồng khi thuê qua hệ thống.</p>
                   </div>
                </div>
                <button 
                  onClick={() => setShowCompareModal(false)}
                  className="w-full md:w-auto bg-rose-500 text-white px-12 py-4 rounded-2xl font-normal normal-case text-xs tracking-normal shadow-xl shadow-rose-500/20 cursor-pointer active:scale-95 transition-all"
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
                                className="inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full text-rose-500 text-[9px] font-normal tracking-normal normal-case"
                            >
                                <Sparkles size={12} /> Đặc quyền hội viên
                            </motion.div>
                            <h2 className="text-3xl md:text-5xl font-normal text-white leading-tight tracking-normal normal-case">
                                QUÀ TẶNG <br/> <span className="text-rose-500 font-normal">TÂN GIA 9%</span>
                            </h2>
                            <p className="text-rose-500/80 text-[10px] font-normal normal-case tracking-normal flex items-center gap-2">
                                <span aria-hidden="true" className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
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
                                    <span className="text-xl font-normal text-white/10">{s.step}</span>
                                </div>
                                <div>
                                    <h4 className="text-md font-normal text-white mb-1.5 tracking-normal">{s.title}</h4>
                                    <p className="text-[11px] font-normal text-slate-500 leading-relaxed">{s.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-slate-950/60 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-500">
                                <Ticket size={16} />
                            </div>
                            <h5 className="text-[11px] font-normal text-white normal-case tracking-normal">Ví dụ phần thưởng (01 lần)</h5>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div>
                                <p className="text-[9px] font-normal text-slate-500 normal-case tracking-normal mb-1.5">Giá phòng hàng tháng</p>
                                <p className="text-2xl font-normal text-white tracking-normal">5.000.000 vnđ</p>
                            </div>
                            <div className="p-5 bg-rose-500 rounded-2xl shadow-xl shadow-rose-500/20 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 opacity-20 rotate-12 group-hover:rotate-45 transition-transform">
                                    <Sparkles size={32} />
                                </div>
                                <p className="text-[9px] font-normal text-white/70 normal-case tracking-normal mb-1">Quà tân gia nhận ngay</p>
                                <p className="text-2xl font-normal text-white tracking-normal">450.000 vnđ</p>
                            </div>
                        </div>
                        <p className="text-[12px] font-normal text-slate-500 italic leading-relaxed">* Lưu ý: Ưu đãi này không phải là giảm giá tiền phòng hàng tháng. Đây là quà tặng tiền mặt trao 01 lần duy nhất từ hệ thống TimPhongTro cho mỗi hợp đồng thành công.</p>
                    </div>

                    <button 
                        onClick={() => setShowOfferModal(false)}
                        className="w-full bg-slate-100 hover:bg-white text-slate-950 py-5 rounded-2xl font-normal normal-case text-[11px] tracking-normal transition-all shadow-2xl active:scale-95 cursor-pointer"
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
