import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { roomService, leadService, userService } from '../services/api';
import { MapPin, Zap, ChevronLeft, AlertCircle, Phone, MessageCircle, User, Loader2, RefreshCcw, Sparkles, Heart, Video, Maximize, X, ChevronRight, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const RoomDetail = () => {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [statusLoading, setStatusLoading] = useState(false);

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

  const { user, isAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
            setCustomerPhone(res.data.customerPhone || '');
            setAppointment(res.data.appointment || '');
            setBookingStep('finished');
          }
        } catch {}

        // Check favorite status from user object or re-fetch
        if (user?.favorites) {
            setIsFavorite(user.favorites.includes(id));
        }
      }
    };

    fetchRoom();
    fetchLead();
  }, [id, isAuthenticated, user]);

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

      {/* Back */}
      <Link to="/" className="inline-flex items-center gap-3 text-slate-500 hover:text-white transition-all font-bold group cursor-pointer">
        <div className="p-2 rounded-full bg-white/5 group-hover:bg-rose-500 transition-colors">
          <ChevronLeft size={18} />
        </div>
        Quay lại
      </Link>

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
                <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-white tracking-tighter">
                    {(room.price / 1_000_000).toFixed(1)}tr
                    </span>
                    <span className="text-slate-500 font-bold">vnđ / tháng</span>
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

            {/* Cashback */}
            {room.cashbackAmount > 0 && (
              <div className="bg-emerald-500 p-6 rounded-[2rem] space-y-4 shadow-xl shadow-emerald-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                  <Zap size={80} fill="white" />
                </div>
                <div className="relative flex items-center gap-3">
                  <div className="bg-white/30 p-2.5 rounded-xl">
                    <Zap size={20} className="text-white" fill="white" />
                  </div>
                  <div>
                    <p className="text-white font-black text-base uppercase tracking-tight leading-none">TIỀN HOÀN TRẢ</p>
                    <p className="text-white/60 text-[9px] font-black uppercase tracking-widest mt-0.5">Nhận ngay khi ký HĐ</p>
                  </div>
                </div>
                <div className="relative text-3xl font-black text-white tracking-tighter">
                  {formatCurrency(room.cashbackAmount)}
                </div>
                <p className="relative text-[10px] text-white/70 leading-relaxed font-medium">
                  (*) Trao tiền mặt hoặc chuyển khoản ngay khi ký biên bản thuê phòng qua hệ thống.
                </p>
              </div>
            )}

            {/* CTA buttons */}
            <div className="space-y-3">
              <a href='https://www.facebook.com/hieutm04' target='_blank' className='flex'>
                <button className="w-full bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-black py-4 rounded-[1.5rem] transition-all shadow-xl shadow-rose-500/20 flex items-center justify-center gap-3 cursor-pointer">
                  <MessageCircle size={20} fill="white" />
                  Messenger Tư Vấn
                </button>
              </a>

              {bookingStep === 'idle' && (
                <button
                  onClick={() => !isAuthenticated ? navigate('/login', { state: { from: location.pathname } }) : setBookingStep('form')}
                  className="w-full bg-white/5 hover:bg-white/10 active:scale-95 text-white font-black py-4 rounded-[1.5rem] border border-white/10 transition-all flex items-center justify-center gap-3 cursor-pointer"
                >
                  <Phone size={20} className="text-emerald-500" />
                  Đặt lịch xem phòng
                </button>
              )}

              {bookingStep === 'form' && (
                <form onSubmit={handleBooking} className="bg-white/5 p-5 rounded-[1.5rem] border border-white/10 space-y-4 animate-in fade-in zoom-in duration-300">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">SĐT của bạn</label>
                    <input
                      type="tel" required placeholder="09xx xxx xxx"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Thời gian xem phòng</label>
                    <input
                      type="text" placeholder="Ví dụ: 18h tối mai"
                      value={appointment}
                      onChange={(e) => setAppointment(e.target.value)}
                      className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all font-bold"
                    />
                  </div>
                  <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3 rounded-xl transition-all shadow-lg cursor-pointer">
                    Xác nhận
                  </button>
                </form>
              )}

              {bookingStep === 'waiting' && (
                <div className="flex items-center justify-center gap-3 py-8 animate-pulse">
                  <Loader2 className="animate-spin text-rose-500" size={24} />
                  <span className="text-white font-black text-xs uppercase tracking-widest">Đợi tí...</span>
                </div>
              )}

              {bookingStep === 'finished' && (
                <div className="space-y-3 animate-in slide-in-from-bottom duration-500">
                  <div className="bg-slate-800/80 p-5 rounded-[1.5rem] border border-emerald-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center">
                        <User size={12} className="text-white" />
                      </div>
                      <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Hỗ trợ tìm phòng</span>
                    </div>
                    <p className="text-slate-200 font-bold text-sm leading-relaxed">
                      Đã nhận yêu cầu từ <span className="text-white">{customerPhone}</span> 🌹<br />
                      Hỗ trợ viên sẽ sớm liên hệ lại qua Zalo!
                    </p>
                    {appointment && (
                      <p className="text-slate-400 text-xs font-bold mt-2">📅 Lịch hẹn: {appointment}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setBookingStep('form')}
                    className="w-full bg-white/5 hover:bg-white/10 text-white text-[9px] font-black uppercase py-3 rounded-xl border border-white/10 transition-all tracking-widest cursor-pointer"
                  >
                    Chỉnh sửa
                  </button>
                </div>
              )}
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
    </div>
  );
};

export default RoomDetail;
