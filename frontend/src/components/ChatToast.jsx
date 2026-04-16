import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const ChatToast = () => {
    const { user, lastNotification, clearNotification } = useAuth();

    const handleToastClick = () => {
        if (lastNotification) {
            // Dispatch custom event to open ChatBox
            window.dispatchEvent(new CustomEvent('openChat'));
            clearNotification();
        }
    };

    return (
        <div className="fixed top-24 right-8 z-[1001] pointer-events-none">
            <AnimatePresence>
                {lastNotification && (
                    <motion.div
                        initial={{ opacity: 0, x: 50, y: -20 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0, x: 20, scale: 0.9 }}
                        onClick={handleToastClick}
                        className="bg-slate-900/95 backdrop-blur-2xl border border-rose-500/20 p-5 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex items-center gap-5 w-[350px] pointer-events-auto cursor-pointer group hover:border-rose-500/40 transition-all duration-300 active:scale-95"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20 shrink-0 group-hover:scale-110 transition-transform">
                            <MessageCircle className="text-white" size={28} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">Tin nhắn mới</p>
                                <button onClick={(e) => { e.stopPropagation(); clearNotification(); }} className="hover:rotate-90 transition-transform">
                                    <X size={16} className="text-slate-500 hover:text-white" />
                                </button>
                            </div>
                            <p className="text-sm font-black text-white truncate">{lastNotification.sender}</p>
                            <p className="text-[11px] text-slate-400 font-medium truncate mt-1 leading-relaxed">{lastNotification.text}</p>
                        </div>
                        <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                             <div className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Bấm để xem</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChatToast;
