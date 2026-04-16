import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, MapPin, Zap } from 'lucide-react';

const mockSuccessStories = [
    { id: 1, name: "Anh Tùng", location: "Cầu Giấy", action: "chốt phòng thành công", time: "2 phút trước" },
    { id: 2, name: "Chị Hằng", location: "Đống Đa", action: "vừa đặt lịch xem phòng", time: "Vừa xong" },
    { id: 3, name: "Anh Nam", location: "Thanh Xuân", action: "đã nhận hoàn tiền 9%", time: "15 phút trước" },
    { id: 4, name: "Minh Anh", location: "Hai Bà Trưng", action: "chốt phòng thành công", time: "5 phút trước" },
    { id: 5, name: "Đức Huy", location: "Mỹ Đình", action: "vừa đặt lịch xem phòng", time: "10 phút trước" },
];

const LiveSuccessToast = () => {
    const [current, setCurrent] = useState(null);
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const showNext = () => {
            setCurrent(mockSuccessStories[index]);
            
            // Show for 5 seconds
            setTimeout(() => {
                setCurrent(null);
                // Next story after a gap
                setTimeout(() => {
                    setIndex(prev => (prev + 1) % mockSuccessStories.length);
                }, 10000); // 10s gap between toasts
            }, 5000);
        };

        const timer = setTimeout(showNext, 3000); // Initial delay
        return () => clearTimeout(timer);
    }, [index]);

    return (
        <div className="fixed bottom-10 left-10 z-[100] pointer-events-none">
            <AnimatePresence>
                {current && (
                    <motion.div 
                        initial={{ opacity: 0, x: -50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -20, scale: 0.9 }}
                        className="bg-slate-900/90 backdrop-blur-xl border border-white/10 p-5 rounded-[2rem] shadow-2xl flex items-center gap-4 w-80 pointer-events-auto"
                    >
                        <div className="bg-emerald-500/20 p-3 rounded-2xl flex-shrink-0">
                            <Zap className="text-emerald-500" size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Giao dịch mới</p>
                                <span className="text-[9px] text-slate-500 font-bold">{current.time}</span>
                            </div>
                            <p className="text-sm font-black text-white truncate">
                                {current.name} <span className="text-slate-400 font-medium">{current.action}</span>
                            </p>
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold mt-1">
                                <MapPin size={10} />
                                {current.location}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LiveSuccessToast;
