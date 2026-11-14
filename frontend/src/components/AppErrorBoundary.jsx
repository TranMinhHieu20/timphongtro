import { Component } from 'react';

export default class AppErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { console.error('Application display error:', error, info); }
  render() {
    if (!this.state.hasError) return this.props.children;
    return <main role="alert" className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-lg space-y-5 text-center">
        <h1 className="text-2xl font-normal">Trang gặp sự cố khi hiển thị</h1>
        <p className="text-slate-400">Nếu bạn vừa gửi yêu cầu xem phòng hoặc giữ chỗ, hãy kiểm tra danh sách yêu cầu trước khi gửi lại.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <a href="/my-bookings" className="rounded-xl bg-rose-500 px-5 py-3 text-white">Kiểm tra yêu cầu của tôi</a>
          <a href="/" className="rounded-xl border border-white/20 px-5 py-3">Về trang chủ</a>
        </div>
      </div>
    </main>;
  }
}
