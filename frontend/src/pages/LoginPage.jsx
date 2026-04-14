import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = location.state?.from || '/';

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 fade-in">
      <div className="glass p-10 space-y-8 border-rose-500/10">
        <div className="text-center space-y-2">
          <div className="bg-rose-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-rose-500/20 rotate-12 group-hover:rotate-0 transition-transform">
            <LogIn className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black text-white">Chào mừng quay lại</h1>
          <p className="text-slate-400">Đăng nhập để quản lý phòng trọ của bạn</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-rose-400 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Email</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-rose-500 transition-colors" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full bg-slate-900 border border-white/5 rounded-xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mật khẩu</label>
            
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-rose-500 transition-colors" size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
          <div className="flex justify-end top-0">  
            <Link to="/forgot-password" className="text-xs font-bold text-rose-500 hover:text-rose-400 hover:underline transition-all">Quên mật khẩu?</Link>
            </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-slate-800 text-white font-black py-4 rounded-xl transition-all shadow-xl shadow-rose-500/20 flex items-center justify-center gap-2 group"
          >
            {loading ? 'Đang xác thực...' : <><LogIn size={20} /> Đăng nhập hệ thống</>}
          </button>
        </form>

        <div className="pt-6 border-t border-white/5 text-center">
            <p className="text-sm text-slate-500">Chưa có tài khoản? <Link to="/register" className="text-rose-500 font-bold hover:underline cursor-pointer">Đăng ký ngay</Link></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
