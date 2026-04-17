import React, { useState } from 'react';
import { roomService } from '../services/api';
import { FileText, Plus, CheckCircle2, AlertCircle, Sparkles, Image as ImageIcon, FileUp, X, Loader2, Video, Play } from 'lucide-react';
import {motion} from 'framer-motion';

const AdminImport = () => {
  const [activeTab, setActiveTab] = useState('zalo'); // 'zalo' or 'excel'
  const [text, setText] = useState('');
  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);
  const [excelFile, setExcelFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '', details: null });

  const [formData, setFormData] = useState({
    commissionRate: 0,
    code: '',
    roomNumber: '',
    price: 0,
    address: '',
    availability: '',
    status: 'available',
    description: '',
    notes: '',
    cashbackAmount: 0,
    totalCommission: 0
  });

  const handleFieldChange = (field, value) => {
    setFormData(prev => {
        const numValue = (field === 'price' || field === 'commissionRate' || field === 'cashbackAmount' || field === 'totalCommission') 
                         ? (parseFloat(value) || 0) 
                         : value;
        const newData = { ...prev, [field]: numValue };
        
        // If price or commissionRate changes, recalculate financials
        if (field === 'price' || field === 'commissionRate') {
            newData.totalCommission = Math.round((newData.price * newData.commissionRate) / 100);
            newData.cashbackAmount = Math.round(newData.price * 0.09);
        }
        return newData;
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages((prev) => [...prev, ...files]);
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) setVideo(file);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Auto-parse text when it changes
  React.useEffect(() => {
    if (!text) return;
    
    const lines = text.split('\n').map(l => l.trim());
    let price = 0;
    let code = '';
    let commissionRate = 0;
    let roomNum = '';
    let cashbackAmountParsed = 0;
    let address = '';
    let description = '';
    let notes = [];
    let status = 'available';
    let availabilityText = '';
    let currentSection = '';

    lines.forEach(line => {
        if (line.match(/^Giá\s*:/i)) {
            const pText = (line.split(':')[1] || '').trim().toLowerCase();
            let val = 0;
            if (pText.includes('tr')) {
                const parts = pText.split('tr');
                val = (parseFloat(parts[0]) || 0) * 1000000;
                if (parts[1]) {
                    const decimal = parseFloat(parts[1].substring(0, 1)) || 0;
                    val += decimal * 100000;
                }
            } else if (pText.includes('k')) {
                val = (parseFloat(pText.replace('k', '')) || 0) * 1000;
            } else {
                val = parseFloat(pText.replace(/[^0-9.]/g, '')) || 0;
            }
            price = val;
            currentSection = '';
        }
        else if (line.match(/^Mã\s*:/i)) {
            code = (line.split(':')[1] || '').trim();
            currentSection = '';
        }
        else if (line.match(/^Phòng\s*:/i)) {
            roomNum = (line.split(':')[1] || '').trim();
            currentSection = '';
        }
        else if (line.match(/^Hoa\s*hồng\s*:/i)) {
            const rate = line.match(/(\d+)/);
            if (rate) commissionRate = parseInt(rate[1]);
            currentSection = '';
        }
        else if (line.match(/^Hoàn\s*(?:khách|trả)\s*:/i)) {
            const cText = (line.split(':')[1] || '').trim().toLowerCase();
            if (cText.includes('tr')) cashbackAmountParsed = parseFloat(cText) * 1000000;
            else if (cText.includes('k')) cashbackAmountParsed = parseFloat(cText) * 1000;
            else cashbackAmountParsed = parseFloat(cText.replace(/[^0-9.]/g, '')) || 0;
            currentSection = '';
        }
        else if (line.match(/^Địa\s*chỉ\s*:/i)) {
            address = (line.split(':')[1] || '').trim();
            currentSection = '';
        }
        else if (line.match(/^Trạng\s*thái\s*:/i)) {
            const rawStatus = (line.split(':')[1] || '').trim();
            availabilityText = rawStatus;
            const lower = rawStatus.toLowerCase();
            if (lower.includes('hết') || lower.includes('thuê')) status = 'rented';
            else if (lower.includes('sắp')) status = 'coming-soon';
            else status = 'available';
            currentSection = '';
        }
        else if (line.match(/^Mô\s*tả\s*:/i)) {
            description = line.split(':')[1].trim();
            currentSection = 'description';
        }
        else if (line.match(/^Lưu\s*ý\s*:/i)) {
            const inline = line.split(':')[1]?.trim();
            if (inline) notes.push(inline);
            currentSection = 'notes';
        }
        else if (currentSection === 'description') {
            description += '\n' + line;
        } else if (currentSection === 'notes') {
            notes.push(line.replace(/^-|^\d+\.\s*/, "").trim());
        }
    });
    
    const cashbackAmount = cashbackAmountParsed || Math.round(price * 0.09);
    const totalCommission = Math.round((price * commissionRate) / 100);
    
    setFormData({
        price,
        code,
        commissionRate,
        roomNumber: roomNum,
        address,
        description,
        notes: notes.join('\n'),
        availability: availabilityText,
        status,
        cashbackAmount,
        totalCommission
    });
  }, [text]);

  const netProfit = formData.totalCommission - formData.cashbackAmount;

  const handleImportZalo = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    const formDataToSend = new FormData();
    // Use data from the FORM, not just the raw text
    Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
    });
    
    images.forEach((image) => {
      formDataToSend.append('images', image);
    });

    if (video) {
        formDataToSend.append('images', video); // Send as part of 'images' array for generic multer to catch
    }

    try {
      const res = await roomService.importZalo(formDataToSend);
      setMessage({ type: 'success', text: `Đã đăng thành công phòng: ${res.data.room.displayId}` });
      setText('');
      setFormData({
        commissionRate: 0, code: '', roomNumber: '', price: 0,
        address: '', status: 'available', description: '', notes: '', cashbackAmount: 0
      });
      setImages([]);
      setVideo(null);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Có lỗi xảy ra khi nhập dữ liệu' });
    } finally {
      setLoading(false);
    }
  };

  const handleImportExcel = async () => {
    if (!excelFile) return;
    setLoading(true);
    setMessage({ type: '', text: '' });

    const formData = new FormData();
    formData.append('file', excelFile);
    images.forEach((image) => {
      formData.append('images', image);
    });

    if (video) {
        formData.append('images', video);
    }

    try {
      const res = await roomService.importExcel(formData);
      const { results } = res.data;
      setMessage({ 
        type: 'success', 
        text: `Đã nhập xong: ${results.success} thành công, ${results.failed} thất bại.`,
        details: results.errors 
      });
      setExcelFile(null);
      setImages([]);
      setVideo(null);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Có lỗi xảy ra khi tải file Excel' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-black text-white tracking-tight">Trung tâm Quản lý Dữ liệu</h1>
        <p className="text-slate-400 text-lg font-medium">Chọn phương thức nhập liệu tối ưu cho quy trình của bạn</p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center">
         <div className="bg-white/5 p-1.5 rounded-2xl border border-white/5 flex gap-2 backdrop-blur-xl">
            <button 
              onClick={() => { setActiveTab('zalo'); setMessage({ type: '', text: '' }); setImages([]); }}
              className={`px-8 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'zalo' ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/20' : 'text-slate-500 hover:text-white'}`}
            >
              <FileText size={18} /> Nhập từ Zalo
            </button>
            <button 
              onClick={() => { setActiveTab('excel'); setMessage({ type: '', text: '' }); setImages([]); }}
              className={`px-8 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'excel' ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/20' : 'text-slate-500 hover:text-white'}`}
            >
              <FileUp size={18} /> Đẩy từ Excel
            </button>
         </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Input Section */}
        <div className="lg:col-span-7 space-y-8">
          {activeTab === 'zalo' ? (
            <div className="bg-slate-900/40 rounded-[2.5rem] p-10 border border-white/5 space-y-8 relative overflow-hidden group">
              <div className="flex items-center gap-3 text-rose-400 font-black uppercase tracking-widest text-xs">
                 <FileText size={18} /> Nội dung tin nhắn
              </div>
              <textarea 
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`Hoa hồng: 30%\nMã: TM292\nPhòng: P203\nGiá: 3tr5\nĐịa chỉ: ...\nTrạng thái: Trống\nMô tả: ...\nLưu ý: ...`}
                className="w-full h-80 bg-slate-950/50 border border-white/10 rounded-3xl p-8 text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all font-medium leading-relaxed resize-none"
              />
              
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-6">
                   <label className="flex items-center gap-2 text-slate-400 font-bold cursor-pointer hover:text-rose-400 transition-colors">
                      <ImageIcon size={20} />
                      <span>Ảnh ({images.length})</span>
                      <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                   </label>

                   <label className="flex items-center gap-2 text-emerald-400 font-bold cursor-pointer hover:text-emerald-300 transition-colors">
                      <Video size={20} />
                      <span>{video ? 'Đã chọn Video' : 'Thêm Video'}</span>
                      <input type="file" accept="video/*" onChange={handleVideoChange} className="hidden" />
                   </label>

                   {(images.length > 0 || video) && (
                     <button 
                        onClick={() => { setImages([]); setVideo(null); }} 
                        className="text-xs text-rose-500 font-black uppercase hover:underline ml-auto"
                      >
                        Xóa tất cả
                      </button>
                   )}
                </div>
                
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                    {/* Video Preview */}
                    {video && (
                        <div className="relative aspect-square rounded-xl overflow-hidden group/vid border-2 border-emerald-500/50">
                            <video 
                                src={`${URL.createObjectURL(video)}#t=0.1`} 
                                className="w-full h-full object-cover" 
                                muted 
                                playsInline 
                                preload="metadata"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                                <Play size={24} className="text-white fill-white" />
                            </div>
                            <button 
                                onClick={() => setVideo(null)}
                                className="absolute inset-0 bg-rose-500/80 flex items-center justify-center opacity-0 group-hover/vid:opacity-100 transition-opacity"
                            >
                                <X size={20} className="text-white" />
                            </button>
                        </div>
                    )}

                    {/* Image Previews */}
                    {images.map((img, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden group/img border border-white/10">
                         <img src={URL.createObjectURL(img)} className="w-full h-full object-cover" alt="Preview" />
                         <button 
                            onClick={() => removeImage(i)}
                            className="absolute inset-0 bg-rose-500/80 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                          >
                            <X size={16} className="text-white" />
                         </button>
                      </div>
                    ))}
                </div>
              </div>

              {/* STRUCTURED FILL FORM (Based on Mockup) */}
              {(text || formData.code) && (
                 <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-950/80 border border-emerald-500/20 rounded-[2.5rem] p-8 space-y-6"
                 >
                    <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                       <Sparkles size={14} /> Hệ thống bóc tách & Chỉnh sửa Form
                    </div>

                    {/* Row 1: Hoa hồng | Mã | Phòng */}
                    <div className="grid grid-cols-3 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-500 uppercase px-2">Hoa hồng (%)</label>
                          <input 
                            type="number" 
                            value={formData.commissionRate}
                            onChange={(e) => handleFieldChange('commissionRate', e.target.value)}
                            className="w-full bg-slate-900 border border-white/5 rounded-xl p-3 text-white font-bold text-sm focus:ring-1 focus:ring-emerald-500/50"
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-500 uppercase px-2">Mã phòng</label>
                          <input 
                            type="text" 
                            value={formData.code}
                            onChange={(e) => handleFieldChange('code', e.target.value)}
                            className="w-full bg-slate-900 border border-white/5 rounded-xl p-3 text-white font-bold text-sm focus:ring-1 focus:ring-emerald-500/50"
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-500 uppercase px-2">Số phòng</label>
                          <input 
                            type="text" 
                            value={formData.roomNumber}
                            onChange={(e) => handleFieldChange('roomNumber', e.target.value)}
                            className="w-full bg-slate-900 border border-white/5 rounded-xl p-3 text-white font-bold text-sm focus:ring-1 focus:ring-emerald-500/50"
                          />
                       </div>
                    </div>

                    {/* Row 2: Giá | Địa chỉ | Trạng thái */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-500 uppercase px-2">Giá thuê</label>
                          <input 
                            type="number" 
                            value={formData.price}
                            onChange={(e) => handleFieldChange('price', e.target.value)}
                            className="w-full bg-slate-900 border border-white/5 rounded-xl p-3 text-white font-bold text-sm focus:ring-1 focus:ring-emerald-500/50"
                          />
                       </div>
                       <div className="md:col-span-2 space-y-1.5">
                          <label className="text-[9px] font-black text-slate-500 uppercase px-2">Địa chỉ</label>
                          <input 
                            type="text" 
                            value={formData.address}
                            onChange={(e) => handleFieldChange('address', e.target.value)}
                            className="w-full bg-slate-900 border border-white/5 rounded-xl p-3 text-white font-bold text-sm focus:ring-1 focus:ring-emerald-500/50"
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-500 uppercase px-2">Trạng thái</label>
                          <input 
                            type="text" 
                            value={formData.availability}
                            onChange={(e) => handleFieldChange('availability', e.target.value)}
                            placeholder="VD: Vào ở luôn"
                            className="w-full bg-slate-900 border border-white/5 rounded-xl p-3 text-white font-bold text-sm focus:ring-1 focus:ring-emerald-500/50"
                          />
                       </div>
                    </div>

                    {/* Row 3: Mô tả */}
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black text-slate-500 uppercase px-2">Mô tả phòng</label>
                       <textarea 
                         rows={3}
                         value={formData.description}
                         onChange={(e) => handleFieldChange('description', e.target.value)}
                         className="w-full bg-slate-900 border border-white/5 rounded-xl p-4 text-white font-medium text-sm focus:ring-1 focus:ring-emerald-500/50 resize-none"
                       />
                    </div>

                    {/* Row 4: Lưu ý */}
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black text-slate-500 uppercase px-2">Lưu ý chuyên sâu</label>
                       <textarea 
                         rows={2}
                         value={formData.notes}
                         onChange={(e) => handleFieldChange('notes', e.target.value)}
                         className="w-full bg-slate-900 border border-white/5 rounded-xl p-4 text-white font-medium text-sm focus:ring-1 focus:ring-emerald-500/50 resize-none"
                       />
                    </div>

                    {/* Row 5: Financial Metrics (The highlighted part of mockup) */}
                    <div className="pt-6 border-t border-white/10 space-y-4">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/20">
                             <p className="text-[9px] font-black text-amber-500/50 uppercase tracking-widest mb-1">Tính tiền hoa hồng (Có thể sửa)</p>
                             <input 
                                type="number" 
                                value={formData.totalCommission}
                                onChange={(e) => handleFieldChange('totalCommission', e.target.value)}
                                className="bg-transparent text-xl font-black text-amber-500 focus:outline-none w-full"
                             />
                          </div>
                          <div className="bg-slate-950 p-4 rounded-2xl border border-rose-500/20">
                             <p className="text-[9px] font-black text-rose-500/50 uppercase tracking-widest mb-1">Hoàn trả khách (Tự động 9%)</p>
                             <input 
                                type="number" 
                                value={formData.cashbackAmount}
                                onChange={(e) => handleFieldChange('cashbackAmount', e.target.value)}
                                className="w-full bg-transparent text-xl font-black text-rose-500 focus:outline-none"
                             />
                          </div>
                       </div>
                       <div className="bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/30 flex justify-between items-center">
                          <p className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em]">Lợi nhuận còn lại (Lãi):</p>
                          <p className="text-3xl font-black text-emerald-400 tracking-tighter">{netProfit.toLocaleString()}đ</p>
                       </div>
                    </div>
                 </motion.div>
              )}

              <button 
                onClick={handleImportZalo}
                disabled={loading || !text}
                className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black py-5 rounded-[1.5rem] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-rose-500/20 text-lg group"
              >
                {loading ? <Loader2 className="animate-spin" /> : <><Plus size={22} className="group-hover:rotate-90 transition-transform" /> Đăng phòng ngay</>}
              </button>
            </div>
          ) : (
            <div className="bg-slate-900/40 rounded-[2.5rem] p-12 border border-white/5 space-y-10 text-center flex flex-col items-center justify-center min-h-[500px]">
               <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 mb-4 animate-bounce">
                  <FileUp size={48} />
               </div>
               <div className="space-y-4 max-w-sm">
                  <h3 className="text-2xl font-black text-white">Tải lên tệp Excel</h3>
                  <p className="text-slate-400 font-medium leading-relaxed">Đảm bảo các cột được định dạng đúng: Mã, Phòng, Địa chỉ, Giá, Trạng thái, Nội thất, Dịch vụ, Lưu ý, Hoa hồng.</p>
               </div>

               <div className="w-full max-w-md relative group">
                  <input 
                    type="file" 
                    accept=".xlsx, .xls" 
                    onChange={(e) => setExcelFile(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <div className={`p-10 border-2 border-dashed rounded-[2rem] transition-all ${excelFile ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/10 group-hover:border-rose-500/50 group-hover:bg-rose-500/5'}`}>
                     {excelFile ? (
                        <div className="flex flex-col items-center gap-2">
                           <CheckCircle2 className="text-emerald-500" size={32} />
                           <span className="font-bold text-white text-lg">{excelFile.name}</span>
                           <span className="text-slate-500 text-xs uppercase font-black">Sẵn sàng nhập dữ liệu</span>
                        </div>
                     ) : (
                        <div className="space-y-2">
                           <p className="text-slate-300 font-bold">Kéo thả tệp hoặc click để chọn</p>
                           <p className="text-slate-600 text-xs font-black uppercase">Chỉ chấp nhận .xlsx, .xls</p>
                        </div>
                     )}
                  </div>
               </div>
                 <div className="w-full max-w-md space-y-6">
                    <div className="flex flex-wrap items-center gap-6">
                       <label className="flex items-center gap-2 text-slate-400 font-bold cursor-pointer hover:text-rose-400 transition-colors">
                          <ImageIcon size={20} />
                          <span>Ảnh ({images.length})</span>
                          <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                       </label>

                       <label className="flex items-center gap-2 text-emerald-400 font-bold cursor-pointer hover:text-emerald-300 transition-colors">
                          <Video size={20} />
                          <span>Video</span>
                          <input type="file" accept="video/*" onChange={handleVideoChange} className="hidden" />
                       </label>

                       {(images.length > 0 || video) && (
                         <button 
                            onClick={() => { setImages([]); setVideo(null); }} 
                            className="text-xs text-rose-500 font-black uppercase hover:underline ml-auto"
                          >
                            Xóa tất cả
                          </button>
                       )}
                    </div>
                    
                    {(images.length > 0 || video) && (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                        {/* Video Preview */}
                        {video && (
                            <div className="relative aspect-square rounded-xl overflow-hidden group/vid border-2 border-emerald-500/50">
                                <video 
                                    src={`${URL.createObjectURL(video)}#t=0.1`} 
                                    className="w-full h-full object-cover" 
                                    muted 
                                    playsInline 
                                    preload="metadata"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                                    <Play size={20} className="text-white fill-white" />
                                </div>
                                <button 
                                    onClick={() => setVideo(null)}
                                    className="absolute inset-0 bg-rose-500/80 flex items-center justify-center opacity-0 group-hover/vid:opacity-100 transition-opacity"
                                >
                                    <X size={16} className="text-white" />
                                </button>
                            </div>
                        )}

                        {images.map((img, i) => (
                          <div key={i} className="relative aspect-square rounded-xl overflow-hidden group/img border border-white/10">
                             <img src={URL.createObjectURL(img)} className="w-full h-full object-cover" alt="Preview" />
                             <button 
                                onClick={() => removeImage(i)}
                                className="absolute inset-0 bg-rose-500/80 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                             >
                                <X size={16} className="text-white" />
                             </button>
                          </div>
                        ))}
                      </div>
                    )}
                 </div>
               <button 
                onClick={handleImportExcel}
                disabled={loading || !excelFile}
                className="w-full max-w-md bg-rose-500 hover:bg-rose-600 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black py-5 rounded-[1.5rem] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-rose-500/20 text-lg group"
              >
                {loading ? <Loader2 className="animate-spin" /> : <><Plus size={22} /> Bắt đầu đẩy dữ liệu</>}
              </button>
            </div>
          )}
        </div>

        {/* Info & Status Section */}
        <div className="lg:col-span-5 space-y-8">
           {message.text && (
             <div className={`p-8 rounded-[2.5rem] border flex flex-col gap-4 animate-in slide-in-from-right duration-500 ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-black' : 'bg-rose-500/10 border-rose-500/20 text-rose-400 font-black'}`}>
               <div className="flex items-start gap-4">
                  {message.type === 'success' ? <CheckCircle2 className="flex-shrink-0 mt-1" size={24} /> : <AlertCircle className="flex-shrink-0 mt-1" size={24} />}
                  <div className="space-y-1">
                     <p className="text-lg">{message.text}</p>
                     {message.details && message.details.length > 0 && (
                        <ul className="text-xs text-rose-400/70 font-bold mt-4 space-y-1">
                           {message.details.slice(0, 5).map((err, i) => <li key={i}>• {err}</li>)}
                           {message.details.length > 5 && <li>...và {message.details.length - 5} lỗi khác</li>}
                        </ul>
                     )}
                  </div>
               </div>
             </div>
           )}

           <div className="bg-slate-900/40 rounded-[2.5rem] p-10 border border-white/5 space-y-8 backdrop-blur-sm">
              <h3 className="text-xl font-black text-white flex items-center gap-3">
                 <Sparkles size={20} className="text-amber-400" />
                 Mẹo chuyên gia
              </h3>
              
              <div className="space-y-6">
                 <div className="flex gap-4 group">
                    <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center font-black text-white group-hover:bg-emerald-500 transition-colors shrink-0">1</div>
                    <div>
                       <h4 className="text-white font-bold mb-1">Mẫu nhập liệu (Copy)</h4>
                       <div className="bg-slate-950 p-3 rounded-xl text-[10px] font-mono text-slate-400 select-all border border-white/5 whitespace-pre-wrap leading-relaxed">
Hoa hồng: 30%
Mã: TM292
Phòng: P203
Giá: 4tr3
Địa chỉ: ngõ 255 Nguyễn Văn Trỗi, Hà Đông, HN
Trạng thái: Trống
Mô tả: Thang Máy. Nội thất như hình. Dịch vụ: Điện 4000/số.
Lưu ý:
- Đóng 1 cọc 1
- Liên hệ 30p-1h trước khi qua
                       </div>
                    </div>
                 </div>
                 <div className="flex gap-4 group">
                    <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center font-black text-white group-hover:bg-rose-500 transition-colors shrink-0">2</div>
                    <div>
                       <h4 className="text-white font-bold mb-1">Quy tắc tài chính</h4>
                       <p className="text-sm text-slate-500 leading-relaxed font-medium line-clamp-2">Lợi nhuận = (Giá × Hoa hồng %) - Tiền hoàn khách mang lại sự minh bạch tuyệt đối cho Admin.</p>
                    </div>
                 </div>
                 <div className="flex gap-4 group">
                    <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center font-black text-white group-hover:bg-rose-500 transition-colors shrink-0">3</div>
                    <div>
                       <h4 className="text-white font-bold mb-1">Hình ảnh chất lượng</h4>
                       <p className="text-sm text-slate-500 leading-relaxed font-medium">Ảnh sẽ được tối ưu dung lượng và lưu trên Cloudinary. Hãy chọn ít nhất 3-5 ảnh để tăng tỷ lệ chốt.</p>
                    </div>
                 </div>
                 <div className="flex gap-4 group">
                    <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center font-black text-white group-hover:bg-rose-500 transition-colors shrink-0">4</div>
                    <div>
                       <h4 className="text-white font-bold mb-1">Excel Template</h4>
                       <p className="text-sm text-slate-500 leading-relaxed font-medium">Nếu đẩy hàng loạt, hãy chắc chắn cột giá (Price) chỉ chứa số để tránh lỗi tính toán hoàn tiền.</p>
                    </div>
                 </div>
              </div>

              <div className="pt-8 border-t border-white/5">
                 <div className="bg-amber-500/10 p-5 rounded-2xl border border-amber-500/20">
                    <p className="text-[11px] text-amber-500/80 leading-relaxed font-bold uppercase tracking-widest">Hệ thống sẽ tự động tính toán 9% hoàn tiền dựa trên giá bạn nhập. Vui lòng kiểm tra lại kỹ thông tin trước khi đăng.</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminImport;
