import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { roomService, leadService } from '../services/api';
import { MapPin, Zap, Info, ChevronLeft, CheckCircle2, AlertCircle, Phone, MessageCircle, User, Loader2, RefreshCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const RoomDetail = () => {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [statusLoading, setStatusLoading] = useState(false);
  
  // Booking flow states
  const [bookingStep, setBookingStep] = useState('idle'); // idle, form, waiting, finished
  const [customerPhone, setCustomerPhone] = useState('');
  const [appointment, setAppointment] = useState('');
  
  const { isAdmin, isAuthenticated } = useAuth();
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
        } catch (error) {
          console.error("Error fetching lead:", error);
        }
      }
    };

    fetchRoom();
    fetchLead();
  }, [id, isAuthenticated]);

  const handleStatusToggle = async () => {
    if (!room) return;
    setStatusLoading(true);
    const newStatus = room.status === 'available' ? 'rented' : 'available';
    try {
      const res = await roomService.updateStatus(id, newStatus);
      setRoom({ ...room, status: res.data.room.status });
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Có lỗi xảy ra khi cập nhật trạng thái");
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-32 text-center text-slate-500 font-black text-2xl uppercase tracking-[0.2em] animate-pulse">Đang tải thông tin...</div>;
  if (!room) return <div className="max-w-7xl mx-auto px-4 py-32 text-center bg-slate-900/40 rounded-[3rem] border border-white/5 text-slate-500">Phòng không tồn tại hoặc đã bị xóa.</div>;

  const formatCurrency = (val) => val?.toLocaleString('vi-VN') + '₫';

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!customerPhone) return;
    setBookingStep('waiting');
    
    try {
      await leadService.createOrUpdate({
        roomId: id,
        customerPhone,
        appointment
      });
      
      // Simulate delay for user experience as requested
      setTimeout(() => {
        setBookingStep('finished');
      }, 2000);
    } catch (error) {
      console.error("Error saving lead:", error);
      alert("Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại.");
      setBookingStep('form');
    }
  };

  return (
    <div className="space-y-16 animate-in fade-in duration-700">
      <Link to="/" className="inline-flex items-center gap-3 text-slate-500 hover:text-white transition-all font-bold group cursor-pointer">
        <div className="p-2 rounded-full bg-white/5 group-hover:bg-rose-500 transition-colors">
          <ChevronLeft size={18} />
        </div>
        Quay lại trang chủ
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
        {/* Left Column: Images & Info */}
        <div className="lg:col-span-8 space-y-16">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[3rem] aspect-video group relative shadow-3xl shadow-black/50 border border-white/5 bg-slate-900">
              <img 
                src={room.images?.[activeImage] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop'} 
                className="w-full h-full object-cover transition-transform duration-1000" 
                alt="Phòng trọ" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
              
              {room.status === 'rented' && (
                <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                  <span className="bg-slate-950/80 text-rose-500 text-sm font-black px-8 py-4 rounded-full border border-rose-500/30 uppercase tracking-[0.4em] shadow-2xl backdrop-blur-md">
                    Hết phòng
                  </span>
                </div>
              )}
            </div>

            {/* Gallery Thumbnails */}
            {room.images?.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {room.images.map((img, i) => (
                  <button 
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`relative w-24 h-24 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${activeImage === i ? 'border-rose-500 scale-105' : 'border-white/5 hover:border-white/20'}`}
                  >
                    <img src={img} className="w-full h-full object-cover" alt={`View ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-10">
            <div className="flex flex-wrap items-center gap-4">
              <span className="bg-rose-500 text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-[0.2em] shadow-lg shadow-rose-500/20">
                Mã: {room.code}{room.roomNumber ? ` - ${room.roomNumber}` : ''}
              </span>
              <span className={`text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-[0.2em] border ${room.status === 'available' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                Trạng thái: {room.status === 'available' ? 'Còn phòng' : 'Đã cho thuê'}
              </span>
              {room.availability && (
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-[0.2em]">
                  {room.availability}
                </span>
              )}
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight">{room.address}</h1>
              
              {isAdmin && (
                <button 
                  onClick={handleStatusToggle}
                  disabled={statusLoading}
                  className={`flex-shrink-0 flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-sm uppercase transition-all active:scale-95 cursor-pointer ${room.status === 'available' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white'}`}
                >
                  {statusLoading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCcw size={18} />}
                  {room.status === 'available' ? 'Đánh dấu Hết phòng' : 'Mở lại Còn phòng'}
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-slate-400 font-medium">
              <div className="p-2.5 rounded-2xl bg-rose-500/10">
                <MapPin size={24} className="text-rose-500" />
              </div>
              <span className="text-xl">{room.address}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-8">
                {/* Services */}
                <div className="space-y-8">
                    <h3 className="text-2xl font-black text-white flex items-center gap-4">
                        <div className="w-2 h-8 bg-rose-500 rounded-full"></div>
                        Bảng giá dịch vụ
                    </h3>
                    <div className="space-y-4">
                        {Object.entries(room.services || {}).map(([key, value]) => (
                            value && (
                                <div key={key} className="bg-slate-900/40 p-6 rounded-[2rem] border border-white/5 hover:border-emerald-500/20 transition-all duration-300 group w-full">
                                    <div className="space-y-4">
                                        {value.split(/[;]/).map((part, index) => {
                                            const trimmed = part.trim();
                                            if (!trimmed) return null;
                                            return (
                                                <div key={index} className="flex items-start gap-4 animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                                                    <div className="p-1.5 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500 transition-colors mt-0.5 shrink-0">
                                                        <CheckCircle2 className="text-emerald-500 group-hover:text-white" size={14} />
                                                    </div>
                                                    <div className="text-slate-300 font-bold leading-tight">
                                                        {trimmed.includes(':') ? (
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="text-slate-500 text-[10px] uppercase font-black tracking-widest leading-none">
                                                                    {trimmed.split(':')[0].trim()}:
                                                                </span>
                                                                <span className="text-white text-base">
                                                                    {trimmed.split(':')[1].trim()}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-white text-base">{trimmed}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )
                        ))}
                    </div>
                </div>

                {/* Notes */}
                <div className="space-y-8">
                    <h3 className="text-2xl font-black text-white flex items-center gap-4">
                        <div className="w-2 h-8 bg-orange-500 rounded-full"></div>
                        Lưu ý thuê phòng
                    </h3>
                    <div className="space-y-5">
                        {room.notes?.map((note, index) => (
                            <div key={index} className="flex items-start gap-4 text-slate-400 group">
                                <AlertCircle size={20} className="text-orange-500/50 group-hover:text-orange-500 mt-1 shrink-0 transition-colors" />
                                <span className="text-lg font-medium leading-relaxed">{note}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="pt-10 border-t border-white/5 space-y-10">
                <div className="space-y-8">
                    <h3 className="text-2xl font-black text-white flex items-center gap-4">
                        <Info size={24} className="text-rose-500" />
                        Nội thất & Tiện ích
                    </h3>
                    
                    {room.amenities?.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {room.amenities.map((item, index) => (
                                <div key={index} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center gap-3 group hover:border-rose-500/30 transition-all">
                                    <div className="bg-rose-500/10 p-2 rounded-xl group-hover:bg-rose-500 transition-colors">
                                        <CheckCircle2 size={16} className="text-rose-500 group-hover:text-white" />
                                    </div>
                                    <span className="text-slate-300 font-bold text-sm tracking-tight">{item}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 italic font-medium">Chưa cập nhật thông tin nội thất.</p>
                    )}
                </div>

                <div className="space-y-6">
                    <h3 className="text-xl font-black text-white flex items-center gap-4">
                        <div className="w-1.5 h-6 bg-slate-500 rounded-full"></div>
                        Thông tin bổ sung
                    </h3>
                    <p className="text-lg text-slate-400 whitespace-pre-line leading-relaxed font-medium">
                        {room.description || "Không có mô tả chi tiết."}
                    </p>
                </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing & Refund Card */}
        <div className="lg:col-span-4 self-start">
          <div className="sticky top-28 bg-slate-900/60 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/10 space-y-10 shadow-3xl shadow-black/80">
            <div className="space-y-3">
              <span className="text-slate-500 text-xs font-black uppercase tracking-[0.2em]">Giá thuê trọn gói</span>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-black text-rose-500 tracking-tighter">{(room.price / 1000000).toFixed(1)}tr</span>
                <span className="text-xl font-bold text-slate-500">vnđ / tháng</span>
              </div>
            </div>

            <div className="bg-emerald-500 p-8 rounded-[2.5rem] space-y-6 shadow-2xl shadow-emerald-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                 <Zap size={120} fill="white" />
              </div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="bg-white/30 backdrop-blur-md p-3 rounded-2xl">
                    <Zap size={24} className="text-white" fill="white" />
                </div>
                <div>
                   <h4 className="text-white font-black text-xl uppercase tracking-tighter leading-none">Ưu đãi hoàn tiền 9%</h4>
                   <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mt-1">Special Affiliate Gift</p>
                </div>
              </div>
              <div className="relative z-10 space-y-1">
                <p className="text-white/80 text-sm font-bold">Số tiền mặt bạn sẽ nhận lại:</p>
                <div className="text-4xl font-black text-white tracking-tighter">{formatCurrency(room.cashbackAmount)}</div>
              </div>
              <p className="relative z-10 text-[11px] text-white/70 leading-relaxed font-medium">(*) Khoản tiền này sẽ được trao ngay cho bạn bằng tiền mặt hoặc chuyển khoản ngay khi bạn ký xong biên bản thuê phòng qua hệ thống.</p>
            </div>

            <div className="space-y-4 pt-4">
              <button className="w-full bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-black py-5 rounded-[2rem] transition-all shadow-2xl shadow-rose-500/25 flex items-center justify-center gap-3 text-lg cursor-pointer">
                <MessageCircle size={22} fill="white" />
                Messenger Tư Vấn
              </button>

              {bookingStep === 'idle' && (
                <button 
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate('/login', { state: { from: location.pathname } });
                    } else {
                      setBookingStep('form');
                    }
                  }}
                  className="w-full bg-white/5 hover:bg-white/10 active:scale-95 text-white font-black py-5 rounded-[2rem] border border-white/10 transition-all flex items-center justify-center gap-3 text-lg cursor-pointer"
                >
                  <Phone size={22} className="text-emerald-500" fill="currentColor" />
                  Đặt lịch xem phòng
                </button>
              )}

              {bookingStep === 'form' && (
                <form onSubmit={handleBooking} className="bg-white/5 p-6 rounded-[2rem] border border-white/10 space-y-4 animate-in fade-in zoom-in duration-300">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-2">Số điện thoại của bạn</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="09xx xxx xxx"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-slate-950/50 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-2">Thời gian xem phòng</label>
                    <input 
                      type="text" 
                      placeholder="Ví dụ: 18h tối mai"
                      value={appointment}
                      onChange={(e) => setAppointment(e.target.value)}
                      className="w-full bg-slate-950/50 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all font-bold"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-emerald-500/20 cursor-pointer"
                  >
                    Xác nhận đặt lịch
                  </button>
                </form>
              )}

              {bookingStep === 'waiting' && (
                <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 flex flex-col items-center justify-center gap-4 py-12 animate-pulse">
                  <Loader2 className="animate-spin text-rose-500" size={32} />
                  <p className="text-white font-black uppercase text-xs tracking-widest">Đợi tí nha...</p>
                </div>
              )}

              {bookingStep === 'finished' && (
                <div className="space-y-4 animate-in slide-in-from-bottom duration-500">
                  <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-[2rem] rounded-bl-none border border-emerald-500/30 shadow-2xl relative">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
                        <User size={14} className="text-white" />
                      </div>
                      <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Hỗ trợ tìm phòng</span>
                    </div>
                    <p className="text-slate-200 font-bold leading-relaxed text-sm">
                      Chào bạn, mình đã nhận được yêu cầu xem phòng từ số điện thoại **{customerPhone}**. 🌹
                    </p>
                    <p className="text-white font-black text-sm mt-3 leading-relaxed">
                      Chúng tôi đã ghi nhận lịch hẹn của bạn ({appointment}). Hỗ trợ viên sẽ sớm nhắn số điện thoại chủ qua Zalo cho bạn nhé!
                    </p>
                    <div className="mt-6 flex flex-col gap-3">
                      <button 
                        onClick={() => setBookingStep('form')}
                        className="w-full bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase py-4 rounded-xl border border-white/10 transition-all tracking-widest cursor-pointer"
                      >
                        Chỉnh sửa thông tin
                      </button>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setBookingStep('idle')}
                    className="w-full text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors py-2 cursor-pointer"
                  >
                    Hoàn tất
                  </button>
                </div>
              )}
            </div>

            <div className="pt-8 border-t border-white/5 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                   <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center">
                      <User size={12} className="text-slate-500" />
                   </div>
                   <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Hieu Affiliate Team</span>
                </div>
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Hanoi Rental Expert 2026</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetail;
