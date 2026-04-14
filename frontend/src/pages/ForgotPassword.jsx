import { useState } from 'react';
import { Mail, ArrowRight, Loader2, Home } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const res = await authService.forgotPassword(email);
      setMessage(res.data.message || 'Mã xác nhận đã được gửi đến email của bạn.');
      setTimeout(() => {
        navigate('/reset-password', { state: { email } });
      }, 2000);
    } catch (err) {
      if (err.response?.status === 429) {
        setError(err.response.data.message);
      } else {
        setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col pt-20 px-4 bg-slate-950 fade-in">
      {/* Brand Header */}
      <div className="flex justify-center mb-10">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="bg-rose-500 p-2.5 rounded-2xl group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-rose-500/20">
            <Home className="text-white" size={24} />
          </div>
          <span className="text-2xl font-black tracking-tighter text-white">
            TimPhong<span className="text-rose-500">Tro</span>
          </span>
        </Link>
      </div>

      <div className="max-w-md mx-auto w-full glass p-10 space-y-8 border-rose-500/10 rounded-[2rem]">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-white">Quên mật khẩu?</h1>
          <p className="text-slate-400">Nhập email của bạn để nhận mã xác nhận</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-rose-400 text-sm font-medium text-center">
            {error}
          </div>
        )}
        
        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-emerald-400 text-sm font-medium text-center">
            {message} <Loader2 className="inline ml-2 animate-spin" size={16}/>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Địa chỉ Email</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-rose-500 transition-colors" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@example.com"
                className="w-full bg-slate-900 border border-white/5 rounded-xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || !email}
            className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-slate-800 text-white font-black py-4 rounded-xl transition-all shadow-xl shadow-rose-500/20 flex items-center justify-center gap-2 group cursor-pointer"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <>Nhận mã xác nhận <ArrowRight size={20} /></>}
          </button>
        </form>

        <div className="pt-6 border-t border-white/5 text-center">
            <p className="text-sm text-slate-500">Nhớ mật khẩu? <Link to="/login" className="text-rose-500 font-bold hover:underline cursor-pointer">Đăng nhập</Link></p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
