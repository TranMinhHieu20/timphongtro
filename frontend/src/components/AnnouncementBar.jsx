import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Users, Zap, UserPlus, CheckCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import { leadService } from '../services/api';

const AnnouncementBar = () => {
    const [successStories, setSuccessStories] = useState([]);
    const [recentActivies, setRecentActivities] = useState([]);
    const [stats, setStats] = useState({ totalLeads: 1200, totalUsers: 500 });

    useEffect(() => {
        // 1. Fetch historical success stories and Global Stats
        const fetchData = async () => {
            try {
                const [storiesRes, statsRes] = await Promise.all([
                    leadService.getSuccessStories(),
                    leadService.getStats()
                ]);

                // Success Stories
                const stories = storiesRes.data.map(lead => ({
                    text: `CHÚC MỪNG: ${lead.userId?.username} vừa nhận hoàn tiền 9% tại ${lead.roomId?.address}`,
                    Icon: CheckCircle,
                    key: `${lead.userId?.username}-${lead.roomId?.address}`
                }));
                const uniqueStories = Array.from(new Map(stories.map(s => [s.key, s])).values());
                setSuccessStories(uniqueStories);

                // Stats
                setStats(statsRes.data);
            } catch (error) {
                console.error("Error fetching bar data:", error);
            }
        };
        fetchData();

        // 2. Setup Real-time updates
        const socketUrl = import.meta.env.MODE === 'development' ? "http://localhost:3000" : window.location.origin;
        const socket = io(socketUrl);

        socket.on('newGlobalLead', (data) => {
            const msg = { text: `${data.username} vừa đặt lịch xem phòng tại ${data.address}`, Icon: Zap };
            setRecentActivities(prev => [msg, ...prev].slice(0, 3));
            setStats(prev => ({ ...prev, totalLeads: prev.totalLeads + 1 }));
        });

        socket.on('newUserRegistered', (data) => {
            const msg = { text: `Chào mừng ${data.username} vừa gia nhập cộng đồng thành viên Pro`, Icon: UserPlus };
            setRecentActivities(prev => [msg, ...prev].slice(0, 3));
            setStats(prev => ({ ...prev, totalUsers: prev.totalUsers + 1 }));
        });

        socket.on('newCashbackReceived', (data) => {
            const key = `${data.username}-${data.address}`;
            const newStory = { 
                text: `CHÚC MỪNG: ${data.username} vừa nhận hoàn tiền 9% tại ${data.address}`, 
                Icon: CheckCircle,
                key: key
            };
            
            setSuccessStories(prev => {
                if (prev.some(s => s.key === key)) return prev;
                return [newStory, ...prev];
            });
        });

        return () => socket.disconnect();
    }, []);

    const staticMessages = [
        { text: "Tháng 4 bùng nổ: Hoàn tiền ngay 9% cho mọi hợp đồng ký mới", Icon: Sparkles },
        { text: `Hệ thống đã phục vụ hơn ${stats.totalLeads?.toLocaleString()} lượt khách ghé thăm`, Icon: Users },
        { text: `Cộng đồng ${stats.totalUsers?.toLocaleString()} thành viên đang tìm phòng`, Icon: UserPlus },
        { text: "Tím phòng trọ uy tín số 01 Hà Nội", Icon: TrendingUp },
    ];

    // Priority: Persistent Success Stories > Static Promos > ephemerial recent activities
    const allMessages = [...successStories, ...staticMessages, ...recentActivies];

    return (
        <div className="bg-rose-600 text-white overflow-hidden py-2.5 sticky top-0 z-[100] border-b border-rose-500 shadow-xl">
            <motion.div 
                animate={{ x: [0, -3500] }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                className="flex items-center gap-24 whitespace-nowrap px-4"
            >
                {allMessages.map((msg, i) => (
                    <div key={`msg-${i}`} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em]">
                        <msg.Icon size={14} className={msg.Icon === CheckCircle ? "text-emerald-300" : "text-rose-200"} />
                        <span className={msg.Icon === CheckCircle ? "text-white font-black" : "opacity-90 font-bold"}>
                            {msg.text}
                        </span>
                        <div className="w-1.5 h-1.5 bg-white/20 rounded-full mx-4"></div>
                    </div>
                ))}
                {/* Duplicates for seamless looping */}
                {allMessages.map((msg, i) => (
                    <div key={`dup-${i}`} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em]">
                        <msg.Icon size={14} className={msg.Icon === CheckCircle ? "text-emerald-300" : "text-rose-200"} />
                        <span className={msg.Icon === CheckCircle ? "text-white font-black" : "opacity-90 font-bold"}>
                            {msg.text}
                        </span>
                        <div className="w-1.5 h-1.5 bg-white/20 rounded-full mx-4"></div>
                    </div>
                ))}
            </motion.div>
        </div>
    );
};

export default AnnouncementBar;
