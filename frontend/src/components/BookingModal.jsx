import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Calendar, Clock, MapPin, Video, User, Phone, CheckCircle2, 
  ShieldCheck, AlertCircle, Sparkles, ChevronRight, QrCode, Copy, 
  ExternalLink, ArrowRight, Zap, Users, Check, Loader2 
} from 'lucide-react';
import { leadService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { bookingStatusLabel } from '../services/bookingStatus';
import { PAYMENT_ACCOUNT } from '../services/contact';

const BookingModal = ({ isOpen, onClose, room, initialTab = 'viewing', onSuccess }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const submitting = useRef(false);
  const wasOpen = useRef(false);
  const [error, setError] = useState('');
  const successHeading = useRef(null);
  const [activeTab, setActiveTab] = useState(initialTab); // 'viewing' | 'reservation'
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedLead, setSubmittedLead] = useState(null);
  const [copiedBank, setCopiedBank] = useState(false);

  // Common fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [note, setNote] = useState('');

  // Viewing fields
  const [viewingMethod, setViewingMethod] = useState('direct'); // 'direct' | 'videocall'
  const [viewingDate, setViewingDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('afternoon'); // 'morning' | 'afternoon' | 'evening' | 'custom'
  const [customTime, setCustomTime] = useState('');
  const [peopleCount, setPeopleCount] = useState(1);
  const [hasPet, setHasPet] = useState(false);
  const [hasVehicle, setHasVehicle] = useState(false);

  // Reservation fields
  const [moveInDate, setMoveInDate] = useState('');
  const [depositAmount, setDepositAmount] = useState(500000); // 500k default
  const [paymentMethod, setPaymentMethod] = useState('vietqr'); // 'vietqr' | 'contact_later'

  // Initialize data from current user or defaults
  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      setError('');
      setIsSuccess(false);
      setSubmittedLead(null);
      setActiveTab(initialTab);
      if (user) {
        setCustomerName(user.username || '');
        setCustomerPhone(user.phone || '');
      }

      // Default viewing date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const dd = String(tomorrow.getDate()).padStart(2, '0');
      setViewingDate(`${yyyy}-${mm}-${dd}`);

      // Default move-in date
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const myyyy = nextWeek.getFullYear();
      const mmm = String(nextWeek.getMonth() + 1).padStart(2, '0');
      const mdd = String(nextWeek.getDate()).padStart(2, '0');
      setMoveInDate(`${myyyy}-${mmm}-${mdd}`);
    }
    wasOpen.current = isOpen;
  }, [isOpen, initialTab, user]);

  useEffect(() => {
    if (isSuccess) successHeading.current?.focus();
  }, [isSuccess]);

  if (!isOpen || !room) return null;

  // Format currency
  const formatCurrency = (val) => Number(val || 0).toLocaleString('vi-VN') + '₫';

  // Bank Info for VietQR
  const BANK_ID = PAYMENT_ACCOUNT.bankId;
  const ACCOUNT_NO = PAYMENT_ACCOUNT.accountNo;
  const ACCOUNT_NAME = PAYMENT_ACCOUNT.accountName;
  const qrTransferContent = `TP ${room.code || room.displayId} ${customerPhone ? customerPhone.slice(-4) : 'COC'}`;
  const vietQrUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png?amount=${depositAmount}&addInfo=${encodeURIComponent(qrTransferContent)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const getSlotLabel = (slot) => {
    switch (slot) {
      case 'morning': return 'Sáng (09:00 - 11:30)';
      case 'afternoon': return 'Chiều (14:00 - 17:30)';
      case 'evening': return 'Tối (18:00 - 20:30)';
      default: return customTime || 'Khung giờ thỏa thuận';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting.current) return;
    setError('');
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!customerPhone.trim()) {
      setError("Vui lòng nhập số điện thoại để hỗ trợ viên liên hệ xác nhận.");
      return;
    }

    submitting.current = true;
    setLoading(true);

    try {
      const payload = {
        roomId: room._id,
        type: activeTab,
        customerName,
        customerPhone,
        note,
        appointment: activeTab === 'viewing' 
          ? `${viewingDate} • ${getSlotLabel(timeSlot)} (${viewingMethod === 'direct' ? 'Xem trực tiếp' : 'Video call 1-1'})`
          : `Giữ chỗ phòng • Dự kiến dọn vào: ${moveInDate}`,
        viewingDate,
        timeSlot: timeSlot === 'custom' ? customTime : getSlotLabel(timeSlot),
        viewingMethod,
        peopleCount,
        hasPet,
        hasVehicle,
        depositAmount: activeTab === 'reservation' ? depositAmount : 0,
        paymentMethod: activeTab === 'reservation' ? paymentMethod : 'contact_later',
        moveInDate: activeTab === 'reservation' ? moveInDate : undefined
      };

      const res = await leadService.createOrUpdate(payload, { timeout: 20000 });
      const savedLead = res.data?.lead;
      if (res.data?.success === false || !savedLead?._id) {
        throw new Error('Chưa nhận được mã xác nhận. Hãy kiểm tra Lịch hẹn & đặt chỗ của tôi trước khi gửi lại.');
      }
      const receipt = { ...payload, ...savedLead };
      setSubmittedLead(receipt);
      setIsSuccess(true);
      // A parent UI callback must not turn a saved request into a failed submission.
      try { await onSuccess?.(receipt); } catch (callbackError) {
        console.error('Booking saved, but the parent view could not refresh:', callbackError);
      }
    } catch (err) {
      console.error("Booking error:", err);
      setError(err.response?.status === 401
        ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.'
        : err.code === 'ECONNABORTED' || !err.response && err.request
          ? 'Chưa nhận được phản hồi từ máy chủ. Hãy kiểm tra Lịch hẹn & đặt chỗ của tôi trước khi gửi lại.'
          : err.response?.data?.message || err.message || 'Không gửi được yêu cầu. Vui lòng thử lại.');
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  // Google Calendar Link generator
  const createGoogleCalendarUrl = () => {
    if (!viewingDate) return '#';
    const dateFormatted = viewingDate.replace(/-/g, '');
    let startTime = '090000';
    let endTime = '100000';
    if (timeSlot === 'afternoon') { startTime = '140000'; endTime = '150000'; }
    if (timeSlot === 'evening') { startTime = '183000'; endTime = '193000'; }

    const title = `[Hẹn Xem Phòng] ${room.code || room.displayId} - timphongonline.com`;
    const details = `Lịch hẹn xem phòng trọ: ${room.address}\nGiá thuê: ${formatCurrency(room.price)}/tháng\nSĐT khách: ${customerPhone}\nHình thức: ${viewingMethod === 'direct' ? 'Xem trực tiếp tại phòng' : 'Video call trực tiếp'}\nHỗ trợ viên liên hệ qua Zalo.`;
    const location = room.address || 'Hà Nội';

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${dateFormatted}T${startTime}/${dateFormatted}T${endTime}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => { if (!submitting.current) onClose(); }}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl"
      />

      {/* Modal Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
        className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden z-10 max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-white/10 shrink-0">
          <button 
            onClick={() => { if (!submitting.current) onClose(); }}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full text-xs font-black uppercase tracking-wider">
              {room.code || room.displayId}
            </span>
            <span className="text-slate-400 text-xs font-bold truncate max-w-[280px] sm:max-w-md">
              {room.address}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">
            {activeTab === 'viewing' ? '📅 Đặt Lịch Xem Phòng' : '🔒 Đặt Cọc Giữ Chỗ Trước'}
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm font-medium mt-1">
            {activeTab === 'viewing' 
              ? 'Lên lịch hẹn nhanh chóng, có nhân viên đón xem trực tiếp hoặc hỗ trợ Video Call 1-1.' 
              : 'Gửi yêu cầu giữ chỗ và theo dõi xác nhận từ người hỗ trợ.'}
          </p>

          {/* Switch Tabs */}
          {!isSuccess && (
            <div className="grid grid-cols-2 gap-2 mt-6 p-1 bg-slate-950/60 rounded-2xl border border-white/5">
              <button
                type="button"
                disabled={loading}
                onClick={() => { setError(''); setActiveTab('viewing'); }}
                className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'viewing'
                    ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Calendar size={16} />
                <span>Xem Phòng</span>
                <span className="hidden sm:inline text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/20">Free</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => { setError(''); setActiveTab('reservation'); }}
                className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'reservation'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <ShieldCheck size={16} />
                <span>Giữ Chỗ Trước</span>
                <span className="hidden sm:inline text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/20">Ưu tiên</span>
              </button>
            </div>
          )}
        </div>

        {/* Content Body (Scrollable) */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">
                <p className="flex items-start gap-2"><AlertCircle size={18} className="shrink-0" />{error}</p>
                <button type="button" className="mt-3 underline" onClick={() => { onClose(); navigate('/my-bookings'); }}>Kiểm tra yêu cầu của tôi</button>
              </div>}
              <fieldset disabled={loading} className="space-y-6 disabled:opacity-70">
              {/* TAB 1: VIEWING */}
              {activeTab === 'viewing' && (
                <>
                  {/* Viewing Method */}
                  <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                      <Sparkles size={14} className="text-rose-500" />
                      1. Chọn hình thức xem phòng
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setViewingMethod('direct')}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                          viewingMethod === 'direct'
                            ? 'bg-rose-500/10 border-rose-500 text-white shadow-lg shadow-rose-500/10'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-black text-sm">
                          <MapPin size={18} className={viewingMethod === 'direct' ? 'text-rose-400' : 'text-slate-500'} />
                          Xem trực tiếp
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 font-medium">Hỗ trợ viên đón tại ngõ, mở phòng xem trực tiếp</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setViewingMethod('videocall')}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                          viewingMethod === 'videocall'
                            ? 'bg-rose-500/10 border-rose-500 text-white shadow-lg shadow-rose-500/10'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-black text-sm">
                          <Video size={18} className={viewingMethod === 'videocall' ? 'text-rose-400' : 'text-slate-500'} />
                          Video Call 1-1
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 font-medium">Quay camera HD qua Zalo mọi ngóc ngách không cần đi xa</p>
                      </button>
                    </div>
                  </div>

                  {/* Viewing Date & Quick selection */}
                  <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Calendar size={14} className="text-rose-500" />
                        2. Chọn ngày muốn xem
                      </span>
                      <span className="text-rose-400 text-[10px] font-bold">Linh hoạt theo bạn</span>
                    </label>

                    {/* Quick day buttons */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Hôm nay', days: 0 },
                        { label: 'Ngày mai', days: 1 },
                        { label: 'Ngày kia', days: 2 }
                      ].map((item) => {
                        const target = new Date();
                        target.setDate(target.getDate() + item.days);
                        const str = target.toISOString().split('T')[0];
                        const isSelected = viewingDate === str;
                        return (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => setViewingDate(str)}
                            className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-white/15 border-rose-500 text-rose-400'
                                : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>

                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={viewingDate}
                      onChange={(e) => setViewingDate(e.target.value)}
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl p-3 text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                    />
                  </div>

                  {/* Time slot */}
                  <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                      <Clock size={14} className="text-rose-500" />
                      3. Khung giờ tiện nhất cho bạn
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'morning', label: '🌅 Sáng', sub: '09:00 - 11:30' },
                        { id: 'afternoon', label: '☀️ Chiều', sub: '14:00 - 17:30' },
                        { id: 'evening', label: '🌙 Tối', sub: '18:00 - 20:30' },
                        { id: 'custom', label: '⏱️ Tự chọn', sub: 'Ghi giờ riêng' },
                      ].map((slot) => (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setTimeSlot(slot.id)}
                          className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                            timeSlot === slot.id
                              ? 'bg-rose-500/10 border-rose-500 text-rose-300 shadow-md'
                              : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-300'
                          }`}
                        >
                          <div className="font-bold text-xs">{slot.label}</div>
                          <div className="text-[10px] text-slate-500 font-medium mt-0.5">{slot.sub}</div>
                        </button>
                      ))}
                    </div>

                    {timeSlot === 'custom' && (
                      <input
                        type="text"
                        placeholder="Ví dụ: 19h30 tối mai, hoặc 11h trưa..."
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        className="w-full bg-slate-950/60 border border-white/10 rounded-xl p-3 text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/50 animate-in fade-in"
                      />
                    )}
                  </div>

                  {/* Room details & Preferences */}
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Thông tin bổ sung để phục vụ chu đáo</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">Số người ở:</span>
                        <select 
                          value={peopleCount}
                          onChange={(e) => setPeopleCount(e.target.value)}
                          className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold"
                        >
                          <option value={1}>1 người</option>
                          <option value={2}>2 người</option>
                          <option value={3}>3 người</option>
                          <option value={4}>4+ người</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2 pt-4 sm:pt-6">
                        <input 
                          type="checkbox" 
                          id="vehicleCheck"
                          checked={hasVehicle}
                          onChange={(e) => setHasVehicle(e.target.checked)}
                          className="w-4 h-4 rounded text-rose-500 bg-slate-900 border-white/20 focus:ring-0 cursor-pointer"
                        />
                        <label htmlFor="vehicleCheck" className="text-xs text-slate-300 font-medium cursor-pointer">
                          Có xe máy 🛵
                        </label>
                      </div>

                      <div className="flex items-center gap-2 pt-4 sm:pt-6">
                        <input 
                          type="checkbox" 
                          id="petCheck"
                          checked={hasPet}
                          onChange={(e) => setHasPet(e.target.checked)}
                          className="w-4 h-4 rounded text-rose-500 bg-slate-900 border-white/20 focus:ring-0 cursor-pointer"
                        />
                        <label htmlFor="petCheck" className="text-xs text-slate-300 font-medium cursor-pointer">
                          Nuôi thú cưng 🐾
                        </label>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* TAB 2: RESERVATION / PRE-BOOKING */}
              {activeTab === 'reservation' && (
                <>
                  {/* Guarantee Banner */}
                  <div className="bg-emerald-500/10 border border-emerald-500/30 p-5 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-black text-sm uppercase tracking-wide">
                      <ShieldCheck size={18} />
                      Chính sách cam kết an tâm 100%
                    </div>
                    <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4 font-medium leading-relaxed">
                      <li>Khóa giữ slot phòng độc quyền trong <strong>24h - 48h</strong>, tránh việc bị người khác thuê trước.</li>
                      <li><strong>Cam kết hoàn 100% tiền cọc</strong> nếu đến xem phòng thực tế không đúng với ảnh hoặc video trên web.</li>
                      <li>Được hỗ trợ ưu tiên ký hợp đồng và nhận ngay hoàn tiền <strong>Cashback {formatCurrency(room.cashbackAmount || room.price * 0.09)}</strong>.</li>
                    </ul>
                  </div>

                  {/* Move-in Date */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                      <Calendar size={14} className="text-emerald-500" />
                      Ngày dự kiến dọn vào ở
                    </label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={moveInDate}
                      onChange={(e) => setMoveInDate(e.target.value)}
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl p-3 text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>

                  {/* Deposit Amount Option */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                      <Zap size={14} className="text-emerald-500" />
                      Mức phí giữ chỗ thiện chí
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { amount: 500000, label: '500.000₫', note: 'Giữ phòng 24 tiếng' },
                        { amount: 1000000, label: '1.000.000₫', note: 'Giữ phòng 48 tiếng' },
                      ].map((item) => (
                        <button
                          key={item.amount}
                          type="button"
                          onClick={() => setDepositAmount(item.amount)}
                          className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                            depositAmount === item.amount
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                          }`}
                        >
                          <div className="font-black text-sm">{item.label}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{item.note}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest">
                      Phương thức giữ chỗ
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('vietqr')}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          paymentMethod === 'vietqr'
                            ? 'bg-emerald-500/15 border-emerald-500 text-white'
                            : 'bg-white/5 border-white/10 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold text-xs text-emerald-400">
                          <QrCode size={16} />
                          Chuyển khoản VietQR
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">Thông tin chuyển khoản sẽ được nhân viên kiểm tra và xác nhận</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('contact_later')}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          paymentMethod === 'contact_later'
                            ? 'bg-emerald-500/15 border-emerald-500 text-white'
                            : 'bg-white/5 border-white/10 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold text-xs text-emerald-400">
                          <Phone size={16} />
                          Tư vấn viên liên hệ
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">Gọi điện hướng dẫn chuyển cọc trực tiếp</div>
                      </button>
                    </div>

                    {/* QR Code details preview if VietQR chosen */}
                    {paymentMethod === 'vietqr' && (
                      <div className="p-4 bg-slate-950/70 border border-white/10 rounded-2xl space-y-4">
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                          <div className="bg-white p-2 rounded-xl shrink-0 shadow-lg">
                            <a href={PAYMENT_ACCOUNT.originalQr} target="_blank" rel="noopener noreferrer" title="Mở mã QR gốc"><img src={vietQrUrl} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = PAYMENT_ACCOUNT.originalQr; }} alt="VietQR VPBank - TRAN MINH HIEU - 0398935034" className="w-48 h-64 object-contain" /></a>
                          </div>
                          <div className="space-y-2 text-xs text-slate-300 flex-1">
                            <div>
                              <span className="text-slate-500 block text-[10px] uppercase font-bold">Ngân hàng & Số tài khoản</span>
                              <div className="flex items-center gap-2 font-mono font-bold text-white text-sm">
                                <span>{PAYMENT_ACCOUNT.bankName}: {ACCOUNT_NO}</span>
                                <button 
                                  type="button" 
                                  onClick={() => handleCopy(ACCOUNT_NO)}
                                  className="text-slate-400 hover:text-white p-1 rounded bg-white/5"
                                >
                                  {copiedBank ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                </button>
                              </div>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px] uppercase font-bold">Chủ tài khoản:</span>
                              <span className="font-bold text-white">{ACCOUNT_NAME}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px] uppercase font-bold">Nội dung chuyển khoản:</span>
                              <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-rose-400 font-bold">{qrTransferContent}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500 italic text-center">
                          (*) Bạn có thể quét mã chuyển khoản trước hoặc nhấn Xác Nhận, nhân viên sẽ gửi lại mã này qua Zalo để kiểm tra!
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* COMMON: Contact Information */}
              <div className="border-t border-white/10 pt-5 space-y-4">
                <div className="text-[11px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                  <User size={14} className="text-rose-500" />
                  Thông tin liên hệ nhận xác nhận
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Họ và tên của bạn</label>
                    <input
                      type="text"
                      placeholder="Nguyễn Văn A"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl p-3 text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      Số điện thoại (Zalo) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="09xx xxx xxx"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl p-3 text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Ghi chú hoặc câu hỏi cho chủ phòng</label>
                  <textarea
                    rows={2}
                    placeholder="Ví dụ: Mình có 1 xe máy, muốn xem sau 18h30..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-slate-950/60 border border-white/10 rounded-xl p-3 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/50 resize-none"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider text-white shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    activeTab === 'viewing'
                      ? 'bg-gradient-to-r from-rose-500 to-orange-500 hover:shadow-rose-500/30 hover:scale-[1.01]'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-emerald-500/30 hover:scale-[1.01]'
                  } disabled:opacity-50`}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Đang gửi yêu cầu...</span>
                    </>
                  ) : activeTab === 'viewing' ? (
                    <>
                      <Calendar size={18} />
                      <span>Xác Nhận Đặt Lịch Xem Phòng (Free)</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      <span>Xác Nhận Đặt Chỗ Phòng Này</span>
                    </>
                  )}
                </button>
                <p className="text-center text-[10px] text-slate-500 mt-2 font-medium">
                  Sau khi gửi, bạn sẽ nhận được mã yêu cầu và có thể theo dõi trạng thái xác nhận.
                </p>
              </div>
              </fieldset>
            </form>
          ) : (
            /* SUCCESS VIEW */
            <div role="status" aria-live="polite" className="py-6 text-center space-y-6 animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30 shadow-2xl shadow-emerald-500/20">
                <CheckCircle2 size={44} />
              </div>

              <div className="space-y-2">
                <h3 ref={successHeading} tabIndex={-1} className="text-2xl font-normal text-white tracking-tight outline-none">
                  {activeTab === 'viewing' ? 'Đã gửi yêu cầu xem phòng thành công' : 'Đã gửi yêu cầu giữ chỗ thành công'}
                </h3>
                <p className="text-slate-300 text-sm max-w-md mx-auto leading-relaxed">
                  Cảm ơn bạn <strong className="text-white">{customerName || 'bạn'}</strong>! Hệ thống đã ghi nhận yêu cầu cho phòng <strong className="text-rose-400">{room.code || room.displayId}</strong>.
                </p>
              </div>

              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Yêu cầu đang chờ hỗ trợ viên xác nhận. Bạn có thể theo dõi tiến trình trong Lịch hẹn & đặt chỗ của tôi.
              </p>
              {activeTab === 'reservation' && <p className="text-sm text-amber-400 max-w-md mx-auto">
                {submittedLead?.paymentStatus === 'paid' ? 'Thanh toán đã được xác nhận.' : 'Thanh toán chưa được xác nhận. Gửi yêu cầu không đồng nghĩa đã nhận tiền cọc hoặc đã giữ phòng.'}
              </p>}
              {/* Summary Card */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left max-w-md mx-auto space-y-3">
                <div className="flex justify-between gap-4 text-xs"><span className="text-slate-400">Mã yêu cầu:</span><span className="text-white break-all">{submittedLead?._id}</span></div>
                <div className="flex justify-between gap-4 text-xs"><span className="text-slate-400">Trạng thái:</span><span className="text-amber-400">{bookingStatusLabel(submittedLead)}</span></div>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-white/5">
                  <span className="text-slate-400">Hình thức:</span>
                  <span className="font-bold text-white">
                    {activeTab === 'viewing' 
                      ? (viewingMethod === 'direct' ? '🚶 Xem trực tiếp tại phòng' : '📹 Video call 1-1') 
                      : '🔒 Giữ chỗ thiện chí'}
                  </span>
                </div>
                {activeTab === 'viewing' && (
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-white/5">
                    <span className="text-slate-400">Thời gian hẹn:</span>
                    <span className="font-bold text-rose-400">{viewingDate} • {getSlotLabel(timeSlot)}</span>
                  </div>
                )}
                {activeTab === 'reservation' && (
                  <>
                    <div className="flex justify-between items-center text-xs pb-2 border-b border-white/5">
                      <span className="text-slate-400">Dự kiến dọn vào:</span>
                      <span className="font-bold text-white">{moveInDate}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs pb-2 border-b border-white/5">
                      <span className="text-slate-400">Phí giữ chỗ:</span>
                      <span className="font-bold text-emerald-400">{formatCurrency(depositAmount)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">SĐT nhận liên hệ:</span>
                  <span className="font-bold text-white">{customerPhone}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                {activeTab === 'viewing' && (
                  <a
                    href={createGoogleCalendarUrl()}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-white/10"
                  >
                    <Calendar size={16} className="text-rose-400" />
                    <span>Lưu vào Google Calendar</span>
                  </a>
                )}

                <button type="button" onClick={onClose} className="flex-1 py-3 px-4 rounded-xl bg-white/10 text-white text-sm border border-white/10">
                  Đóng và tiếp tục xem phòng
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/my-bookings');
                  }}
                  className="w-full rounded-xl bg-rose-500 px-4 py-3 text-sm text-white cursor-pointer"
                >
                  Xem yêu cầu của tôi →
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default BookingModal;
