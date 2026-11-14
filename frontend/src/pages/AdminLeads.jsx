import React, { useState, useEffect } from 'react';
import { leadService } from '../services/api';
import { 
  Clock, Phone, Home, MessageSquare, CheckCircle, XCircle, AlertCircle, 
  Loader2, Calendar, Trash2, ExternalLink, User, Mail, Sparkles, 
  ShieldCheck, Video, MapPin, Zap, MessageCircle, Save, Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const AdminLeads = () => {
    const { user: currentUser } = useAuth();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'viewing' | 'reservation'
    const [statusFilter, setStatusFilter] = useState('all');
    const [adminNotes, setAdminNotes] = useState({});
    const [savingNoteId, setSavingNoteId] = useState(null);
    const [savedNoteId, setSavedNoteId] = useState(null);

    const fetchLeads = async () => {
        try {
            const res = await leadService.getAllLeads();
            setLeads(res.data || []);
            // Initialize admin notes
            const notesMap = {};
            (res.data || []).forEach(l => {
                notesMap[l._id] = l.adminNote || '';
            });
            setAdminNotes(notesMap);
        } catch (error) {
            console.error("Error fetching leads:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();

        // Realtime refresh
        const socketUrl = import.meta.env.MODE === 'development' ? "http://localhost:3000" : window.location.origin;
        const socket = io(socketUrl, {
            query: { userId: currentUser?._id }
        });

        socket.on('leadCountUpdate', () => {
            fetchLeads();
        });

        return () => socket.disconnect();
    }, [currentUser]);

    const handleStatusUpdate = async (id, status) => {
        try {
            await leadService.updateStatus(id, status);
            setLeads(prev => prev.map(l => l._id === id ? { ...l, status } : l));
        } catch (error) {
            console.error("Error updating lead status:", error);
            alert("Lỗi khi cập nhật trạng thái");
        }
    };

    const handleSaveAdminNote = async (id) => {
        setSavingNoteId(id);
        try {
            const noteText = adminNotes[id] || '';
            await leadService.updateStatus(id, undefined, undefined, noteText);
            setSavedNoteId(id);
            setTimeout(() => setSavedNoteId(null), 2000);
        } catch (error) {
            console.error("Error saving note:", error);
            alert("Lỗi khi lưu ghi chú");
        } finally {
            setSavingNoteId(null);
        }
    };

    const handleDeleteLead = async (id) => {
        if (window.confirm("Bạn có chắc muốn xóa yêu cầu này?")) {
            try {
                await leadService.delete(id);
                setLeads(prev => prev.filter(l => l._id !== id));
            } catch (error) {
                console.error("Error deleting lead:", error);
                alert("Lỗi khi xóa yêu cầu");
            }
        }
    };

    const formatCurrency = (val) => Number(val || 0).toLocaleString('vi-VN') + '₫';

    // Status mapping
    const statusBadges = {
        pending: { label: 'Đang chờ', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
        contacted: { label: 'Đã liên hệ', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
        confirmed: { label: 'Đã chốt giờ / Đã cọc', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
        contracted: { label: 'Đã ký HĐ', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
        completed: { label: 'Đã hoàn tiền', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
        cancelled: { label: 'Đã hủy', color: 'bg-slate-700/50 text-slate-400 border-slate-600' }
    };

    // Filtered list
    const filteredLeads = leads.filter(l => {
        if (activeTab === 'viewing' && l.type === 'reservation') return false;
        if (activeTab === 'reservation' && l.type !== 'reservation') return false;
        if (statusFilter !== 'all' && l.status !== statusFilter) return false;
        return true;
    });

    const pendingCount = leads.filter(l => l.status === 'pending').length;
    const viewingCount = leads.filter(l => l.type === 'viewing' || !l.type).length;
    const reservationCount = leads.filter(l => l.type === 'reservation').length;

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="animate-spin text-rose-500" size={40} />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Đang tải danh sách yêu cầu...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Quản Lý Lịch Hẹn & Đặt Chỗ</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Theo dõi yêu cầu xem phòng (trực tiếp/video call), yêu cầu cọc giữ chỗ và chăm sóc khách hàng.
                    </p>
                </div>

                {/* Counters */}
                <div className="flex items-center gap-3 bg-white/5 p-4 px-6 rounded-2xl border border-white/10 shrink-0">
                    <div className="text-center">
                        <div className="text-2xl font-black text-rose-500">{pendingCount}</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Đang chờ</div>
                    </div>
                    <div className="h-8 w-px bg-white/10 mx-2" />
                    <div className="text-center">
                        <div className="text-2xl font-black text-white">{leads.length}</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tổng cộng</div>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Tab selector */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto">
                    {[
                        { id: 'all', label: 'Tất cả', count: leads.length },
                        { id: 'viewing', label: '📅 Xem phòng', count: viewingCount },
                        { id: 'reservation', label: '🔒 Đặt cọc giữ chỗ', count: reservationCount }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 border ${
                                activeTab === tab.id
                                    ? 'bg-white text-slate-950 border-white shadow-lg'
                                    : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            <span>{tab.label}</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                activeTab === tab.id ? 'bg-slate-900 text-white' : 'bg-white/10 text-slate-300'
                            }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Status Dropdown Filter */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs text-slate-400 font-bold whitespace-nowrap">Trạng thái:</span>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="pending">Chờ xử lý (Pending)</option>
                        <option value="contacted">Đã liên hệ (Contacted)</option>
                        <option value="confirmed">Đã chốt giờ / Đã cọc (Confirmed)</option>
                        <option value="contracted">Đã ký HĐ (Contracted)</option>
                        <option value="completed">Đã hoàn tiền (Completed)</option>
                        <option value="cancelled">Đã hủy (Cancelled)</option>
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 gap-6">
                {filteredLeads.length === 0 ? (
                    <div className="bg-slate-900/40 rounded-[2.5rem] p-16 text-center border border-white/5 border-dashed space-y-3">
                        <AlertCircle className="mx-auto text-slate-700" size={40} />
                        <p className="text-slate-400 font-bold">Không tìm thấy yêu cầu nào phù hợp với bộ lọc.</p>
                    </div>
                ) : (
                    filteredLeads.map((lead) => {
                        const isReservation = lead.type === 'reservation';
                        const status = statusBadges[lead.status] || statusBadges.pending;
                        const cleanPhone = lead.customerPhone ? lead.customerPhone.replace(/\D/g, '') : '';

                        return (
                            <div 
                                key={lead._id} 
                                className={`group relative bg-slate-900/70 border transition-all duration-300 rounded-[2.5rem] p-6 sm:p-8 flex flex-col gap-6 backdrop-blur-xl ${
                                    lead.status === 'pending' 
                                        ? 'border-rose-500/30 shadow-xl shadow-rose-500/5' 
                                        : 'border-white/5 hover:border-white/10'
                                }`}
                            >
                                {/* Top Badge Row */}
                                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/5">
                                    <div className="flex items-center gap-2.5">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 ${
                                            isReservation
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                        }`}>
                                            {isReservation ? <ShieldCheck size={14} /> : <Calendar size={14} />}
                                            {isReservation ? 'ĐẶT CỌC GIỮ CHỖ' : 'HẸN XEM PHÒNG'}
                                        </span>

                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${status.color}`}>
                                            {status.label}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                                        <Clock size={14} />
                                        <span>Gửi lúc: {new Date(lead.createdAt).toLocaleString('vi-VN')}</span>
                                    </div>
                                </div>

                                {/* Body Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                    {/* Room Info (col 1-4) */}
                                    <div className="lg:col-span-4 space-y-3 bg-white/5 p-5 rounded-2xl border border-white/5">
                                        <div className="flex items-center justify-between">
                                            <Link 
                                                to={`/room/${lead.roomId?._id}`} 
                                                className="inline-flex items-center gap-2 text-rose-400 hover:text-rose-300 transition-colors font-black text-sm uppercase tracking-wider"
                                            >
                                                <Home size={16} />
                                                <span>Mã: {lead.roomId?.code || lead.roomId?.displayId || 'N/A'}</span>
                                                <ExternalLink size={12} />
                                            </Link>

                                            {lead.roomId?.cashbackAmount > 0 && (
                                                <span className="text-[10px] font-black text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded">
                                                    Hoàn: {formatCurrency(lead.roomId.cashbackAmount)}
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-xs text-slate-300 font-bold line-clamp-2">
                                            {lead.roomId?.address || 'Địa chỉ phòng'}
                                        </p>

                                        <div className="text-xs text-slate-400 font-medium">
                                            Giá thuê: <strong className="text-white font-black">{formatCurrency(lead.roomId?.price)}/tháng</strong>
                                        </div>

                                        {lead.userId && (
                                            <div className="pt-2 border-t border-white/5 text-[11px] text-slate-400 flex items-center justify-between">
                                                <span>Tài khoản: <strong className="text-white">{lead.userId.username}</strong></span>
                                                <span className="text-slate-500 truncate max-w-[120px]">{lead.userId.email}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Lead details (col 5-8) */}
                                    <div className="lg:col-span-8 space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                                            {/* Customer Name & Phone */}
                                            <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1">
                                                <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Khách hàng & SĐT</span>
                                                <div className="font-bold text-white text-sm truncate">{lead.customerName || 'Khách'}</div>
                                                <div className="font-mono font-black text-emerald-400 text-sm">{lead.customerPhone}</div>
                                            </div>

                                            {/* Details for Viewing */}
                                            {!isReservation ? (
                                                <>
                                                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1">
                                                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Hình thức xem</span>
                                                        <div className="font-bold text-white flex items-center gap-1.5">
                                                            {lead.viewingMethod === 'videocall' ? (
                                                                <>
                                                                    <Video size={16} className="text-rose-400" />
                                                                    <span>Video Call 1-1</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <MapPin size={16} className="text-rose-400" />
                                                                    <span>Xem trực tiếp</span>
                                                                </>
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400">{lead.peopleCount || 1} người {lead.hasVehicle && '• 🛵 Có xe'}</div>
                                                    </div>

                                                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1">
                                                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Lịch hẹn</span>
                                                        <div className="font-bold text-rose-300 text-xs">{lead.appointment || lead.viewingDate || 'Sớm nhất'}</div>
                                                        {lead.timeSlot && <div className="text-[10px] text-slate-400">{lead.timeSlot}</div>}
                                                    </div>
                                                </>
                                            ) : (
                                                /* Details for Reservation */
                                                <>
                                                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1">
                                                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Tiền cọc giữ chỗ</span>
                                                        <div className="font-black text-emerald-400 text-sm">
                                                            {formatCurrency(lead.depositAmount || 500000)}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400">
                                                            PT: {lead.paymentMethod === 'vietqr' ? 'Chuyển khoản VietQR' : 'Liên hệ chuyển sau'}
                                                        </div>
                                                    </div>

                                                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1">
                                                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Dự kiến dọn vào</span>
                                                        <div className="font-bold text-white text-xs">{lead.moveInDate || 'Chưa rõ'}</div>
                                                        {lead.holdExpiresAt && (
                                                            <div className="text-[10px] text-amber-400">
                                                                Hạn giữ: {new Date(lead.holdExpiresAt).toLocaleDateString('vi-VN')}
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Customer Note */}
                                        {lead.note && (
                                            <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs">
                                                <span className="text-[10px] uppercase font-bold text-slate-500">Khách ghi chú: </span>
                                                <span className="text-slate-300 italic">{lead.note}</span>
                                            </div>
                                        )}

                                        {/* Admin Internal Note Editor */}
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                placeholder="Ghi chú nội bộ Admin (VD: Đã gọi hẹn chiều thứ 7, đi cùng bạn...)"
                                                value={adminNotes[lead._id] ?? ''}
                                                onChange={(e) => setAdminNotes({ ...adminNotes, [lead._id]: e.target.value })}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSaveAdminNote(lead._id)}
                                                className="flex-1 bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleSaveAdminNote(lead._id)}
                                                disabled={savingNoteId === lead._id}
                                                className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                                            >
                                                {savedNoteId === lead._id ? (
                                                    <Check size={14} className="text-emerald-400" />
                                                ) : savingNoteId === lead._id ? (
                                                    <Loader2 size={14} className="animate-spin" />
                                                ) : (
                                                    <Save size={14} />
                                                )}
                                                <span>Lưu</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Row */}
                                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/5">
                                    {/* Direct Contact Buttons */}
                                    <div className="flex items-center gap-2">
                                        {cleanPhone && (
                                            <>
                                                <a
                                                    href={`https://zalo.me/${cleanPhone}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-blue-600/20"
                                                >
                                                    <MessageCircle size={14} />
                                                    <span>Chat Zalo</span>
                                                </a>

                                                <a
                                                    href={`tel:${cleanPhone}`}
                                                    className="inline-flex items-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/20 text-xs font-bold transition-all"
                                                >
                                                    <Phone size={14} />
                                                    <span>Gọi {cleanPhone}</span>
                                                </a>
                                            </>
                                        )}
                                    </div>

                                    {/* Status Change Buttons */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            onClick={() => handleStatusUpdate(lead._id, 'contacted')}
                                            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                lead.status === 'contacted'
                                                    ? 'bg-blue-600 text-white shadow-md'
                                                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                                            }`}
                                        >
                                            Đã gọi/liên hệ
                                        </button>

                                        <button
                                            onClick={() => handleStatusUpdate(lead._id, 'confirmed')}
                                            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                lead.status === 'confirmed'
                                                    ? 'bg-amber-600 text-white shadow-md'
                                                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                                            }`}
                                        >
                                            {isReservation ? 'Đã nhận cọc' : 'Đã chốt giờ xem'}
                                        </button>

                                        <button
                                            onClick={() => handleStatusUpdate(lead._id, 'contracted')}
                                            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                lead.status === 'contracted'
                                                    ? 'bg-purple-600 text-white shadow-md'
                                                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                                            }`}
                                        >
                                            Đã ký HĐ
                                        </button>

                                        <button
                                            onClick={() => handleStatusUpdate(lead._id, 'completed')}
                                            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                lead.status === 'completed'
                                                    ? 'bg-emerald-600 text-white shadow-md'
                                                    : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                            }`}
                                        >
                                            Hoàn tất (Trả Cashback)
                                        </button>

                                        <button
                                            onClick={() => handleDeleteLead(lead._id)}
                                            className="p-2 rounded-xl bg-white/5 hover:bg-rose-600 text-slate-500 hover:text-white transition-all cursor-pointer"
                                            title="Xóa yêu cầu"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default AdminLeads;
