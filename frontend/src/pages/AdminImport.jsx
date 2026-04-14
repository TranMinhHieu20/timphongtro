import React, { useState } from 'react';
import { roomService } from '../services/api';
import { FileText, Plus, CheckCircle2, AlertCircle, Sparkles, Image as ImageIcon, FileUp, X, Loader2 } from 'lucide-react';

const AdminImport = () => {
  const [activeTab, setActiveTab] = useState('zalo'); // 'zalo' or 'excel'
  const [text, setText] = useState('');
  const [images, setImages] = useState([]);
  const [excelFile, setExcelFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '', details: null });

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages((prev) => [...prev, ...files]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleImportZalo = async () => {
    if (!text) return;
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    const formData = new FormData();
    formData.append('text', text);
    images.forEach((image) => {
      formData.append('images', image);
    });

    try {
      const res = await roomService.importZalo(formData);
      setMessage({ type: 'success', text: `Đã nhập thành công phòng mã: ${res.data.room.code}` });
      setText('');
      setImages([]);
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
                placeholder={`Dán nội dung từ Zalo vào đây...\nVí dụ:\nMã: TM123.🌹 1tr\nPhòng: P404\n🏠 Địa chỉ: ...\n💰 Giá: ...\nVào ở: Vào ở luôn (hoặc cuối tháng)`}
                className="w-full h-80 bg-slate-950/50 border border-white/10 rounded-3xl p-8 text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all font-medium leading-relaxed resize-none"
              />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <label className="flex items-center gap-2 text-slate-400 font-bold cursor-pointer hover:text-rose-400 transition-colors">
                      <ImageIcon size={20} />
                      <span>Thêm hình ảnh ({images.length})</span>
                      <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                   </label>
                   {images.length > 0 && (
                     <button onClick={() => setImages([])} className="text-xs text-rose-500 font-black uppercase hover:underline">Xóa tất cả</button>
                   )}
                </div>
                
                {images.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
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
                  <p className="text-slate-400 font-medium leading-relaxed">Đảm bảo các cột được định dạng đúng: Mã, Phòng, Địa chỉ, Giá, Trạng thái, Nội thất, Dịch vụ, Lưu ý.</p>
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
                   <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-slate-400 font-bold cursor-pointer hover:text-rose-400 transition-colors">
                         <ImageIcon size={20} />
                         <span>Thêm hình ảnh ({images.length})</span>
                         <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                      </label>
                      {images.length > 0 && (
                        <button onClick={() => setImages([])} className="text-xs text-rose-500 font-black uppercase hover:underline">Xóa tất cả</button>
                      )}
                   </div>
                   
                   {images.length > 0 && (
                     <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
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
                    <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center font-black text-white group-hover:bg-rose-500 transition-colors shrink-0">1</div>
                    <div>
                       <h4 className="text-white font-bold mb-1">Đồng nhất định dạng</h4>
                       <p className="text-sm text-slate-500 leading-relaxed font-medium">Hệ thống bóc tách theo cụm từ khóa chuẩn Zalo. Hãy giữ nguyên tiêu đề "Mã:", "Giá:", "Địa chỉ:".</p>
                    </div>
                 </div>
                 <div className="flex gap-4 group">
                    <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center font-black text-white group-hover:bg-rose-500 transition-colors shrink-0">2</div>
                    <div>
                       <h4 className="text-white font-bold mb-1">Hình ảnh chất lượng</h4>
                       <p className="text-sm text-slate-500 leading-relaxed font-medium">Ảnh sẽ được tối ưu dung lượng và lưu trên Cloudinary. Hãy chọn ít nhất 3-5 ảnh để tăng tỷ lệ chốt.</p>
                    </div>
                 </div>
                 <div className="flex gap-4 group">
                    <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center font-black text-white group-hover:bg-rose-500 transition-colors shrink-0">3</div>
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
