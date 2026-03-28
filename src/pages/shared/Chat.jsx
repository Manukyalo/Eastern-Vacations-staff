import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { Send, ChevronLeft, ShieldCheck, CheckCheck, Clock, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Chat = () => {
  const navigate = useNavigate();
  const { currentUser, role, driverProfile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef();

  const driverId = currentUser?.uid;
  const chatPath = `driverMessages/${driverId}/messages`;

  useEffect(() => {
    if (!driverId) return;

    const q = query(
      collection(db, chatPath),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      
      // Mark messages from admin as read
      const unreadAdminMsgs = snapshot.docs.filter(
        d => d.data().senderRole === 'admin' && !d.data().read
      );

      if (unreadAdminMsgs.length > 0) {
        const batch = writeBatch(db);
        unreadAdminMsgs.forEach(d => {
          batch.update(doc(db, chatPath, d.id), { read: true });
        });
        batch.commit();
      }
    });

    return () => unsubscribe();
  }, [driverId, chatPath]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const text = newMessage.trim();
    if (!text || !driverId || sending) return;

    try {
      setSending(true);
      setNewMessage(''); // Clear immediately for responsiveness

      const messageData = {
        text: text,
        senderId: driverId,
        senderName: driverProfile?.name || currentUser?.displayName || 'Staff Unit',
        senderRole: role || 'driver',
        timestamp: serverTimestamp(),
        read: false,
        type: 'text'
      };

      // 1. Add message to driver's subcollection
      const messagesRef = collection(db, 'driverMessages', driverId, 'messages');
      await addDoc(messagesRef, messageData);

      // 2. Update the main chat summary for admin list
      const chatRef = doc(db, 'driverMessages', driverId);
      await updateDoc(chatRef, {
        lastMessage: text,
        lastTimestamp: serverTimestamp(),
        driverName: driverProfile?.name || 'Staff Unit',
        driverRole: role || 'driver',
        updatedAt: serverTimestamp()
      }).catch(async () => {
        const { setDoc } = await import('firebase/firestore');
        await setDoc(chatRef, {
            driverId: driverId,
            driverName: driverProfile?.name || 'Staff Unit',
            driverRole: role || 'driver',
            lastMessage: text,
            lastTimestamp: serverTimestamp(),
            updatedAt: serverTimestamp()
        }, { merge: true });
      });

      // 3. Notify Admin
      await addDoc(collection(db, 'notifications'), {
        title: `💬 ${driverProfile?.name || 'Driver'}`,
        message: text.substring(0, 100),
        type: 'INFO',
        targetRole: 'admin',
        date: serverTimestamp(),
        read: false,
        driverId: driverId,
        driverName: driverProfile?.name || 'Driver'
      });

    } catch (error) {
      console.error("Message Transmission Error:", error);
      setNewMessage(text); // Restore text on failure
      
      if (error.code === 'permission-denied') {
        toast.error("Security blocks: Message not transmitted.");
      } else if (!navigator.onLine) {
        toast.error("Network offline. Message held in cache.");
      } else {
        toast.error("Failed to transmit message.");
      }
    } finally {
      setSending(false);
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '...';
    const date = ts.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isSameDay = (d1, d2) => {
     return d1.toDateString() === d2.toDateString();
  };

  const accentColor = role === 'safari_driver' ? 'bg-accent-green' : 'bg-accent-gold';
  const textAccentColor = role === 'safari_driver' ? 'text-accent-green' : 'text-accent-gold';
  const borderAccentColor = role === 'safari_driver' ? 'border-accent-green/20' : 'border-accent-gold/20';

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0A0F0D] max-w-md mx-auto relative overflow-hidden">
      {/* Premium Header */}
      <header className="p-6 bg-[#111A15] border-b border-white/5 flex items-center justify-between z-10 shrink-0 shadow-2xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2.5 bg-white/5 border border-white/10 rounded-xl active:scale-95 transition-all">
             <ChevronLeft size={20} className={textAccentColor} />
          </button>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-white/5 p-1.5 border border-white/5">
                <img src="/logo.png" alt="EV" className="w-full h-full object-contain opacity-50" />
             </div>
             <div>
                <h2 className="text-xl font-heading font-black text-white uppercase tracking-tighter leading-none">HQ <span className={textAccentColor}>COMMS</span></h2>
                <div className="flex items-center gap-1.5 mt-1">
                   <span className="w-1.5 h-1.5 bg-accent-green rounded-full animate-pulse" />
                   <p className="text-[8px] text-accent-green font-black uppercase tracking-widest">Encrypted Channel</p>
                </div>
             </div>
          </div>
        </div>
        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 text-[#8A9E8F]">
          <ShieldCheck size={20} />
        </div>
      </header>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide bg-[url('/grid.svg')] bg-repeat">
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === currentUser.uid;
          const isAdmin = msg.senderRole === 'admin';
          
          // Date Separator Logic
          const showDate = idx === 0 || !isSameDay(messages[idx-1].timestamp?.toDate() || new Date(), msg.timestamp?.toDate() || new Date());
          const dateStr = msg.timestamp ? new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).format(msg.timestamp.toDate()) : 'Today';

          return (
            <React.Fragment key={msg.id || idx}>
              {showDate && (
                <div className="flex justify-center my-4">
                   <span className="px-4 py-1.5 bg-white/5 border border-white/5 rounded-full text-[8px] font-black text-[#8A9E8F] uppercase tracking-[0.3em]">
                      {dateStr}
                   </span>
                </div>
              )}
              
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                <div className={`
                  relative max-w-[85%] p-5 rounded-[2rem] text-xs font-bold leading-relaxed shadow-2xl
                  ${isMe ? 
                    `${accentColor} text-[#0A0F0D] rounded-tr-none shadow-[0_15px_35px_rgba(0,0,0,0.3)]` : 
                    isAdmin ? 
                    'bg-[#1A2E20] border border-white/10 text-white rounded-tl-none' : 
                    'bg-white/5 border border-white/5 text-white rounded-tl-none'}
                `}>
                  {msg.text}
                  
                  {/* Message Decoration for Me */}
                  {isMe && (
                    <div className="absolute top-0 right-0 w-4 h-4 -mr-1 -mt-1 bg-white/20 rounded-full blur-lg" />
                  )}
                </div>

                <div className={`flex items-center gap-2 mt-2 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                   <span className="text-[9px] text-[#8A9E8F] font-black uppercase tracking-widest">
                     {isMe ? 'Expedition' : 'HQ COMMAND'} • {formatTime(msg.timestamp)}
                   </span>
                   {isMe && (
                     <div className={msg.read ? 'text-accent-green' : 'text-[#8A9E8F]/30'}>
                        <CheckCheck size={12} strokeWidth={3} />
                     </div>
                   )}
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={scrollRef} className="h-4" />
      </div>

      {/* Transmission Terminal */}
      <div className="shrink-0 p-6 pb-10 bg-[#111A15] border-t border-white/5 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        <form onSubmit={handleSendMessage} className="relative flex items-center gap-3">
           <div className="absolute left-5 text-white/20">
              <ImageIcon size={18} />
           </div>
           <input
             type="text"
             placeholder="Transmit encoded message..."
             value={newMessage}
             onChange={(e) => setNewMessage(e.target.value)}
             className="flex-1 bg-[#0A0F0D] border border-white/10 rounded-2xl py-5 pl-12 pr-6 text-white text-sm focus:border-accent-gold outline-none transition-all placeholder:text-white/10 font-bold"
           />
            <button 
              type="submit"
              disabled={!newMessage.trim() || sending}
              className={`w-14 h-14 ${accentColor} rounded-2xl flex items-center justify-center text-[#0A0F0D] shadow-[0_10px_25px_rgba(0,0,0,0.3)] active:scale-90 transition-all shrink-0 disabled:opacity-20 disabled:grayscale`}
            >
              {sending ? <div className="w-6 h-6 border-2 border-[#0A0F0D]/30 border-t-[#0A0F0D] rounded-full animate-spin" /> : <Send size={24} />}
            </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
