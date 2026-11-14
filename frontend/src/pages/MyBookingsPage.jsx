import React, { useState, useEffect, useRef, useCallback } from 'react';
import { leadService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, ShieldCheck, Clock, MapPin, Phone, MessageCircle, 
  CheckCircle2, XCircle, AlertCircle, Loader2, Video, User, 
  ExternalLink, ChevronRight, Zap, RefreshCcw, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import BookingProgress from '../components/BookingProgress';
import { bookingStatusLabel } from '../services/bookingStatus';

const MyBookingsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const requestVersion = useRef(0);
  const cancellations = useRef(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [actionError, setActionError] = useState('');
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'viewing' | 'reservation'
  const [cancellingId, setCancellingId] = useState(null);

  const fetchBookings = useCallback(async (quiet = false) => {
    const version = ++requestVersion.current;
    if (!quiet) setLoading(true);
    setRefreshing(true);
    try {
      const res = await leadService.getMyBookings({ timeout: 15000 });
      if (!Array.isArray(res.data)) throw new Error('Dữ liệu yêu cầu không hợp lệ.');
      if (version !== requestVersion.current) return;
      setBookings(res.data.filter(booking => booking && typeof booking === 'object' && booking._id));
      setLastUpdated(new Date());
      setError('');
    } catch (err) {
      if (version !== requestVersion.current) return;
      console.error('Error fetching my bookings:', err);
      setError(err.response?.status === 401 ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' : 'Chưa cập nhật được yêu cầu. Kiểm tra kết nối rồi thử lại; dữ liệu đang hiện có thể chưa mới nhất.');
    } finally {
      if (version === requestVersion.current) { setLoading(false); setRefreshing(false); }
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    fetchBookings();
    const invalidatePending = () => { ++requestVersion.current; };
    const socketUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin);
    const socket = io(socketUrl, { query: { userId: user?._id } });
    const refresh = () => { if (!document.hidden) fetchBookings(true); };
    socket.on('myBookingUpdated', refresh);
    socket.on('connect', refresh);
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      invalidatePending();
      socket.disconnect(); window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [isAuthenticated, user?._id, navigate, fetchBookings]);

  const handleCancel = async (id) => {
    if (cancellations.current.has(id) || !window.confirm('Bạn có chắc chắn muốn hủy yêu cầu này không?')) return;
    cancellations.current.add(id); setCancellingId(id); setActionError('');
    try {
      await leadService.cancelMyBooking(id);
      // Invalidate an older refresh so it cannot restore a pre-cancellation status.
      ++requestVersion.current;
      setBookings(prev => prev.map(b => b._id === id ? { ...b, status: 'cancelled' } : b));
      await fetchBookings(true);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Chưa hủy được yêu cầu. Hãy tải lại trạng thái trước khi thử lại.');
    } finally {
      cancellations.current.delete(id); setCancellingId(null);
    }
  };

  const formatCurrency = (val) => Number(val || 0).toLocaleString('vi-VN') + '₫';

  // Status mapping
  const statusConfig = {
    pending: { label: 'Chờ xác nhận', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    contacted: { label: 'Đã liên hệ', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    confirmed: { label: 'Đã chốt giờ / Đã giữ chỗ', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    contracted: { label: 'Đã ký hợp đồng', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    completed: { label: 'Đã hoàn tất', color: 'bg-teal-500/10 text-teal-300 border-teal-500/20' },
    cancelled: { label: 'Đã hủy', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' }
  };

  // Filtered bookings
  const filteredBookings = bookings.filter(b => {
    if (activeFilter === 'viewing') return b.type === 'viewing' || !b.type;
    if (activeFilter === 'reservation') return b.type === 'reservation';
    return true;
  });

  const viewingCount = bookings.filter(b => b.type === 'viewing' || !b.type).length;
  const reservationCount = bookings.filter(b => b.type === 'reservation').length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-rose-500" size={40} />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Đang tải danh sách lịch hẹn...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-black uppercase tracking-wider mb-3">
            <Calendar size={14} />
            Quản Lý Lịch Trình
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Lịch Hẹn & Đặt Chỗ Của Tôi</h1>
          <p className="text-slate-400 text-sm mt-1">
            Theo dõi lịch xem, yêu cầu giữ chỗ và trạng thái xác nhận từ người hỗ trợ.
          </p>
        </div>

        {/* Stats summary */}
        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md p-3 px-6 rounded-2xl border border-white/10 shrink-0">
          <div className="text-center">
            <div className="text-2xl font-black text-rose-400">{viewingCount}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Hẹn xem phòng</div>
          </div>
          <div className="h-8 w-px bg-white/10 mx-2" />
          <div className="text-center">
            <div className="text-2xl font-black text-emerald-400">{reservationCount}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Giữ chỗ trước</div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
        <p aria-live="polite">{lastUpdated ? `Cập nhật lúc ${lastUpdated.toLocaleTimeString('vi-VN')}` : 'Chưa có bản cập nhật'} · Tự kiểm tra mỗi 30 giây khi trang đang mở.</p>
        <button type="button" onClick={() => fetchBookings(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-slate-600 px-4 py-2 disabled:opacity-50"><RefreshCcw size={15} className={refreshing ? 'animate-spin' : ''}/> {refreshing ? 'Đang cập nhật…' : 'Cập nhật trạng thái'}</button>
      </div>
      {error && <div role="alert" className="rounded-2xl border border-rose-500/20 p-5 text-sm text-rose-400"><p>{error}</p><button type="button" disabled={refreshing} onClick={() => fetchBookings(true)} className="mt-3 underline">Tải lại yêu cầu</button></div>}
      {actionError && <p role="alert" className="text-sm text-rose-400">{actionError}</p>}
      {/* Tabs Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[
          { id: 'all', label: 'Tất cả yêu cầu', count: bookings.length },
          { id: 'viewing', label: '📅 Lịch xem phòng', count: viewingCount },
          { id: 'reservation', label: '🔒 Đặt cọc giữ chỗ', count: reservationCount }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`py-2.5 px-5 rounded-2xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 border ${
              activeFilter === tab.id
                ? 'bg-rose-500 text-white border-rose-500'
                : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeFilter === tab.id ? 'bg-black/15 text-white' : 'bg-white/10 text-slate-300'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content list */}
      {error && !bookings.length ? null : filteredBookings.length === 0 ? (
        <div className="bg-slate-900/40 rounded-[2.5rem] p-16 sm:p-20 text-center border border-white/5 border-dashed space-y-4">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto text-slate-600">
            <Calendar size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-300">Chưa có lịch hẹn nào trong mục này</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Tìm phòng phù hợp rồi gửi yêu cầu xem phòng hoặc giữ chỗ để được hỗ trợ.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 text-white text-xs font-black uppercase tracking-wider shadow-lg hover:shadow-rose-500/20 hover:scale-105 transition-all"
          >
            <span>Khám phá phòng ngay</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredBookings.map((booking) => {
            const room = booking.roomId;
            const status = statusConfig[booking.status] || statusConfig.pending;
            const isReservation = booking.type === 'reservation';

            return (
              <motion.div
                key={booking._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/70 border border-white/10 hover:border-white/20 rounded-[2rem] p-6 sm:p-8 backdrop-blur-xl transition-all shadow-xl space-y-6"
              >
                {/* Top status bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/5">
                  <div className="flex items-center gap-2.5">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border flex items-center gap-1.5 ${
                      isReservation
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {isReservation ? <ShieldCheck size={14} /> : <Calendar size={14} />}
                      {isReservation ? 'Đặt Cọc Giữ Chỗ' : 'Lịch Xem Phòng'}
                    </span>

                    <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${status.color}`}>
                      {Object.hasOwn(statusConfig, booking.status) ? bookingStatusLabel(booking) : 'Đang cập nhật'}
                    </span>
                  </div>

                  <span className="text-[11px] font-medium text-slate-500">
                    Đặt lúc: {booking.createdAt && !Number.isNaN(Date.parse(booking.createdAt)) ? new Date(booking.createdAt).toLocaleString('vi-VN') : 'Chưa có thời gian'}
                  </span>
                </div>

                <BookingProgress booking={booking} />
                {/* Main Content Layout */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Room Thumbnail & Basic info (col 1-5) */}
                  <div className="md:col-span-5 flex items-center gap-4">
                    {room?.images?.[0] ? (
                      <img 
                        src={room.images[0]} 
                        alt="Room" 
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shrink-0 border border-white/10 shadow-md"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 text-slate-600">
                        <MapPin size={28} />
                      </div>
                    )}

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-rose-400 uppercase tracking-wider bg-rose-500/10 px-2 py-0.5 rounded-md">
                          {room?.code || room?.displayId || 'Phòng'}
                        </span>
                        {room?.district && (
                          <span className="text-xs text-slate-400 font-bold">
                            {room.district}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm sm:text-base font-black text-white line-clamp-2 leading-snug">
                        {room?.address || 'Địa chỉ đang cập nhật'}
                      </h4>

                      <div className="flex items-baseline gap-2 pt-0.5">
                        <span className="text-base sm:text-lg font-black text-white">
                          {formatCurrency(room?.price)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">/ tháng</span>
                      </div>

                      {room?.cashbackAmount > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-black uppercase tracking-wider">
                          <Zap size={12} fill="currentColor" />
                          <span>Hoàn {formatCurrency(room.cashbackAmount)} khi thuê</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Booking Specifics (col 6-12) */}
                  <div className="md:col-span-7 bg-white/5 rounded-2xl p-4 sm:p-5 border border-white/5 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* Viewing specific */}
                      {!isReservation ? (
                        <>
                          <div>
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Hình thức xem:</span>
                            <span className="font-bold text-white flex items-center gap-1.5 mt-0.5">
                              {booking.viewingMethod === 'videocall' ? (
                                <>
                                  <Video size={14} className="text-rose-400" />
                                  <span>Video Call 1-1 (Zalo)</span>
                                </>
                              ) : (
                                <>
                                  <MapPin size={14} className="text-rose-400" />
                                  <span>Xem trực tiếp tại phòng</span>
                                </>
                              )}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Lịch hẹn dự kiến:</span>
                            <span className="font-bold text-rose-300 mt-0.5 block">
                              {booking.appointment || booking.viewingDate || 'Đang xếp lịch'}
                            </span>
                          </div>
                        </>
                      ) : (
                        /* Reservation specific */
                        <>
                          <div>
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Tiền cọc giữ chỗ:</span>
                            <span className="font-black text-emerald-400 text-sm mt-0.5 block">
                              {booking.depositAmount == null ? 'Chưa cập nhật' : formatCurrency(booking.depositAmount)}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Dự kiến dọn vào:</span>
                            <span className="font-bold text-white mt-0.5 block">
                              {booking.moveInDate || 'Thỏa thuận'}
                            </span>
                          </div>
                        </>
                      )}

                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">SĐT liên hệ:</span>
                        <span className="font-bold text-white mt-0.5 block">
                          {booking.customerPhone}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Nhu cầu phòng:</span>
                        <span className="font-medium text-slate-300 mt-0.5 block">
                          {booking.peopleCount || 1} người {booking.hasVehicle && '• 🛵 Có xe'} {booking.hasPet && '• 🐾 Thú cưng'}
                        </span>
                      </div>
                    </div>

                    {booking.note && (
                      <div className="text-xs pt-2 border-t border-white/5">
                        <span className="text-slate-500 text-[10px] uppercase font-bold">Ghi chú của bạn: </span>
                        <span className="text-slate-300 italic">{booking.note}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    {room?.ownerInfo?.phone && <a
                      href={`https://zalo.me/${String(room.ownerInfo.phone).replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/20 text-xs font-bold transition-all"
                    >
                      <Phone size={14} />
                      <span>Liên hệ người cho thuê</span>
                    </a>}

                    {room?._id && (
                      <Link
                        to={`/room/${room._id}`}
                        className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition-all"
                      >
                        <span>Xem lại phòng</span>
                        <ExternalLink size={14} />
                      </Link>
                    )}
                  </div>

                  {/* Cancel button if pending or contacted */}
                  {['pending', 'contacted', 'confirmed'].includes(booking.status) && (
                    <button
                      onClick={() => handleCancel(booking._id)}
                      disabled={cancellingId !== null}
                      className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {cancellingId === booking._id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                      <span>Hủy yêu cầu</span>
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;
