import React, { useState, useEffect } from 'react';
import { leadService } from '../services/api';
import { Clock, Phone, Home, MessageSquare, CheckCircle, XCircle, AlertCircle, Loader2, Calendar, Trash2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminLeads = () => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeads = async () => {
            try {
                const res = await leadService.getAllLeads();
                setLeads(res.data);
            } catch (error) {
                console.error("Error fetching leads:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLeads();
    }, []);

    const handleStatusUpdate = async (id, status) => {
        try {
            await leadService.updateStatus(id, status);
            // Refresh local state
            setLeads(prev => prev.map(l => l._id === id ? { ...l, status } : l));
        } catch (error) {
            console.error("Error updating lead status:", error);
        }
    };

    const handleDeleteLead = async (id) => {
        if (window.confirm("Bạn có chắc muốn xóa thông báo này?")) {
            try {
                await leadService.delete(id);
                setLeads(prev => prev.filter(l => l._id !== id));
            } catch (error) {
                console.error("Error deleting lead:", error);
                alert("Lỗi khi xóa thông báo");
            }
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="animate-spin text-rose-500" size={40} />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Đang tải danh sách yêu cầu...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 py-12 space-y-12 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight">Yêu cầu xem phòng</h1>
                    <p className="text-slate-500 font-medium mt-2">Quản lý các cuộc hẹn và khách hàng tiềm năng</p>
                </div>
                <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/5 shadow-2xl">
                    <div className="text-center">
                        <div className="text-2xl font-black text-rose-500">{leads.filter(l => l.status === 'pending').length}</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Đang chờ</div>
                    </div>
                    <div className="h-8 w-px bg-white/10 mx-2"></div>
                    <div className="text-center">
                        <div className="text-2xl font-black text-white">{leads.length}</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tổng cộng</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {leads.length === 0 ? (
                    <div className="bg-slate-900/40 rounded-[3rem] p-20 text-center border border-white/5 border-dashed">
                        <AlertCircle className="mx-auto text-slate-700 mb-4" size={48} />
                        <p className="text-slate-500 font-bold">Chưa có yêu cầu đặt lịch nào.</p>
                    </div>
                ) : (
                    leads.map((lead) => (
                        <div 
                            key={lead._id} 
                            className={`group relative bg-slate-900/40 border transition-all duration-300 rounded-[2.5rem] p-8 flex flex-col lg:flex-row lg:items-center gap-8 ${lead.status === 'pending' ? 'border-rose-500/20 shadow-lg shadow-rose-500/5' : 'border-white/5 hover:border-white/10'}`}
                        >
                            {/* Room Info */}
                            <div className="flex-shrink-0 lg:w-48 space-y-2">
                                <Link 
                                    to={`/room/${lead.roomId?._id}`} 
                                    className="flex items-center gap-2 text-rose-500 hover:text-rose-400 transition-colors cursor-pointer group/link"
                                >
                                    <Home size={16} />
                                    <span className="text-sm font-black uppercase tracking-widest">Mã: {lead.roomId?.code || 'N/A'}</span>
                                    <ExternalLink size={12} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                </Link>
                                <p className="text-xs text-slate-400 font-bold line-clamp-2">{lead.roomId?.address}</p>
                            </div>

                            <div className="h-12 w-px bg-white/5 hidden lg:block mx-4"></div>

                            {/* Customer Info */}
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                                            <Phone size={18} className="text-emerald-500" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Khách hàng</div>
                                            <div className="text-lg font-black text-white">{lead.customerPhone}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                                            <Calendar size={18} className="text-amber-500" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lịch hẹn</div>
                                            <div className="text-sm font-bold text-slate-200">{lead.appointment}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-slate-500">
                                        <Clock size={16} />
                                        <span className="text-xs font-medium">Đặt lúc: {new Date(lead.createdAt).toLocaleString('vi-VN')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            lead.status === 'pending' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                                            lead.status === 'contacted' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                            'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                        }`}>
                                            {lead.status === 'pending' ? 'Đang chờ' : 
                                             lead.status === 'contacted' ? 'Đã liên hệ' : 
                                             lead.status === 'viewing' ? 'Đang xem phòng' : 'Đã ký HĐ'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 shrink-0 lg:ml-auto">
                                <button 
                                    onClick={() => handleStatusUpdate(lead._id, 'contacted')}
                                    className="p-3 bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-white rounded-2xl transition-all shadow-lg"
                                    title="Đã liên hệ sơ bộ"
                                >
                                    <MessageSquare size={20} />
                                </button>
                                <button 
                                    onClick={() => handleStatusUpdate(lead._id, 'viewing')}
                                    className="p-3 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-2xl transition-all shadow-lg"
                                    title="Xác nhận khách đang xem phòng"
                                >
                                    <CheckCircle size={20} />
                                </button>
                                <button 
                                    onClick={() => handleStatusUpdate(lead._id, 'cancelled')}
                                    className="p-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-2xl transition-all shadow-lg cursor-pointer"
                                    title="Hủy yêu cầu"
                                >
                                    <XCircle size={20} />
                                </button>
                                
                                <div className="w-px h-8 bg-white/5 mx-1 hidden lg:block"></div>

                                <button 
                                    onClick={() => handleDeleteLead(lead._id)}
                                    className="p-3 bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white rounded-2xl transition-all cursor-pointer"
                                    title="Xóa thông báo"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminLeads;
