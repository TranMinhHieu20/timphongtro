import React, { useState, useEffect } from 'react';
import { roomService } from '../services/api';
import { Edit2, Trash2, Home, CheckCircle, XCircle, Search, Plus, MapPin, ExternalLink, Loader2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const AdminRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit Modal State
  const [editingRoom, setEditingRoom] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await roomService.getAll();
      setRooms(res.data);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, code) => {
    if (window.confirm(`Bạn có chắc muốn xóa phòng ${code} vĩnh viễn không?`)) {
      try {
        await roomService.delete(id);
        setRooms(prev => prev.filter(r => r._id !== id));
      } catch (error) {
        alert("Lỗi khi xóa phòng: " + error.message);
      }
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'available' ? 'rented' : 'available';
    try {
      await roomService.updateStatus(id, newStatus);
      setRooms(prev => prev.map(r => r._id === id ? { ...r, status: newStatus } : r));
    } catch (error) {
      alert("Lỗi khi cập nhật trạng thái");
    }
  };

  const openEditModal = (room) => {
    setEditingRoom(room);
    setEditFormData({
      price: room.price,
      address: room.address,
      description: room.description,
      availability: room.availability,
      roomNumber: room.roomNumber,
      contactPhone: room.contactPhone
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await roomService.update(editingRoom._id, editFormData);
      setRooms(prev => prev.map(r => r._id === editingRoom._id ? res.data.room : r));
      setEditingRoom(null);
    } catch (error) {
      alert("Lỗi khi lưu thông tin: " + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const filteredRooms = rooms.filter(r => 
    r.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <Loader2 className="animate-spin text-rose-500" size={40} />
      <p className="text-slate-500 font-black uppercase tracking-widest animate-pulse">Đang tải danh sách phòng...</p>
    </div>
  );

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
           <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">Quản lý phòng đã đăng</h2>
           <p className="text-slate-500 font-medium">Bạn đang quản lý <span className="text-rose-400 font-bold">{rooms.length}</span> phòng trên hệ thống</p>
        </div>
        <div className="flex gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Tìm mã hoặc địa chỉ..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-rose-500/20 text-white w-64 transition-all"
              />
            </div>
            <Link to="/admin/import" className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-500/20 flex items-center gap-2 cursor-pointer">
              <Plus size={18} /> Đăng mới
            </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredRooms.map(room => (
          <motion.div 
            layout
            key={room._id}
            className="bg-slate-900/60 backdrop-blur-md border border-white/5 p-6 rounded-[2rem] flex flex-col md:flex-row items-center gap-6 group hover:border-white/20 transition-all"
          >
            {/* Thumbnail */}
            <div className="w-full md:w-32 h-32 rounded-2xl overflow-hidden shrink-0 border border-white/5 relative">
              <img src={room.images?.[0]} className={`w-full h-full object-cover ${room.status === 'rented' ? 'grayscale opacity-50' : ''}`} />
              {room.status === 'rented' && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20">
                  <XCircle className="text-rose-500" size={24} />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-3">
                <span className="bg-slate-950 text-rose-500 text-[10px] font-black px-3 py-1 rounded-full border border-rose-500/20 uppercase tracking-widest">
                  {room.code}
                </span>
                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest truncate ${room.status === 'available' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                  {room.status === 'available' ? 'Còn phòng' : 'Hết phòng'}
                </span>
              </div>
              <h3 className="text-lg font-black text-white truncate">{room.address}</h3>
              <div className="flex items-center gap-4 text-slate-500 text-xs font-bold">
                <span className="text-white">{(room.price / 1000000).toFixed(1)}tr/tháng</span>
                <span>•</span>
                <span>{room.roomNumber ? `Phòng ${room.roomNumber}` : 'Chưa rõ số phòng'}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
               <button 
                onClick={() => handleToggleStatus(room._id, room.status)}
                title={room.status === 'available' ? "Đổi sang Hết phòng" : "Đổi sang Còn phòng"}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${room.status === 'available' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white' : 'bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white'}`}
               >
                 {room.status === 'available' ? <CheckCircle size={18} /> : <XCircle size={18} />}
               </button>
               
               <button 
                onClick={() => openEditModal(room)}
                className="p-3 bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all cursor-pointer"
               >
                 <Edit2 size={18} />
               </button>

               <button 
                onClick={() => handleDelete(room._id, room.code)}
                className="p-3 bg-rose-500/10 border border-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl transition-all cursor-pointer"
               >
                 <Trash2 size={18} />
               </button>

               <div className="w-px h-8 bg-white/5 mx-2"></div>

               <Link 
                to={`/room/${room._id}`}
                target="_blank"
                className="p-3 bg-white/5 text-slate-400 hover:text-rose-500 rounded-2xl transition-all cursor-pointer"
               >
                 <ExternalLink size={18} />
               </Link>
            </div>
          </motion.div>
        ))}

        {filteredRooms.length === 0 && (
          <div className="text-center py-20 bg-slate-900/20 rounded-[2rem] border border-white/5 border-dashed">
            <p className="text-slate-500 font-bold uppercase tracking-widest">Không tìm thấy phòng nào khớp với tìm kiếm.</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingRoom && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-slate-900 w-full max-w-2xl rounded-[3rem] border border-white/10 overflow-hidden flex flex-col shadow-3xl"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div>
                   <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Chỉnh sửa thông tin</h3>
                   <p className="text-xs font-bold text-rose-500 uppercase tracking-widest mt-1">Mã phòng: {editingRoom.code}</p>
                </div>
                <button onClick={() => setEditingRoom(null)} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors cursor-pointer text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="p-8 space-y-6 flex-1 overflow-auto max-h-[70vh]">
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Giá thuê (VNĐ)</label>
                      <input 
                        type="number" 
                        value={editFormData.price}
                        onChange={(e) => setEditFormData({...editFormData, price: e.target.value})}
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white font-bold focus:ring-2 focus:ring-rose-500/20"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Số phòng / Tầng</label>
                      <input 
                        type="text" 
                        value={editFormData.roomNumber}
                        onChange={(e) => setEditFormData({...editFormData, roomNumber: e.target.value})}
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white font-bold focus:ring-2 focus:ring-rose-500/20"
                      />
                   </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Địa chỉ chi tiết</label>
                    <input 
                      type="text" 
                      value={editFormData.address}
                      onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white font-bold focus:ring-2 focus:ring-rose-500/20"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Mô tả thêm / Ngày vào ở</label>
                    <input 
                      type="text" 
                      value={editFormData.availability}
                      onChange={(e) => setEditFormData({...editFormData, availability: e.target.value})}
                      placeholder="Ví dụ: Vào ở ngay hoặc mùng 10 tới"
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white font-bold focus:ring-2 focus:ring-rose-500/20"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Số điện thoại chủ (Liên hệ)</label>
                    <input 
                      type="text" 
                      value={editFormData.contactPhone}
                      onChange={(e) => setEditFormData({...editFormData, contactPhone: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white font-bold focus:ring-2 focus:ring-rose-500/20"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Mô tả chi tiết</label>
                    <textarea 
                      rows={4}
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white font-bold focus:ring-2 focus:ring-rose-500/20 resize-none"
                    ></textarea>
                </div>

                <div className="pt-6 flex gap-4">
                   <button 
                    type="button"
                    onClick={() => setEditingRoom(null)}
                    className="flex-1 bg-white/5 text-slate-400 py-4 rounded-2xl font-black uppercase text-xs tracking-widest cursor-pointer hover:bg-white/10 transition-all"
                   >
                     Hủy
                   </button>
                   <button 
                    type="submit"
                    disabled={saving}
                    className="flex-2 bg-rose-500 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest cursor-pointer hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/20 flex items-center justify-center gap-2"
                   >
                     {saving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                     Lưu thay đổi
                   </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminRooms;
