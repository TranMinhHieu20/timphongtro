import React, { useState, useEffect, useRef } from 'react';
import { chatService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MessageSquare, Send, User, ChevronRight, Loader2, Sparkles, MapPin, X } from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const AdminChat = () => {
    const { user: currentUser } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [selectedConv, setSelectedConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    console.log(selectedConv)
    
    // Search states
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);

    const chatEndRef = useRef(null);
    const socketRef = useRef(null);

    // Socket Connection
    useEffect(() => {
        if (currentUser) {
            const socketUrl = import.meta.env.MODE === 'development' ? "http://localhost:3000" : window.location.origin;
            socketRef.current = io(socketUrl, {
                query: { userId: currentUser._id }
            });

            socketRef.current.on('getOnlineUsers', (users) => {
                setOnlineUsers(users);
            });

            socketRef.current.on('newMessage', (message) => {
                // Play notification sound
                new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3').play().catch(e => {});

                // if message belongs to current selected conversation, add it
                if (selectedConv && message.conversationId === selectedConv._id) {
                    setMessages(prev => [...prev, message]);
                }
                // Refresh conversations list to show new last message/unread
                fetchConversations();
            });

            return () => {
                if (socketRef.current) socketRef.current.disconnect();
            };
        }
    }, [currentUser, selectedConv]);

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        if (selectedConv) {
            const otherUser = getOtherUser(selectedConv);
            
            if (otherUser._id) fetchMessages(otherUser._id);
        }
    }, [selectedConv]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery.trim()) {
                handleSearch();
            } else {
                setSearchResults([]);
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleSearch = async () => {
        setIsSearching(true);
        try {
            const res = await chatService.searchUsers(searchQuery);
            setSearchResults(res.data);
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const fetchConversations = async () => {
        try {
            const res = await chatService.getConversations();
            setConversations(res.data);
        } catch (error) {
            console.error("Error fetching conversations:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (userId) => {
        try {
            const res = await chatService.getMessages(userId);
            setMessages(res.data);
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    const handleSelectUserFromSearch = async (user) => {
        setSearchQuery('');
        setSearchResults([]);
        // Try to find if conversation exists
        const existingConv = conversations.find(c => 
            c.participants.some(p => p._id === user._id)
        );

        if (existingConv) {
            setSelectedConv(existingConv);
        } else {
            // Create a "virtual" conversation or just fetch messages to trigger backend creation
            // For simplicity, we just set a selected user state and trigger sendMessage
            setSelectedConv({
                _id: 'new',
                participants: [currentUser, user],
                lastMessage: null
            });
            setMessages([]);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!inputText.trim() || !selectedConv || sending) return;

        const otherUser = getOtherUser(selectedConv);
        setSending(true);
        try {
            const res = await chatService.sendMessage({
                text: inputText,
                receiverId: otherUser._id
            });
            
            // If it was a new conversation, we need to refresh list and find the real ID
            if (selectedConv._id === 'new') {
                const convs = await chatService.getConversations();
                setConversations(convs.data);
                const newRealConv = convs.data.find(c => c.lastMessage?._id === res.data._id);
                if (newRealConv) setSelectedConv(newRealConv);
            }

            setMessages(prev => [...prev, res.data]);
            setInputText('');
            fetchConversations();
        } catch (error) {
            console.error("Error sending:", error);
        } finally {
            setSending(false);
        }
    };

    const getOtherUser = (conv) => {
        if (!conv) return {};
        return conv.participants.find(p => p._id !== currentUser?._id) || {};
    };

    return (
        <div className="flex flex-col gap-8 h-[calc(100vh-200px)]">
            <div className="space-y-2">
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">Hệ thống Chat</h2>
                <p className="text-slate-500 font-medium">Phản hồi khách hàng nhanh chóng để tăng tỷ lệ chốt phòng.</p>
            </div>

            <div className="flex-1 flex bg-slate-900/40 backdrop-blur-md rounded-[3rem] border border-white/5 overflow-hidden">
                {/* Conversations Sidebar */}
                <div className="w-80 border-r border-white/5 flex flex-col">
                    <div className="p-6 border-b border-white/5 bg-slate-950/20 relative">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm khách hàng..."
                                className="w-full bg-slate-900 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-xs font-bold text-white focus:ring-1 focus:ring-rose-500/50"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Search Results Dropdown */}
                        <AnimatePresence>
                            {(searchResults.length > 0 || isSearching) && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 5 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute left-6 right-6 top-full z-50 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl max-h-60 overflow-y-auto"
                                >
                                    {isSearching ? (
                                        <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-rose-500" size={16} /></div>
                                    ) : searchResults.map(u => (
                                        <button 
                                            key={u._id}
                                            onClick={() => handleSelectUserFromSearch(u)}
                                            className="w-full flex items-center gap-3 p-3 hover:bg-white/5 text-left transition-colors border-b border-white/5 last:border-0"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-black uppercase">
                                                {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover rounded-full" /> : (u.username?.[0] || 'U')}
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black text-white">{u.username}</p>
                                                <p className="text-[9px] text-slate-500 font-bold">{u.email}</p>
                                            </div>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {loading ? (
                            <div className="flex justify-center p-10"><Loader2 className="animate-spin text-rose-500" /></div>
                        ) : conversations.length === 0 ? (
                            <div className="text-center p-10 opacity-30">
                                <p className="text-[10px] font-black uppercase tracking-widest">Chưa có hội thoại nào</p>
                            </div>
                        ) : conversations.map(conv => {
                            const user = getOtherUser(conv);
                            const isActive = selectedConv?._id === conv._id;
                            const isOnline = onlineUsers.includes(user._id);

                            return (
                                <button 
                                    key={conv._id}
                                    onClick={() => setSelectedConv(conv)}
                                    className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all group ${isActive ? 'bg-rose-500 shadow-xl shadow-rose-500/20' : 'hover:bg-white/5'}`}
                                >
                                    <div className="relative shrink-0">
                                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center font-black overflow-hidden border-2 border-white/10 capitalize">
                                            {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : (user.username?.[0] || 'U')}
                                        </div>
                                        {isOnline && (
                                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <p className={`font-black text-sm truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>{user.username || 'Vô danh'}</p>
                                            {conv.unreadCount > 0 && !isActive && (
                                                <span className="w-5 h-5 bg-emerald-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-slate-900 shrink-0">
                                                    {conv.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-[10px] font-bold truncate ${isActive ? 'text-white/70' : 'text-slate-500'}`}>
                                            {conv.lastMessage?.sender === currentUser?._id ? 'Bạn: ' : ''}
                                            {conv.lastMessage?.text || 'Bắt đầu trò chuyện'}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Chat Window */}
                <div className="flex-1 flex flex-col bg-slate-950/20 relative">
                    {selectedConv ? (
                        <>
                           {/* Chat Header */}
                           <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {(() => {
                                        const otherUser = getOtherUser(selectedConv);
                                        return (
                                            <>
                                                <div className="w-11 h-11 rounded-full bg-slate-800 flex items-center justify-center font-black border-2 border-white/10 overflow-hidden capitalize shrink-0">
                                                    {otherUser.avatar ? <img src={otherUser.avatar} className="w-full h-full object-cover" /> : (otherUser.username?.[0] || 'U')}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-white font-black text-base truncate">{otherUser.username || 'Khách hàng'}</h4>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">{otherUser.email || 'Chưa cập nhật email'}</p>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                                <div className="flex items-center gap-2">
                                     {onlineUsers.includes(getOtherUser(selectedConv)._id) && (
                                         <span className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest">
                                             <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                             Trực tuyến
                                         </span>
                                     )}
                                </div>
                           </div>

                           {/* Messages Area */}
                           <div className="flex-1 overflow-y-auto p-8 space-y-6">
                                {messages.map((msg, idx) => {
                                    const isMe = msg.sender !== getOtherUser(selectedConv)._id;
                                    return (
                                        <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] p-4 rounded-3xl text-sm font-medium ${
                                                isMe 
                                                ? 'bg-rose-500 text-white rounded-tr-none shadow-xl shadow-rose-500/20' 
                                                : 'bg-slate-900 border border-white/5 text-slate-300 rounded-tl-none'
                                            }`}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={chatEndRef} />
                           </div>

                           {/* Chat Input */}
                           <form onSubmit={handleSend} className="p-6 bg-slate-950/40 border-t border-white/10 flex gap-4">
                                <input 
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Nhập phản hồi cho khách..."
                                    className="flex-1 bg-slate-900/50 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-rose-500/50"
                                />
                                <button 
                                    type="submit"
                                    disabled={sending || !inputText.trim()}
                                    className="px-8 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-rose-500/20 disabled:opacity-50"
                                >
                                    {sending ? <Loader2 className="animate-spin" size={18} /> : 'Gửi'}
                                </button>
                           </form>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-30 gap-4">
                             <div className="p-10 bg-slate-900 rounded-[3rem] border border-white/5">
                                <MessageSquare size={64} className="text-slate-500" />
                             </div>
                             <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-xs">Hãy chọn một khách hàng để bắt đầu</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminChat;
