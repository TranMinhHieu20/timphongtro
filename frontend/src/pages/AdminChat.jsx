import React, { useState, useEffect, useRef } from 'react';
import { chatService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MessageSquare, Send, User, ChevronRight, ChevronLeft, Loader2, Sparkles, MapPin, X, Image as ImageIcon } from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const AdminChat = () => {
    const { user: currentUser, socket } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [selectedConv, setSelectedConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    
    // Search states
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const chatEndRef = useRef(null);

    // Use Global Socket Connection
    useEffect(() => {
        if (socket && currentUser) {
            const handleOnlineUsers = (users) => setOnlineUsers(users);
            const handleNewMessage = (message) => {
                // if message belongs to current selected conversation, add it
                if (selectedConv && message.conversationId === selectedConv._id) {
                    setMessages(prev => [...prev, message]);
                }
                // Refresh conversations list to show new last message/unread
                fetchConversations();
            };

            socket.on('getOnlineUsers', handleOnlineUsers);
            socket.on('newMessage', handleNewMessage);

            return () => {
                socket.off('getOnlineUsers', handleOnlineUsers);
                socket.off('newMessage', handleNewMessage);
            };
        }
    }, [socket, currentUser, selectedConv]);

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

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const resetImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if ((!inputText.trim() && !selectedImage) || !selectedConv || sending) return;

        const otherUser = getOtherUser(selectedConv);
        setSending(true);
        try {
            const formData = new FormData();
            if (inputText.trim()) formData.append('text', inputText);
            if (selectedImage) formData.append('image', selectedImage);
            formData.append('receiverId', otherUser._id);

            const res = await chatService.sendMessage(formData);
            
            // If it was a new conversation, we need to refresh list and find the real ID
            if (selectedConv._id === 'new') {
                const convs = await chatService.getConversations();
                setConversations(convs.data);
                const newRealConv = convs.data.find(c => c.lastMessage?._id === res.data._id);
                if (newRealConv) setSelectedConv(newRealConv);
            }

            setMessages(prev => [...prev, res.data]);
            setInputText('');
            resetImage();
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
        <div className="flex flex-col gap-4 md:gap-8 h-[calc(100dvh-120px)] md:h-[calc(100vh-200px)]">
            <div className="space-y-1 md:space-y-2 shrink-0">
                <h2 className="text-2xl md:text-5xl font-black text-white tracking-tight">Hệ thống Chat</h2>
                <p className="text-[10px] md:text-sm text-slate-500 font-medium">Phản hồi khách hàng nhanh chóng để tăng tỷ lệ chốt phòng.</p>
            </div>

            <div className="flex-1 flex bg-slate-900/40 backdrop-blur-md rounded-[2rem] md:rounded-[3rem] border border-white/5 overflow-hidden relative">
                {/* Conversations Sidebar */}
                <div className={`${selectedConv ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r border-white/5 flex-col bg-slate-900/40 md:bg-transparent`}>
                    <div className="p-4 md:p-6 border-b border-white/5 bg-slate-950/20 relative">
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
                                    className="absolute left-4 right-4 md:left-6 md:right-6 top-full z-50 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl max-h-60 overflow-y-auto"
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
                    
                    <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-1 md:space-y-2">
                        {loading ? (
                            <div className="flex justify-center p-10"><Loader2 className="animate-spin text-rose-500" /></div>
                        ) : conversations.length === 0 ? (
                            <div className="text-center p-10 opacity-30">
                                <p className="text-[10px] font-black uppercase tracking-widest">Chưa có hội thoại nào</p>
                            </div>
                        ) : conversations.map(conv => {
                            const user = getOtherUser(conv);
                            const isActive = selectedConv?._id === conv._id;
                            return (
                                <button 
                                    key={conv._id}
                                    onClick={() => setSelectedConv(conv)}
                                    className={`w-full flex items-center gap-3 p-3 md:p-4 rounded-[1.5rem] md:rounded-2xl transition-all ${isActive ? 'bg-rose-500 shadow-lg shadow-rose-500/20 translate-x-1' : 'hover:bg-white/5'}`}
                                >
                                    <div className="relative shrink-0">
                                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-800 flex items-center justify-center font-black border-2 border-white/10 overflow-hidden capitalize">
                                            {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : (user.username?.[0] || 'U')}
                                        </div>
                                        {onlineUsers.includes(user._id) && (
                                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900"></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <p className={`font-black text-xs md:text-sm truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>{user.username || 'Vô danh'}</p>
                                            {conv.unreadCount > 0 && !isActive && (
                                                <span className="w-5 h-5 bg-emerald-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-slate-900 shrink-0">
                                                    {conv.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-[10px] font-bold truncate ${isActive ? 'text-white/70' : 'text-slate-500'}`}>
                                            {conv.lastMessage?.sender === currentUser?._id ? 'Bạn: ' : ''}
                                            {conv.lastMessage?.text || (conv.lastMessage?.image ? 'Đã gửi một ảnh' : 'Bắt đầu trò chuyện')}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Chat Window */}
                <div className={`${selectedConv ? 'flex' : 'hidden md:flex'} flex-1 flex flex-col bg-slate-950/20 relative w-full`}>
                    {selectedConv ? (
                        <>
                           {/* Chat Header */}
                           <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3 md:gap-4">
                                    <button 
                                        onClick={() => setSelectedConv(null)}
                                        className="md:hidden p-2 hover:bg-white/5 rounded-xl text-slate-400"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    {(() => {
                                        const otherUser = getOtherUser(selectedConv);
                                        return (
                                            <>
                                                <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-slate-800 flex items-center justify-center font-black border-2 border-white/10 overflow-hidden capitalize shrink-0">
                                                    {otherUser.avatar ? <img src={otherUser.avatar} className="w-full h-full object-cover" /> : (otherUser.username?.[0] || 'U')}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-white font-black text-sm md:text-base truncate">{otherUser.username || 'Khách hàng'}</h4>
                                                    <p className="text-[8px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">{otherUser.email || 'Chuyên viên'}</p>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                                <div className="flex items-center gap-2">
                                     {onlineUsers.includes(getOtherUser(selectedConv)._id) && (
                                         <span className="flex items-center gap-1 md:gap-2 bg-emerald-500/10 text-emerald-500 text-[8px] md:text-[10px] font-black px-2 md:px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest">
                                             <span className="w-1 md:w-1.5 h-1 md:h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                             <span className="hidden sm:inline">Trực tuyến</span>
                                             <span className="sm:hidden">Online</span>
                                         </span>
                                     )}
                                </div>
                           </div>
                           {/* Messages Area */}
                           <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-6">
                                 {messages.map((msg, idx) => {
                                    const otherUser = getOtherUser(selectedConv);
                                    const isMe = (msg.sender?._id?.toString() || msg.sender) !== (otherUser._id?.toString() || otherUser);
                                    return (
                                        <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] space-y-2`}>
                                                <div className={`p-4 rounded-3xl text-sm font-medium ${
                                                    isMe 
                                                    ? 'bg-rose-500 text-white rounded-tr-none shadow-xl shadow-rose-500/20' 
                                                    : 'bg-slate-900 border border-white/5 text-slate-300 rounded-tl-none'
                                                }`}>
                                                    {msg.text}
                                                    {msg.image && (
                                                        <div 
                                                            className={`mt-2 rounded-2xl overflow-hidden cursor-zoom-in active:scale-95 transition-transform ${msg.text ? '' : '-m-1'}`}
                                                            onClick={() => setPreviewImage(msg.image)}
                                                        >
                                                            <img src={msg.image} alt="Chat" className="max-w-full h-auto object-cover" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={chatEndRef} />
                           </div>

                           {/* Full Screen Image Preview */}
                           <AnimatePresence>
                               {previewImage && (
                                   <motion.div 
                                       initial={{ opacity: 0 }}
                                       animate={{ opacity: 1 }}
                                       exit={{ opacity: 0 }}
                                       onClick={() => setPreviewImage(null)}
                                       className="fixed inset-0 z-[2000] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10 cursor-zoom-out"
                                   >
                                       <motion.img 
                                           initial={{ scale: 0.9 }}
                                           animate={{ scale: 1 }}
                                           exit={{ scale: 0.9 }}
                                           src={previewImage} 
                                           className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                                       />
                                       <button className="absolute top-10 right-10 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all">
                                           <X size={24} />
                                       </button>
                                   </motion.div>
                               )}
                           </AnimatePresence>

                           {/* Image Preview Overlay */}
                           <AnimatePresence>
                               {imagePreview && (
                                   <motion.div 
                                       initial={{ opacity: 0, y: 10 }}
                                       animate={{ opacity: 1, y: 0 }}
                                       exit={{ opacity: 0, y: 10 }}
                                       className="mx-6 p-4 rounded-2xl bg-slate-900/80 border border-white/5 flex items-center justify-between mb-4"
                                   >
                                       <div className="flex items-center gap-4">
                                           <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10">
                                               <img src={imagePreview} className="w-full h-full object-cover" />
                                           </div>
                                           <div>
                                               <p className="text-white text-xs font-black uppercase tracking-tight truncate max-w-[200px]">{selectedImage?.name}</p>
                                               <p className="text-[10px] text-slate-500 font-bold uppercase">Sẵn sàng gửi</p>
                                           </div>
                                       </div>
                                       <button onClick={resetImage} className="p-3 bg-white/5 hover:bg-rose-500 text-slate-400 hover:text-white rounded-full transition-all cursor-pointer">
                                           <X size={16} />
                                       </button>
                                   </motion.div>
                               )}
                           </AnimatePresence>

                           {/* Chat Input */}
                           <form onSubmit={handleSend} className="p-3 md:p-6 bg-slate-950/40 border-t border-white/10 flex gap-2 md:gap-4 items-center shrink-0">
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    className="hidden"
                                    id="admin-chat-image"
                                    onChange={handleImageSelect}
                                />
                                <label htmlFor="admin-chat-image" className="p-3 md:p-4 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl md:rounded-2xl transition-all cursor-pointer">
                                    <ImageIcon size={20} className="w-5 h-5 md:w-6 md:h-6" />
                                </label>
                                <input 
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Nhập phản hồi..."
                                    className="flex-1 min-w-0 bg-slate-900/50 border border-white/5 rounded-xl md:rounded-2xl px-4 py-3 md:px-6 md:py-4 text-xs md:text-sm text-white focus:outline-none focus:ring-1 focus:ring-rose-500/50"
                                />
                                <button 
                                    type="submit"
                                    disabled={sending || (!inputText.trim() && !selectedImage)}
                                    className="px-4 md:px-8 h-10 md:h-12 bg-rose-500 hover:bg-rose-600 text-white rounded-xl md:rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-rose-500/20 disabled:opacity-50 shrink-0 flex items-center justify-center min-w-[50px]"
                                >
                                    {sending ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} className="md:hidden" /><span className="hidden md:inline">Gửi</span></>}
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
