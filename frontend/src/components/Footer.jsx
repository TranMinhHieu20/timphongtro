import React from 'react'

const Footer = () => {
  return (
    <footer className="w-full border-t border-white/10 bg-slate-950/50 backdrop-blur-md py-6 mt-auto relative z-10">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 flex flex-col md:flex-row items-center justify-center md:justify-between gap-4 text-center md:text-left">
        {/* Bản quyền */}
        <p className="text-slate-400 text-sm font-medium">
          Sản phẩm này được tạo bởi{' '}
          <span className="text-rose-500 font-black tracking-wide">Hiếu</span>
        </p>

        {/* Thông tin liên hệ */}
        <div className="flex items-center gap-2 text-sm font-medium text-slate-400 bg-white/5 px-4 py-2 rounded-full border border-white/5">
          <span>Cần trợ giúp liên hệ Facebook:</span>
          <a
            href="https://www.facebook.com/timphongonline"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 font-bold transition-colors flex items-center gap-1"
          >
            timphongonline
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
