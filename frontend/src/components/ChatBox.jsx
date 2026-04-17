import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, User, Sparkles, Loader2, Image as ImageIcon } from 'lucide-react';
import { chatService } from '../services/api';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';


const ChatBox = ({ currentUser }) => {
  const { socket } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef(null);
  const constraintsRef = useRef(null);   // drag boundary = viewport
  const isDragging = useRef(false);       // distinguish tap from drag

  // Use Global Socket Connection
  useEffect(() => {
    if (socket && currentUser && currentUser.role !== 'admin') {
      const handleNewMessage = (message) => {
        setMessages(prev => [...prev, message]);
        if (!isOpen) {
          setUnreadCount(prev => prev + 1);
        }
      };

      socket.on('newMessage', handleNewMessage);
      return () => socket.off('newMessage', handleNewMessage);
    }
  }, [socket, currentUser, isOpen]);

  // Handle global open event from Toast
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('openChat', handleOpen);
    return () => window.removeEventListener('openChat', handleOpen);
  }, []);

  // Sync open state to global for Toast suppression
  useEffect(() => {
    window.isChatOpen = isOpen;
  }, [isOpen]);

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
    if ((!inputText.trim() && !selectedImage) || sending) return;

    setSending(true);
    try {
      const formData = new FormData();
      if (inputText.trim()) formData.append('text', inputText);
      if (selectedImage) formData.append('image', selectedImage);
      formData.append('receiverId', 'admin');

      const res = await chatService.sendMessage(formData);
      setMessages(prev => [...prev, res.data]);
      setInputText('');
      resetImage();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  if (currentUser?.role === 'admin') return null; // Admin uses a different UI

  return (
    <>
      {/* Invisible full-screen drag boundary */}
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[997]" />

      {/* Chat Panel — always fixed to viewport bottom-right, independent of bubble position */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed inset-0 sm:inset-auto sm:bottom-[72px] sm:right-4 md:right-8 w-full sm:w-[350px] md:w-[380px] h-[100dvh] sm:h-[70vh] md:h-[600px] bg-slate-900 sm:border border-white/10 sm:rounded-[2.5rem] shadow-2xl sm:shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden backdrop-blur-xl z-[1001]"
          >
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-rose-500/10 to-transparent border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
                    <Sparkles size={20} className="text-white" />
                </div>
                <div>
                   <h3 className="text-white font-black text-sm uppercase tracking-wider">H&#x1ED7; tr&#x1EE3; 24/7</h3>
                   <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">&#x110;ang tr&#x1EF1;c tuy&#x1EBF;n</span>
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
                className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4 scrollbar-hide"
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-40">
                    <MessageCircle size={40} className="text-slate-500" />
                    <p className="text-xs font-medium text-slate-500 max-w-[200px]">Ch&#xE0;o b&#x1EA1;n, h&#xE3;y nh&#x1EAF;n tin n&#x1EBF;u b&#x1EA1;n c&#x1EA7;n h&#x1ED7; tr&#x1EE3; v&#x1EC1; ph&#xF2;ng tr&#x1ECD; nh&#xE9;!</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.sender?._id?.toString() === currentUser?._id?.toString() || msg.sender === currentUser?._id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] space-y-2`}>
                      <div className={`p-3 rounded-2xl text-sm font-medium ${
                        msg.sender?._id?.toString() === currentUser?._id?.toString() || msg.sender === currentUser?._id
                          ? 'bg-rose-500 text-white rounded-tr-none shadow-lg shadow-rose-500/10'
                          : 'bg-white/5 text-slate-200 border border-white/5 rounded-tl-none'
                      }`}>
                        {msg.text}
                        {msg.image && (
                          <div
                            className={`mt-2 rounded-xl overflow-hidden cursor-zoom-in active:scale-95 transition-transform ${msg.text ? '' : '-m-1'}`}
                            onClick={() => setPreviewImage(msg.image)}
                          >
                             <img src={msg.image} alt="Chat" className="max-w-full h-auto object-cover rounded-lg" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
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

            {/* Image Preview before sending */}
            <AnimatePresence>
                {imagePreview && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="px-4 py-2 border-t border-white/5 bg-slate-900/80 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10">
                                <img src={imagePreview} className="w-full h-full object-cover" />
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[150px]">{selectedImage?.name}</span>
                        </div>
                        <button onClick={resetImage} className="p-2 bg-rose-500/10 text-rose-500 rounded-full hover:bg-rose-500 hover:text-white transition-colors">
                            <X size={14} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-3 pb-6 sm:p-4 bg-slate-950/50 border-t border-white/5 flex gap-2 items-center relative shrink-0">
               {!currentUser ? (
                  <p className="text-[10px] text-slate-500 text-center w-full font-bold uppercase tracking-widest">Vui l&#xF2;ng &#x111;&#x103;ng nh&#x1EAD;p &#x111;&#x1EC3; chat</p>
               ) : (
                 <>
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="chat-image-upload"
                        onChange={handleImageSelect}
                    />
                    <label
                        htmlFor="chat-image-upload"
                        className="p-3 text-slate-500 hover:text-white transition-colors cursor-pointer"
                    >
                        <ImageIcon size={20} />
                    </label>
                    <input
                        type="text"
                        placeholder="Nh&#x1EAD;p n&#x1ED9;i dung..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="flex-1 bg-slate-900/50 border border-white/5 rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500/50 placeholder:text-slate-600"
                    />
                    <button
                        type="submit"
                        disabled={sending || (!inputText.trim() && !selectedImage)}
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

      {/* Draggable Chat Bubble — smaller on mobile, draggable on mobile */}
      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragMomentum={false}
        dragElastic={0.08}
        onDragStart={() => { isDragging.current = true; }}
        onDragEnd={() => { setTimeout(() => { isDragging.current = false; }, 80); }}
        className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[999] touch-none"
        style={{ x: 0, y: 0 }}
      >
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => { if (!isDragging.current) setIsOpen(!isOpen); }}
          className="w-13 h-13 md:w-16 md:h-16 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-2xl shadow-rose-600/30 hover:bg-rose-600 transition-colors border-2 border-white/20 relative active:bg-rose-600"
        >
          <AnimatePresence mode='wait'>
            {isOpen
              ? <X key="x" size={20} className="md:w-7 md:h-7" />
              : (
                <div className="relative">
                  <MessageCircle key="m" size={22} className="md:w-[30px] md:h-[30px]" fill="currentColor" />
                  {!isOpen && unreadCount === 0 && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 md:w-3.5 md:h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full shadow-lg"></div>
                  )}
                </div>
              )
            }
          </AnimatePresence>

          {/* Unread Badge */}
          {!isOpen && unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[9px] md:text-[10px] font-black w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-lg"
            >
              {unreadCount}
            </motion.div>
          )}
        </motion.button>
      </motion.div>
    </>
  );
};


export default ChatBox;
