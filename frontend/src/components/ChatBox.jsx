import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, User, Sparkles, Loader2 } from 'lucide-react';
import { chatService } from '../services/api';
import { io } from 'socket.io-client';

const ChatBox = ({ currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef(null);
  const socketRef = useRef(null);

  // Socket Connection
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      const socketUrl = import.meta.env.MODE === 'development' ? "http://localhost:3000" : window.location.origin;
      socketRef.current = io(socketUrl, {
        query: { userId: currentUser._id }
      });

      socketRef.current.on('newMessage', (message) => {
        // Play notification sound
        new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3').play().catch(e => {});
        
        setMessages(prev => [...prev, message]);
        if (!isOpen) {
          setUnreadCount(prev => prev + 1);
        }
      });

      return () => {
        if (socketRef.current) socketRef.current.disconnect();
      };
    }
  }, [currentUser]);

  // Load initial messages when opened
  useEffect(() => {
    if (isOpen && currentUser && currentUser.role !== 'admin') {
      fetchMessages();
      setUnreadCount(0); // Clear unread when opened
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await chatService.getMessages('admin');
      setMessages(res.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    setSending(true);
    try {
      const res = await chatService.sendMessage({
        text: inputText,
        receiverId: 'admin'
      });
      setMessages(prev => [...prev, res.data]);
      setInputText('');
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  if (currentUser?.role === 'admin') return null; // Admin uses a different UI

  return (
    <div className="fixed bottom-8 right-8 z-[999]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-20 right-0 w-[350px] h-[500px] bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl"
          >
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-rose-500/10 to-transparent border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
                    <Sparkles size={20} className="text-white" />
                </div>
                <div>
                   <h3 className="text-white font-black text-sm uppercase tracking-wider">Hỗ trợ 24/7</h3>
                   <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Đang trực tuyến</span>
                   </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide"
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-40">
                    <MessageCircle size={40} className="text-slate-500" />
                    <p className="text-xs font-medium text-slate-500 max-w-[200px]">Chào bạn, hãy nhắn tin nếu bạn cần hỗ trợ về phòng trọ nhé!</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div 
                    key={idx}
                    className={`flex ${msg.sender === currentUser?._id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm font-medium ${
                      msg.sender === currentUser?._id 
                        ? 'bg-rose-500 text-white rounded-tr-none shadow-lg shadow-rose-500/10' 
                        : 'bg-white/5 text-slate-200 border border-white/5 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-slate-950/50 border-t border-white/5 flex gap-2 items-center">
               {!currentUser ? (
                  <p className="text-[10px] text-slate-500 text-center w-full font-bold uppercase tracking-widest">Vui lòng đăng nhập để chat</p>
               ) : (
                 <>
                    <input 
                        type="text"
                        placeholder="Nhập nội dung..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="flex-1 bg-slate-900/50 border border-white/5 rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500/50 placeholder:text-slate-600"
                    />
                    <button 
                        type="submit"
                        disabled={sending || !inputText.trim()}
                        className="p-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-rose-500/20"
                    >
                        {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                 </>
               )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Toggle Bubble */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-2xl shadow-rose-600/30 hover:bg-rose-600 transition-colors border-2 border-white/20 relative"
      >
        <AnimatePresence mode='wait'>
          {isOpen ? <X key="x" size={28} /> : (
            <div className="relative">
              <MessageCircle key="m" size={30} fill="currentColor" />
              {/* Online status dot - only show if NO unread messages */}
              {!isOpen && unreadCount === 0 && (
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full shadow-lg"></div>
              )}
            </div>
          )}
        </AnimatePresence>
        
        {/* Unread Badge */}
        {!isOpen && unreadCount > 0 && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-lg"
          >
            {unreadCount}
          </motion.div>
        )}
      </motion.button>
    </div>
  );
};

export default ChatBox;
