import { useState, useEffect } from 'react';
import { Mail, KeyRound, Lock, Eye, EyeOff, Loader2, Home, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/api';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await authService.resetPassword({ email, otp, newPassword });
      setSuccess(res.data.message || 'Khôi phục mật khẩu thành công. Đang chuyển hướng...');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Khôi phục mật khẩu thất bại. Quá trình có thể đã hết hạn.');
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
          <h1 className="text-3xl font-black text-white">Bảo mật tài khoản</h1>
          <p className="text-slate-400">Nhập mã OTP 6 số và tạo mật khẩu mới</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-rose-400 text-sm font-medium text-center">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-emerald-400 text-sm font-medium text-center flex flex-col items-center gap-2">
            <CheckCircle2 size={32} />
            {success}
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Email của bạn</label>
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

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Mã OTP 6 số</label>
              <div className="relative group">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-rose-500 transition-colors" size={18} />
                <input 
                  type="text" 
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Nhập 6 số từ Email"
                  className="w-full bg-slate-900 font-mono  font-bold border border-white/5 rounded-xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all "
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Mật khẩu thẻ</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-rose-500 transition-colors" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-white/5 rounded-xl py-4 pl-12 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || otp.length < 6 || !newPassword}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 text-white font-black py-4 rounded-xl transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 group cursor-pointer"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Xác nhận khôi phục'}
            </button>
          </form>
        )}

        <div className="pt-6 border-t border-white/5 text-center">
            <p className="text-sm text-slate-500">Chưa nhận được mã? <Link to="/forgot-password" className="text-rose-500 font-bold hover:underline cursor-pointer">Gửi lại</Link></p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
