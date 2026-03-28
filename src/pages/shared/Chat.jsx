import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { Send, ChevronLeft, ShieldCheck, CheckCheck, Clock, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Chat = () => {
  const navigate = useNavigate();
  const { currentUser, role, driverProfile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
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
      
      // Auto-scroll logic
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 100);

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

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const text = newMessage.trim();
    if (!text || !driverId || sending) return;

    try {
      setSending(true);
      setNewMessage(''); 

      const messageData = {
        text: text,
        senderId: driverId,
        senderName: driverProfile?.name || currentUser?.displayName || 'Staff Unit',
        senderRole: role || 'driver',
        timestamp: serverTimestamp(),
        read: false,
        type: 'text',
        status: 'sent'
      };

      const messagesRef = collection(db, 'driverMessages', driverId, 'messages');
      await addDoc(messagesRef, messageData);

      const chatRef = doc(db, 'driverMessages', driverId);
      await updateDoc(chatRef, {
        lastMessage: text,
        lastTimestamp: serverTimestamp(),
        driverName: driverProfile?.name || 'Staff Unit',
        driverRole: role || 'driver',
        updatedAt: serverTimestamp(),
        isDeleted: false
      }).catch(async () => {
        const { setDoc } = await import('firebase/firestore');
        await setDoc(chatRef, {
            driverId: driverId,
            driverName: driverProfile?.name || 'Staff Unit',
            driverRole: role || 'driver',
            lastMessage: text,
            lastTimestamp: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isDeleted: false
        }, { merge: true });
      });

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
      setNewMessage(text);
      toast.error("Transmission Interrupted.");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '...';
    try {
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return 'Now'; }
  };

  const isSameDay = (d1, d2) => {
     if (!d1 || !d2) return true;
     return d1.toDateString() === d2.toDateString();
  };

  const accentColor = role === 'safari_driver' ? 'bg-[#C9A84C]' : 'bg-[#D4AF37]';
  const textAccentColor = role === 'safari_driver' ? 'text-[#C9A84C]' : 'text-[#D4AF37]';

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0A0F0D] max-w-md mx-auto relative overflow-hidden font-dm-sans">
      
      {/* Premium Header */}
      <header className="p-6 bg-[#111A15] border-b border-white/5 flex items-center justify-between z-10 shrink-0 shadow-2xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2.5 bg-white/5 border border-white/10 rounded-xl active:scale-95 transition-all">
             <ChevronLeft size={20} className={textAccentColor} />
          </button>
          <div className="flex items-center gap-3">
             <div className="flex flex-col">
                <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-none">HQ <span className={textAccentColor}>COMMS</span></h2>
                <div className="flex items-center gap-1.5 mt-2">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                   <p className="text-[8px] text-[#8A9E8F] font-black uppercase tracking-[0.2em]">Signal Secured: Level 5</p>
                </div>
             </div>
          </div>
        </div>
        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 text-[#8A9E8F]">
          <ShieldCheck size={20} />
        </div>
      </header>

      {/* Message Feed */}
      <div 
         className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar bg-[url('/grid.svg')] bg-repeat shadow-inner"
      >
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === currentUser.uid;
          const isAdmin = msg.senderRole === 'admin';
          
          const msgDate = msg.timestamp?.toDate ? msg.timestamp.toDate() : (msg.timestamp ? new Date(msg.timestamp) : new Date());
          const prevMsgDate = idx > 0 ? (messages[idx-1].timestamp?.toDate ? messages[idx-1].timestamp.toDate() : new Date(messages[idx-1].timestamp)) : null;
          const showDate = idx === 0 || !isSameDay(prevMsgDate, msgDate);
          
          const dateStr = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).format(msgDate);

          return (
            <React.Fragment key={msg.id || idx}>
              {showDate && (
                <div className="flex justify-center my-6">
                   <span className="px-4 py-2 bg-white/5 border border-white/5 rounded-full text-[8px] font-black text-white/30 uppercase tracking-[0.4em]">
                      {dateStr}
                   </span>
                </div>
              )}
              
              <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                <div className={`max-w-[85%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`
                    p-4 rounded-[24px] text-xs font-bold leading-relaxed shadow-2xl transition-all
                    ${isMe ? 
                      `${accentColor} text-[#0A0F0D] rounded-tr-none shadow-[#C9A84C0A]` : 
                      isAdmin ? 
                      'bg-[#1A2E20] border border-emerald-500/10 text-white rounded-tl-none' : 
                      'bg-white/5 border border-white/5 text-white rounded-tl-none'}
                  `}>
                    {msg.text}
                  </div>

                  <div className={`flex items-center gap-2 mt-2 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                     <span className="text-[8px] text-[#8A9E8F] font-black uppercase tracking-[0.15em] opacity-40">
                       {isMe ? 'Expedition Ops' : 'HQ COMMAND'} • {formatTime(msg.timestamp)}
                     </span>
                     {isMe && (
                       <div className={msg.read ? 'text-emerald-500' : 'text-white/10'}>
                          <CheckCheck size={10} strokeWidth={3} />
                       </div>
                     )}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={scrollRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="shrink-0 p-6 pb-12 bg-[#111A15] border-t border-white/5 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        <form onSubmit={handleSendMessage} className="relative flex items-center gap-3">
           <input
             type="text"
             placeholder="Transmit encoded signal..."
             value={newMessage}
             onChange={(e) => setNewMessage(e.target.value)}
             className="flex-1 bg-[#0A0F0D] border border-white/10 rounded-2xl py-5 px-6 text-white text-sm focus:border-safari-gold outline-none transition-all placeholder:text-white/10 font-bold"
           />
            <button 
              type="submit"
              disabled={!newMessage.trim() || sending}
              className={`w-14 h-14 ${accentColor} rounded-2xl flex items-center justify-center text-[#0A0F0D] shadow-[0_10px_25px_rgba(0,0,0,0.3)] active:scale-90 transition-all shrink-0 disabled:opacity-20 disabled:grayscale`}
            >
              {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
