import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  MapPin,
  Zap,
  Heart,
  Scale,
  BadgeCheck,
  Video,
  Play,
  Home
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { userService } from '../services/api'
import { motion } from 'framer-motion'

const RoomCard = ({ room, onCompareToggle, isSelected, onFavoriteToggle }) => {
  const { user, isAuthenticated, isAdmin } = useAuth()
  const [isFavorite, setIsFavorite] = useState(false)
  const [loadingFav, setLoadingFav] = useState(false)

  useEffect(() => {
    if (user?.favorites) {
      setIsFavorite(user.favorites.includes(room._id))
    }
  }, [user, room._id])

  const toggleFav = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) return alert('Vui lòng đăng nhập để lưu phòng!')

    const previousState = isFavorite
    setIsFavorite(!previousState)

    try {
      await userService.toggleFavorite(room._id)
      if (onFavoriteToggle) onFavoriteToggle()
    } catch (err) {
      console.error(err)
      setIsFavorite(previousState)
    }
  }

  // Format: 4300000 → "4.3tr"
  const formatPrice = (price) => {
    const millions = price / 1_000_000
    return millions % 1 === 0 ? `${millions}tr` : `${millions.toFixed(1)}tr`
  }

  // Format: 387000 → "387.000₫"
  const formatCurrency = (val) => val?.toLocaleString('vi-VN') + '₫'

  const status = room.availability?.toLowerCase() || ''

  const isAvailable1 =
    status.includes('trống') || status.includes('ở được luôn')

  const availColor = isAvailable1
    ? 'bg-emerald-400 text-slate-900'
    : 'bg-amber-400 text-slate-900'

  const isAvailable = room.status !== 'rented'

  return (
    <Link to={`/room/${room._id}`} className="block group">
      <div className="bg-slate-900 border border-white/5 rounded-2xl md:rounded-[2rem] overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:border-rose-500/30 h-full flex flex-col">
        {/* ── Image Section ─────────────────────────────────────────────────── */}
        <div className="relative aspect-[3/4] md:aspect-[4/5] overflow-hidden bg-slate-800 shrink-0">
          {room.images && room.images.length > 0 ? (
            <img
              src={room.images[0]}
              alt={room.address}
              className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${!isAvailable ? 'grayscale opacity-50' : ''}`}
            />
          ) : room.videoUrl ? (
            <video
              src={`${room.videoUrl}#t=1`}
              className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${!isAvailable ? 'grayscale opacity-50' : ''}`}
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-700">
              <Home size={48} />
            </div>
          )}

          {/* Gradient overlay bottom */}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-slate-950/70 to-transparent pointer-events-none" />

          {/* Rented overlay */}
          {!isAvailable && (
            <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center p-2">
              <span className="bg-slate-950/80 text-rose-500 text-[9px] md:text-[10px] font-black px-3 py-1.5 rounded-full border border-rose-500/30 uppercase tracking-[0.15em] shadow-2xl backdrop-blur-md">
                HẾT PHÒNG
              </span>
            </div>
          )}

          {/* Top-left: Compare button */}
          <div className="absolute top-2 left-2 md:top-5 md:left-5 flex flex-col gap-1.5 z-10">
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onCompareToggle(room)
              }}
              title={isSelected ? 'Đang so sánh' : 'So sánh'}
              className={`flex items-center gap-1.5 px-2 py-1.5 md:px-3 md:py-1.5 rounded-full backdrop-blur-md border transition-all cursor-pointer ${isSelected ? 'bg-emerald-500 border-emerald-400 shadow-xl' : 'bg-slate-950/50 border-white/10 hover:bg-white/10'}`}
            >
              <Scale
                size={10}
                className={isSelected ? 'text-white' : 'text-slate-400'}
              />
              <span
                className={`hidden md:inline text-[9px] font-black uppercase tracking-widest ${isSelected ? 'text-white' : 'text-slate-400'}`}
              >
                {isSelected ? 'Đang so sánh' : 'So sánh'}
              </span>
            </button>
          </div>

          {/* Top-right: Favorite + ID */}
          <div className="absolute top-2 right-2 md:top-5 md:right-5 flex flex-col items-end gap-1.5 z-10">
            {/* Favorite button */}
            <button
              onClick={toggleFav}
              className={`p-1.5 md:p-3 rounded-full backdrop-blur-xl border-2 transition-all duration-300 cursor-pointer ${
                isFavorite
                  ? 'bg-rose-500 border-white shadow-xl shadow-rose-500/50 scale-110'
                  : 'bg-slate-950/40 border-white/10 hover:bg-white/10 hover:border-white/30'
              }`}
            >
              <motion.div
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.8 }}
                animate={{ scale: isFavorite ? [1, 1.4, 1] : 1 }}
                transition={{ duration: 0.3 }}
              >
                <Heart
                  size={14}
                  fill={isFavorite ? 'white' : 'none'}
                  strokeWidth={isFavorite ? 3 : 2}
                  color={isFavorite ? 'white' : 'rgba(255,255,255,0.7)'}
                />
              </motion.div>
            </button>

            {/* Display ID badge */}
            {room.displayId && (
              <span className="bg-rose-500/90 backdrop-blur-md text-white text-[8px] md:text-[10px] font-black px-2 py-0.5 md:px-3 md:py-1.5 rounded-full shadow-lg tracking-widest uppercase">
                #{room.displayId}
              </span>
            )}

            {/* Admin code — desktop and mobile */}

            <span className="md:inline bg-slate-950/70 backdrop-blur-md text-slate-400 text-[9px] font-mono px-2.5 py-1 rounded-full border border-white/10 tracking-[0.1em]">
              {isAdmin && `${room.code?.toUpperCase()} ·`}
              {room.roomNumber ? ` ${room.roomNumber.toUpperCase()}` : ''}
            </span>
          </div>

          {/* Video badge — mobile: icon only / desktop: full */}
          {room.videoUrl && (
            <>
              <div className="absolute top-8 left-2 md:hidden flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/85 backdrop-blur-md border border-emerald-400/50 text-white shadow-lg z-10">
                <Video size={9} />
              </div>
              <div className="hidden md:flex absolute top-16 left-5 items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/80 backdrop-blur-md border border-emerald-400/50 text-white shadow-lg z-10">
                <Video size={10} />
                <span className="text-[8px] font-black uppercase tracking-widest">
                  Video thực tế
                </span>
              </div>
            </>
          )}

          {/* Central Play Icon */}
          {room.videoUrl && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="p-3 md:p-5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100 duration-500">
                <Play size={18} className="fill-white" />
              </div>
            </div>
          )}

          {/* Cashback badge */}
          {room.cashbackAmount > 0 && (
            <div className="absolute bottom-2 left-2 right-2 md:bottom-5 md:left-5 md:right-5 z-10">
              {/* Desktop */}
              <div className="hidden md:flex bg-emerald-500/85 backdrop-blur-md p-4 rounded-2xl border border-emerald-400/50 shadow-2xl items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl">
                    <Zap size={16} className="text-white" fill="white" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-white text-[9px] font-black uppercase tracking-widest leading-none">
                      TIỀN HOÀN TRẢ
                    </p>
                    <p className="text-white/70 text-[8px] font-medium leading-none">
                      Nhận ngay khi ký HĐ
                    </p>
                  </div>
                </div>
                <span className="text-white font-black text-xl tracking-tight">
                  {formatCurrency(room.cashbackAmount)}
                </span>
              </div>
              {/* Mobile: slim pill */}
              <div className="flex md:hidden items-center justify-between bg-emerald-500/85 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-emerald-400/40 shadow-lg">
                <div className="flex items-center gap-1">
                  <Zap size={9} className="text-white shrink-0" fill="white" />
                  <span className="text-white text-[8px] font-black uppercase leading-none">
                    Hoàn
                  </span>
                </div>
                <span className="text-white font-black text-[9px] tracking-tight">
                  {formatCurrency(room.cashbackAmount)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Info Section ──────────────────────────────────────────────────── */}
        <div className="p-3 md:p-7 space-y-2 md:space-y-4 flex flex-col flex-1">
          {/* Address */}
          <div className="flex items-start gap-1 text-green-500">
            <MapPin size={10} className="shrink-0 mt-0.5 md:hidden" />
            <MapPin size={14} className="shrink-0 mt-0.5 hidden md:block" />
            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider line-clamp-2 md:line-clamp-1">
              {room.address}
            </span>
          </div>

          {/* Description / Room name */}
          <h3 className="text-[11px] md:text-xl font-black text-white leading-snug group-hover:text-rose-400 transition-colors line-clamp-2">
            {room.description?.split('\n').find((l) => l.trim()) ||
              (room.roomNumber
                ? `Phòng ${room.roomNumber}`
                : 'Phòng trọ cao cấp')}
          </h3>

          {/* Availability badge — mobile only */}
          {room.availability && (
            <span
              className={`md:hidden inline-block text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wide ${availColor}`}
            >
              {room.availability}
            </span>
          )}

          {/* Price row */}
          <div className="flex items-center justify-between pt-2 md:pt-5 border-t border-white/5 mt-auto">
            <div className="flex items-baseline gap-1 md:gap-1.5">
              <span className="text-base md:text-2xl font-black text-white">
                {formatPrice(room.price)}
              </span>
              <span className="text-[8px] md:text-xs text-slate-500 font-bold uppercase tracking-widest">
                /th
              </span>
            </div>
            {/* Availability badge — desktop (also shown in image overlay) */}
            {room.availability && (
              <span
                className={`hidden md:inline text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider shadow-lg ${availColor}`}
              >
                {room.availability}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default RoomCard
