import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { roomService, leadService, userService } from '../services/api';
import { MapPin, Zap, ChevronLeft, AlertCircle, Phone, MessageCircle, User, Loader2, RefreshCcw, Sparkles, Heart, Video, Maximize, X, ChevronRight, Play, ChevronDown, Calendar, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import RoomCard from '../components/RoomCard';
import BookingModal from '../components/BookingModal';
import RoomMap from '../components/RoomMap';
import RoomCostEstimator from '../components/RoomCostEstimator';
import { bookingStatusLabel } from '../services/bookingStatus';
import { ZALO_URL } from '../services/contact';


const RoomDetail = () => {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [statusLoading, setStatusLoading] = useState(false);

  // Related rooms
  const [relatedRooms, setRelatedRooms] = useState([]);
  const [relatedPage, setRelatedPage] = useState(1);
  const [relatedPerPage, setRelatedPerPage] = useState(() => window.innerWidth >= 768 ? 6 : 4);

  // Combine video and images into a single media array
  const allMedia = room ? [
    ...(room.videoUrl ? [{ type: 'video', url: room.videoUrl }] : []),
    ...(room.images || []).map(url => ({ type: 'image', url }))
  ] : [];

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const nextSlide = () => setLightboxIndex((prev) => (prev + 1) % allMedia.length);
  const prevSlide = () => setLightboxIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);

  const [bookingStep, setBookingStep] = useState('idle');
  const [customerPhone, setCustomerPhone] = useState('');
  const [appointment, setAppointment] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [loadingFav, setLoadingFav] = useState(false);

  // New Booking & Reservation states
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingModalTab, setBookingModalTab] = useState('viewing');
  const [myLead, setMyLead] = useState(null);
  const [roomStats, setRoomStats] = useState({ hasActiveReservation: false, recentViewingsCount: 0 });

  const { user, isAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const openBookingModal = (tab = 'viewing') => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    setBookingModalTab(tab);
    setIsBookingModalOpen(true);
  };

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await roomService.getById(id);
        setRoom(res.data);
      } catch (error) {
        console.error("Error fetching room details:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchLead = async () => {
      if (isAuthenticated) {
        try {
          const res = await leadService.getMyLeadForRoom(id);
          if (res.data) {
            setMyLead(res.data);
            setCustomerPhone(res.data.customerPhone || '');
            setAppointment(res.data.appointment || '');
            setBookingStep('finished');
          } else {
            setMyLead(null);
          }
        } catch {}

        // Check favorite status from user object or re-fetch
        if (user?.favorites) {
            setIsFavorite(user.favorites.includes(id));
        }
      }
    };

    const fetchStats = async () => {
      try {
        const res = await leadService.getRoomStats(id);
        if (res.data) setRoomStats(res.data);
      } catch {}
    };

    fetchRoom();
    fetchLead();
    fetchStats();


    // Fetch related rooms
    roomService.getAll({}).then(res => {
      const all = res.data || [];
      const others = all.filter(r => r._id !== id);
      // Prefer same-district rooms first
      setRelatedRooms(others);
    }).catch(() => {});
  }, [id, isAuthenticated, user]);

  // Responsive items-per-page for related rooms
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)');
    const handler = (e) => { setRelatedPerPage(e.matches ? 6 : 4); setRelatedPage(1); };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const toggleFav = async () => {
    if (!isAuthenticated) return navigate('/login', { state: { from: location.pathname } });
    
    // Phản hồi tức thì
    const previousState = isFavorite;
    setIsFavorite(!previousState);

    try {
      await userService.toggleFavorite(id);
    } catch (err) {
      console.error(err);
      setIsFavorite(previousState); // Hoàn tác
    }
  };

  const handleStatusToggle = async () => {
    if (!room) return;
    setStatusLoading(true);
    const next = room.status === 'available' ? 'rented' : 'available';
    try {
      const res = await roomService.updateStatus(id, next);
      setRoom({ ...room, status: res.data.room.status });
    } finally {
      setStatusLoading(false);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!customerPhone) return;
    setBookingStep('waiting');
    try {
      await leadService.createOrUpdate({ roomId: id, customerPhone, appointment });
      setTimeout(() => setBookingStep('finished'), 2000);
    } catch {
      setBookingStep('form');
    }
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-32 text-center text-slate-500 font-black text-2xl uppercase tracking-[0.2em] animate-pulse">
      Đang tải...
    </div>
  );
  if (!room) return (
    <div className="max-w-7xl mx-auto px-4 py-32 text-center text-slate-500">
      Phòng không tồn tại hoặc đã bị xóa.
    </div>
  );

  const formatCurrency = (val) => val?.toLocaleString('vi-VN') + '₫';
  const statusLabel = {
    'available': 'Còn phòng',
    'rented': 'Đã cho thuê',
    'coming-soon': 'Sắp trống'
  };
  const statusColor = {
    'available': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'rented': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    'coming-soon': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">

      {/* Back — dùng history để về đúng trang trước */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-3 text-slate-500 hover:text-white transition-all font-bold group cursor-pointer"
      >
        <div className="p-2 rounded-full bg-white/5 group-hover:bg-rose-500 transition-colors">
          <ChevronLeft size={18} />
        </div>
        Quay lại
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">

        {/* ── Left column ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-10">

          {/* Main media display */}
          <div className="relative group/main">
            <div 
              onClick={() => openLightbox(allMedia.findIndex(m => m.url === (allMedia[activeImage]?.url)))}
              className="overflow-hidden rounded-[2.5rem] aspect-video relative border border-white/5 bg-slate-900 cursor-zoom-in"
            >
              {allMedia[activeImage]?.type === 'video' ? (
                <video 
                  src={allMedia[activeImage].url} 
                  className="w-full h-full object-cover" 
                  autoPlay muted loop playsInline
                />
              ) : (
                <img
                  src={allMedia[activeImage]?.url || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop'}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover/main:scale-105"
                  alt="Phòng trọ"
                />
              )}
              
              <div className="absolute inset-0 bg-black/5 group-hover/main:bg-black/0 transition-colors pointer-events-none" />
              
              {/* Lightbox Trigger Icon */}
              <div className="absolute top-6 right-6 p-4 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 opacity-0 group-hover/main:opacity-100 transition-all scale-90 group-hover/main:scale-100">
                <Maximize size={24} className="text-white" />
              </div>

              {room.status === 'rented' && (
                <div className="absolute inset-0 bg-slate-950/50 flex items-center justify-center pointer-events-none">
                  <span className="bg-slate-950/80 text-rose-500 text-sm font-black px-8 py-4 rounded-full border border-rose-500/30 uppercase tracking-[0.4em] backdrop-blur-md">
                    Hết phòng
                  </span>
                </div>
              )}

              {allMedia[activeImage]?.type === 'video' && (
                <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-emerald-500/80 backdrop-blur-md px-4 py-2 rounded-full text-white text-[10px] font-black uppercase tracking-widest">
                  <Video size={14} /> Video thực tế
                </div>
              )}
            </div>
          </div>

          {/* Thumbnails */}
          {allMedia.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {allMedia.map((media, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`relative w-24 h-24 flex-shrink-0 rounded-[1.5rem] overflow-hidden border-2 transition-all cursor-pointer ${activeImage === i ? 'border-rose-500 scale-105 shadow-xl shadow-rose-500/20' : 'border-white/5 hover:border-white/20'}`}
                >
                  {media.type === 'video' ? (
                      <div className="w-full h-full relative">
                         <video 
                            src={`${media.url}#t=1`} 
                            className="w-full h-full object-cover" 
                            muted playsInline preload="metadata"
                         />
                         <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <Play size={20} className="text-white fill-white" />
                         </div>
                      </div>
                  ) : (
                      <img src={media.url} className="w-full h-full object-cover" alt={`media ${i + 1}`} />
                  )}
                  {activeImage !== i && (
                    <div className="absolute inset-0 bg-slate-950/20 hover:bg-transparent transition-colors" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* ── Info block ───────────────────────────────────────────────── */}
          <div className="space-y-8">

            {/* Badges: displayId, status, admin code */}
            <div className="flex flex-wrap items-center gap-3">
              {room.displayId && (
                <span className="bg-rose-500 text-white text-[12px] font-black px-4 py-2 rounded-full uppercase tracking-[0.2em]">
                  #{room.displayId}
                </span>
              )}
              <span className={`text-[12px] font-black px-4 py-2 rounded-full uppercase tracking-[0.2em] border ${statusColor[room.status]}`}>
                {statusLabel[room.status] || room.status}
              </span>
              {room.availability && (
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[12px] font-black px-4 py-2 rounded-full uppercase tracking-[0.2em]">
                  {room.availability}
                </span>
              )}
              {/* Admin: real code + toggle status */}
              {isAdmin && room.code && (
                <span className="bg-slate-800 text-slate-400 text-[12px] font-mono px-3 py-1.5 rounded-full border border-white/10 tracking-widest">
                  {room.code}{room.roomNumber ? ` · ${room.roomNumber.toUpperCase()}` : ''}
                </span>
              )}

              {room.roomNumber && (
                <span className="bg-slate-800 text-slate-400 text-[12px] font-mono px-3 py-1.5 rounded-full border border-white/10 tracking-widest">
                  {room.roomNumber.toUpperCase()}
                </span>
              )}
            </div>

            {/* Admin status toggle */}
            {isAdmin && (
              <button
                onClick={handleStatusToggle}
                disabled={statusLoading}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-xs uppercase transition-all active:scale-95 cursor-pointer ${room.status === 'available' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white'}`}
              >
                {statusLoading ? <Loader2 className="animate-spin" size={14} /> : <RefreshCcw size={14} />}
                {room.status === 'available' ? 'Đánh dấu Hết phòng' : 'Mở lại Còn phòng'}
              </button>
            )}

            {/* Địa chỉ */}
            <div className="flex items-start gap-3 text-slate-300">
              <MapPin size={18} className="text-rose-500 mt-0.5 shrink-0" />
              <span className="text-lg font-bold">{room.address}</span>
            </div>

            <RoomMap room={room} />
            <RoomCostEstimator key={room._id} room={room} />

            {/* Mô tả */}
            {room.description && (
              <div className="space-y-3">
                <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest">Mô tả</h2>
                <p className="text-slate-300 leading-relaxed font-medium whitespace-pre-line">
                  {room.description}
                </p>
              </div>
            )}

            {/* Lưu ý */}
            {room.notes?.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest">Lưu ý</h2>
                <ul className="space-y-2">
                  {room.notes.map((note, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-400">
                      <AlertCircle size={16} className="text-amber-500/70 mt-0.5 shrink-0" />
                      <span className="font-medium leading-relaxed">{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ── ADMIN ONLY SECTION: OWNER & FINANCIALS ── */}
            {isAdmin && (
              <div className="mt-12 p-8 bg-slate-950/60 rounded-[2.5rem] border border-rose-500/20 space-y-8">
                 <div className="flex items-center gap-3 text-rose-500 text-xs font-black uppercase tracking-[0.3em]">
                    <Sparkles size={16} /> Thông tin nội bộ (Chỉ Admin)
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Owner Info */}
                    <div className="space-y-4">
                       <h3 className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Nguồn hàng / Chủ nhà</h3>
                       <div className="bg-white/5 p-5 rounded-2xl space-y-3">
                          <div className="flex items-center gap-3">
                             <div className="p-2 rounded-lg bg-rose-500/20 text-rose-500"><User size={16} /></div>
                             <span className="text-white font-black">{room.ownerInfo?.name || 'Chưa cập nhật tên'}</span>
                          </div>
                          <div className="flex items-center gap-3">
                             <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-500"><Phone size={16} /></div>
                             <a href={`tel:${room.ownerInfo?.phone}`} className="text-white font-black hover:text-emerald-400 transition-colors">
                                {room.ownerInfo?.phone || 'Chưa có SĐT'}
                             </a>
                          </div>
                       </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="space-y-4">
                       <h3 className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Tính toán lợi nhuận</h3>
                       <div className="bg-white/5 p-5 rounded-2xl space-y-2 font-bold">
                          <div className="flex justify-between text-xs">
                             <span className="text-slate-500">Hoa hồng ({room.commissionRate}%):</span>
                             <span className="text-white">{(room.totalCommission || 0).toLocaleString()}đ</span>
                          </div>
                          <div className="flex justify-between text-xs">
                             <span className="text-slate-500">Hoàn khách (Cashback):</span>
                             <span className="text-rose-400">-{(room.cashbackAmount || 0).toLocaleString()}đ</span>
                          </div>
                          <div className="pt-2 mt-2 border-t border-white/5 flex justify-between items-center">
                             <span className="text-slate-400 uppercase text-[9px] font-black">Lợi nhuận ròng:</span>
                             <span className="text-emerald-400 font-black text-lg">{(room.netProfit || 0).toLocaleString()}đ</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right column: pricing card ───────────────────────────────────── */}
        <div className="lg:col-span-4 self-start">
          <div className="sticky top-28 bg-slate-900/60 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/10 space-y-8 shadow-2xl shadow-black/60">

            {/* Price & Favorite */}
            <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                <span className="text-slate-500 text-xs font-black uppercase tracking-[0.2em]">Giá thuê</span>
                <a href="#room-cost-estimate" className="block text-sm font-light text-rose-400 underline underline-offset-4 mt-2">Tính tổng chi phí khi thuê</a>
                <a href="#room-map" className="block text-sm font-light text-slate-400 underline underline-offset-4 mt-2">Xem vị trí và chỉ đường</a>
                <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-white tracking-tighter">
                    {(room.price / 1_000_000).toFixed(1)}tr
                    </span>
                    <span className="text-slate-500 font-bold whitespace-nowrap">vnđ / tháng</span>
                </div>
                </div>
                
                <button 
                  onClick={toggleFav}
                  disabled={loadingFav}
                  className={`p-6 rounded-[2rem] border-2 transition-all duration-300 active:scale-90 cursor-pointer ${isFavorite 
                    ? 'bg-rose-500 border-white shadow-2xl shadow-rose-500/50 scale-105' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30'}`}
                >
                  <motion.div 
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.8 }}
                    animate={{ scale: isFavorite ? [1, 1.4, 1] : 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Heart 
                      size={32} 
                      fill={isFavorite ? "white" : "none"} 
                      className={isFavorite ? "text-white" : "text-slate-400"}
                      strokeWidth={isFavorite ? 3 : 2}
                    />
                  </motion.div>
                </button>
            </div>

            {/* Social Proof & Urgency */}
            <div className="space-y-2">
              {roomStats.hasActiveReservation && (
                <div className="flex items-center gap-2.5 p-3.5 bg-amber-500/10 border border-amber-500/25 text-amber-300 rounded-2xl text-xs font-bold animate-pulse">
                  <ShieldCheck size={18} className="shrink-0 text-amber-400" />
                  <span>Đang có khách giữ phòng này (ưu tiên xem trước trong 24h)</span>
                </div>
              )}
              {roomStats.recentViewingsCount > 0 && (
                <div className="flex items-center gap-2.5 p-3 bg-white/5 border border-white/10 text-slate-300 rounded-2xl text-xs font-semibold">
                  <Sparkles size={16} className="text-rose-400 shrink-0" />
                  <span>🔥 Có <strong className="text-white">{roomStats.recentViewingsCount} khách</strong> đã hẹn xem trong tuần này</span>
                </div>
              )}
            </div>

            {/* CTA buttons */}
            <div className="space-y-3 pt-1">
              {/* If user already booked */}
              {myLead && myLead.status !== 'cancelled' ? (
                <div className="p-5 rounded-[1.75rem] bg-gradient-to-br from-slate-900 to-slate-800 border border-emerald-500/30 space-y-3 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-400">
                      <CheckCircle2 size={16} />
                      {myLead.type === 'reservation' ? 'Đã yêu cầu giữ chỗ' : 'Đã đăng ký hẹn xem'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                      {bookingStatusLabel(myLead)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    Hệ thống đã ghi nhận yêu cầu từ SĐT <strong className="text-white">{myLead.customerPhone}</strong>.
                    {myLead.appointment && <span className="block text-slate-400 mt-1">📅 {myLead.appointment}</span>}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => openBookingModal(myLead.type || 'viewing')}
                      className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all cursor-pointer text-center"
                    >
                      Đổi thông tin
                    </button>
                    <button
                      onClick={() => navigate('/my-bookings')}
                      className="py-2.5 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer text-center"
                    >
                      Lịch của tôi ➔
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Button 1: Viewing */}
                  <button
                    onClick={() => openBookingModal('viewing')}
                    className="w-full bg-gradient-to-r from-rose-500 via-rose-600 to-orange-500 hover:shadow-2xl hover:shadow-rose-500/30 active:scale-[0.98] text-white font-black py-4 px-6 rounded-[1.5rem] transition-all flex items-center justify-between cursor-pointer group shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-xl group-hover:scale-110 transition-transform">
                        <Calendar size={20} />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-black uppercase tracking-wide">Đặt lịch xem phòng</div>
                        <div className="text-[10px] text-white/80 font-bold">Trực tiếp hoặc Video call 1-1 (Free)</div>
                      </div>
                    </div>
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>

                  {/* Button 2: Reservation / Pre-booking */}
                  <button
                    onClick={() => openBookingModal('reservation')}
                    className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:shadow-2xl hover:shadow-emerald-500/30 active:scale-[0.98] text-white font-black py-4 px-6 rounded-[1.5rem] transition-all flex items-center justify-between cursor-pointer group shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-xl group-hover:scale-110 transition-transform">
                        <ShieldCheck size={20} />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-black uppercase tracking-wide">Đặt cọc giữ phòng trước</div>
                        <div className="text-[10px] text-white/80 font-bold">Khóa phòng 24h • Hoàn 100% nếu sai mô tả</div>
                      </div>
                    </div>
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </>
              )}

              {/* Consultation Messenger & Hotline */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <a 
                  href="https://www.facebook.com/hieutm04" 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full"
                >
                  <button className="w-full bg-white/5 hover:bg-white/10 active:scale-95 text-slate-200 hover:text-white font-bold py-3 px-3 rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs">
                    <MessageCircle size={16} className="text-rose-500" />
                    <span>Messenger</span>
                  </button>
                </a>

                <a 
                  href={ZALO_URL} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full"
                >
                  <button className="w-full bg-blue-500/10 hover:bg-blue-500/20 active:scale-95 text-blue-300 font-bold py-3 px-3 rounded-2xl border border-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs">
                    <Phone size={16} />
                    <span>Chat Zalo</span>
                  </button>
                </a>
              </div>
            </div>


            <div className="text-center text-[9px] text-slate-600 font-black uppercase tracking-widest pt-2 border-t border-white/5">
              Hieu Affiliate Team · Hanoi 2026
            </div>
          </div>
        </div>

      </div>
      {/* ── Lightbox Overlay ── */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center select-none"
            onClick={() => setIsLightboxOpen(false)}
          >
            {/* Close button */}
            <button 
                className="absolute top-8 right-8 z-[110] p-4 rounded-full bg-white/5 hover:bg-rose-500 text-white transition-all cursor-pointer"
                onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(false); }}
            >
                <X size={32} />
            </button>

            {/* Navigation Counter */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[110] px-6 py-2 rounded-full bg-white/10 border border-white/10 text-white font-black text-xs uppercase tracking-[0.3em]">
                {allMedia[lightboxIndex]?.type === 'video' ? 'Video' : 'Ảnh'} {lightboxIndex + 1} / {allMedia.length}
            </div>

            {/* Main Content Area with Swipe */}
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                
                {/* Previous Button */}
                <button 
                    className="absolute left-8 z-[110] p-6 rounded-[2rem] bg-white/5 hover:bg-white/10 text-white transition-all hidden md:block"
                    onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                >
                    <ChevronLeft size={40} />
                </button>

                {/* Swipable Media */}
                <motion.div
                    key={lightboxIndex}
                    initial={{ opacity: 0, x: 100, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -100, scale: 0.9 }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={(e, { offset, velocity }) => {
                        const swipeThreshold = 50;
                        if (offset.x > swipeThreshold) prevSlide();
                        else if (offset.x < -swipeThreshold) nextSlide();
                    }}
                    className="w-full max-w-5xl px-4 md:px-0 flex items-center justify-center cursor-grab active:cursor-grabbing"
                    onClick={(e) => e.stopPropagation()}
                >
                    {allMedia[lightboxIndex]?.type === 'video' ? (
                        <div className="w-full aspect-video rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
                             <video 
                                src={allMedia[lightboxIndex].url} 
                                className="w-full h-full object-contain bg-black" 
                                controls autoPlay loop
                            />
                        </div>
                    ) : (
                        <img 
                            src={allMedia[lightboxIndex].url} 
                            className="w-full max-h-[85vh] object-contain rounded-[2rem] shadow-2xl pointer-events-none"
                            alt="Phóng to"
                        />
                    )}
                </motion.div>

                {/* Next Button */}
                <button 
                    className="absolute right-8 z-[110] p-6 rounded-[2rem] bg-white/5 hover:bg-white/10 text-white transition-all hidden md:block"
                    onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                >
                    <ChevronRight size={40} />
                </button>

            </div>

            {/* Bottom Thumbnails */}
            <div className="absolute bottom-12 left-0 right-0 z-[110] px-8 flex justify-center gap-3 overflow-x-auto py-4 scrollbar-hide">
                {allMedia.map((media, i) => (
                    <button
                        key={i}
                        onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                        className={`relative w-14 h-14 md:w-20 md:h-20 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${lightboxIndex === i ? 'border-rose-500 scale-110' : 'border-white/20 opacity-50 hover:opacity-100'}`}
                    >
                        {media.type === 'video' ? (
                            <div className="w-full h-full relative">
                                <video 
                                    src={`${media.url}#t=1`} 
                                    className="w-full h-full object-cover" 
                                    muted playsInline preload="metadata"
                                />
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                    <Play size={16} className="text-white fill-white" />
                                </div>
                            </div>
                        ) : (
                            <img src={media.url} className="w-full h-full object-cover" alt={`thumb ${i}`} />
                        )}
                    </button>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Related Rooms Section ── */}
      {relatedRooms.length > 0 && (() => {
        // Sort: same district first
        const sorted = room
          ? [
              ...relatedRooms.filter(r => r.address?.toLowerCase().includes(
                (room.address?.match(/quận ([^,]+)/i)?.[1] || '').toLowerCase()
              ) && room.address?.match(/quận ([^,]+)/i)),
              ...relatedRooms.filter(r => !r.address?.toLowerCase().includes(
                (room.address?.match(/quận ([^,]+)/i)?.[1] || '').toLowerCase()
              ) || !room.address?.match(/quận ([^,]+)/i))
            ]
          : relatedRooms;

        const totalRelatedPages = Math.ceil(sorted.length / relatedPerPage);
        const startIdx = (relatedPage - 1) * relatedPerPage;
        const pageRooms = sorted.slice(startIdx, startIdx + relatedPerPage);

        return (
          <div id="related-rooms" className="space-y-8 pt-4 border-t border-white/5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-7 bg-rose-500 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.4)]" />
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Phòng liên quan</h2>
              </div>
              <span className="text-slate-500 text-xs font-bold">{sorted.length} phòng khác</span>
            </div>

            {/* Grid */}
            <motion.div
              key={relatedPage}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8"
            >
              {pageRooms.map(r => (
                <RoomCard
                  key={r._id}
                  room={r}
                  onCompareToggle={() => {}}
                  isSelected={false}
                />
              ))}
            </motion.div>

            {/* Pagination */}
            {totalRelatedPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <button
                  onClick={() => { setRelatedPage(p => Math.max(1, p - 1)); window.scrollTo({ top: document.querySelector('#related-rooms')?.offsetTop - 100 || 0, behavior: 'smooth' }); }}
                  disabled={relatedPage === 1}
                  className="px-5 py-3 bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-[1.5rem] text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all font-black text-xs uppercase"
                >
                  Trước
                </button>
                <div className="flex gap-2">
                  {Array.from({ length: totalRelatedPages }).map((_, idx) => {
                    if (idx === 0 || idx === totalRelatedPages - 1 || (idx >= relatedPage - 2 && idx <= relatedPage)) {
                      return (
                        <button
                          key={idx}
                          onClick={() => setRelatedPage(idx + 1)}
                          className={`w-10 h-10 flex items-center justify-center rounded-[1.2rem] font-black text-sm transition-all ${
                            relatedPage === idx + 1
                              ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-500/20'
                              : 'bg-slate-900/60 border border-white/5 text-slate-400 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    } else if (idx === relatedPage - 3 || idx === relatedPage + 1) {
                      return <span key={idx} className="w-10 h-10 flex items-center justify-center text-slate-500 font-black">...</span>;
                    }
                    return null;
                  })}
                </div>
                <button
                  onClick={() => { setRelatedPage(p => Math.min(totalRelatedPages, p + 1)); window.scrollTo({ top: document.querySelector('#related-rooms')?.offsetTop - 100 || 0, behavior: 'smooth' }); }}
                  disabled={relatedPage === totalRelatedPages}
                  className="px-5 py-3 bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-[1.5rem] text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all font-black text-xs uppercase"
                >
                  Tiếp
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* Booking & Reservation Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        room={room}
        initialTab={bookingModalTab}
        onSuccess={(lead) => {
          setMyLead(lead);
          setBookingStep('finished');
        }}
      />
    </div>
  );
};

export default RoomDetail;

