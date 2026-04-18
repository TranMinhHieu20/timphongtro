import React, { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck,
  LayoutGrid,
  Bell,
  PlusCircle,
  X,
  ChevronRight,
  Home,
  MessageSquare
} from 'lucide-react'
import { chatService, leadService } from '../services/api'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthContext'

const AdminSidebar = ({ isOpen, onClose }) => {
  const { user: currentUser } = useAuth()
  const location = useLocation()
  const [unreadCounts, setUnreadCounts] = useState({
    leads: 0,
    chat: 0
  })

  const fetchCounts = async () => {
    try {
      const [leadRes, chatRes] = await Promise.all([
        leadService.getPendingCount(),
        chatService.getUnreadTotal()
      ])
      setUnreadCounts({
        leads: leadRes.data.count,
        chat: chatRes.data.count
      })
    } catch (err) {
      console.error('Error fetching sidebar counts:', err)
    }
  }

  useEffect(() => {
    if (!currentUser) return

    // Initial fetch
    fetchCounts()

    // Socket listeners
    const socketUrl =
      import.meta.env.MODE === 'development'
        ? 'http://localhost:3000'
        : window.location.origin
    const socket = io(socketUrl, {
      query: { userId: currentUser._id }
    })

    // Cập nhật số lượng thông tin khi có lead mới hoặc trạng thái thay đổi
    socket.on('leadCountUpdate', () => {
      fetchCounts()
    })

    // Cập nhật khi có tin nhắn mới hoặc khi tin nhắn đã được đọc
    socket.on('newMessage', () => {
      fetchCounts()
    })

    socket.on('unreadCountUpdate', () => {
      fetchCounts()
    })

    return () => socket.disconnect()
  }, [currentUser])

  const menuItems = [
    { name: 'Trang chủ', path: '/', icon: LayoutGrid },
    { name: 'Đăng phòng mới', path: '/admin/import', icon: PlusCircle },
    { name: 'Quản lý phòng', path: '/admin/rooms', icon: LayoutGrid },
    {
      name: 'Yêu cầu khách',
      path: '/admin/leads',
      icon: Bell,
      badge: unreadCounts.leads
    },
    {
      name: 'Tin nhắn',
      path: '/admin/chat',
      icon: MessageSquare,
      badge: unreadCounts.chat
    }
  ]

  const sidebarContent = (
    <div className="h-full flex flex-col bg-slate-900 border-r border-white/10 shadow-3xl">
      {/* Brand Header - PC Only */}
      <div className="h-20 flex items-center px-8 border-b border-white/5 hidden lg:flex">
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="bg-rose-500 p-2 rounded-xl group-hover:rotate-12 transition-transform duration-300">
            <Home className="text-white" size={20} />
          </div>
          <span className="text-xl font-black tracking-tighter text-white">
            TimPhong<span className="text-rose-500">Online</span>
          </span>
        </NavLink>
      </div>

      {/* Header for Mobile */}
      <div className="p-8 pb-4 flex items-center justify-between lg:hidden">
        <h2 className="text-xl font-black text-white uppercase tracking-tighter">
          Menu Quản trị
        </h2>
        <button
          onClick={onClose}
          className="p-2 bg-white/5 rounded-full text-slate-400"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-8 space-y-2 mt-4 flex-1">
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-4 mb-6">
          Điều hướng nhanh
        </div>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => {
              if (window.innerWidth < 1024) onClose()
            }}
            className={({ isActive }) =>
              `flex items-center justify-between p-4 rounded-3xl transition-all duration-300 group cursor-pointer ${
                isActive
                  ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/20 scale-[1.02]'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <div className="flex items-center gap-4">
              <div
                className={`p-2 rounded-xl transition-colors ${location.pathname === item.path ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'}`}
              >
                <item.icon size={20} />
              </div>
              <span className="text-sm font-black uppercase tracking-tight">
                {item.name}
              </span>

              {/* Badge Rendering */}
              {item.badge > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-2 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-black rounded-lg shadow-lg shadow-emerald-500/20"
                >
                  {item.badge}
                </motion.span>
              )}
            </div>
            <ChevronRight
              size={16}
              className={`transition-transform duration-300 ${location.pathname === item.path ? 'translate-x-0' : '-translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`}
            />
          </NavLink>
        ))}
      </div>

      {/* Footer / Stats */}
      <div className="p-8 border-t border-white/5">
        <div className="bg-slate-950/50 rounded-3xl p-6 border border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-500">
              <ShieldCheck size={18} />
            </div>
            <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">
              Admin Mode
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
            Hệ thống đang hoạt động ổn định. Chúc bạn một ngày làm việc hiệu
            quả!
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* PC Sidebar */}
      <aside className="hidden lg:block fixed top-0 left-0 bottom-0 w-80 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <div className="lg:hidden fixed inset-0 z-[100]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 left-0 bottom-0 w-80"
            >
              {sidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

export default AdminSidebar
