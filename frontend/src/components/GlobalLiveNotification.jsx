import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, MapPin } from 'lucide-react';
import { io } from 'socket.io-client';

const GlobalLiveNotification = () => {
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        const socketUrl = import.meta.env.MODE === 'development' ? "http://localhost:3000" : window.location.origin;
        const socket = io(socketUrl);

        socket.on('newGlobalLead', (data) => {
            // Show notification
            setNotification({
                ...data,
                time: "Vừa xong"
            });

            // Hide after 6 seconds
            setTimeout(() => {
                setNotification(null);
            }, 6000);
        });

        return () => socket.disconnect();
    }, []);

    return (
        <div className="fixed bottom-10 left-10 z-[100] pointer-events-none">
            <AnimatePresence>
                {notification && (
                    <motion.div 
                        initial={{ opacity: 0, x: -50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -20, scale: 0.9 }}
                        className="bg-slate-900/95 backdrop-blur-2xl border border-rose-500/20 p-5 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-5 w-[350px] pointer-events-auto"
                    >
                        <div className="bg-rose-500 p-4 rounded-2xl flex-shrink-0 shadow-lg shadow-rose-500/20">
                            <Zap className="text-white animate-pulse" size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">Thông báo thực tế</p>
                                <span className="text-[9px] text-slate-500 font-bold uppercase">{notification.time}</span>
                            </div>
                            <p className="text-sm font-black text-white leading-tight">
                                {notification.username} 
                                <span className="text-slate-400 font-medium whitespace-pre">  vừa đặt lịch xem phòng</span>
                            </p>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold mt-2 truncate">
                                <MapPin size={12} className="text-rose-500/50" />
                                {notification.address}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GlobalLiveNotification;
