import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { Send, User, ShieldCheck, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Chat = ({ role = 'driver' }) => {
  const navigate = useNavigate();
  const { currentUser, driverProfile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef();

  useEffect(() => {
    if (!currentUser) return;
    
    // In a real app, this would be a specific room or thread with admin
    const q = query(
      collection(db, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return unsub;
  }, [currentUser]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageData = {
      text: newMessage,
      senderId: currentUser.uid,
      senderName: driverProfile?.name || 'Driver',
      senderRole: role,
      timestamp: serverTimestamp(),
      type: 'text'
    };

    setNewMessage('');
    try {
      await addDoc(collection(db, 'messages'), messageData);
    } catch (err) {
      console.error("Message send failed:", err);
    }
  };

  const accentColor = role === 'safari_driver' ? 'bg-accent-green' : 'bg-accent-gold';
  const textAccentColor = role === 'safari_driver' ? 'text-accent-green' : 'text-accent-gold';

  return (
    <div className="flex flex-col h-screen bg-primary-dark max-w-md mx-auto relative overflow-hidden">
      {/* Chat Header */}
      <header className="p-6 bg-surface border-b border-border flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-card border border-white/5 rounded-xl">
             <ChevronLeft size={20} className={textAccentColor} />
          </button>
          <div>
            <h2 className="text-xl font-heading font-black text-white uppercase tracking-tight">HQ <span className={textAccentColor}>COMMS</span></h2>
            <p className="text-[10px] text-success font-black uppercase tracking-widest flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
              Secure Channel Active
            </p>
          </div>
        </div>
        <div className="w-10 h-10 bg-card rounded-xl flex items-center justify-center border border-border/50 text-text-muted">
          <ShieldCheck size={20} />
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide pb-32">
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === currentUser.uid;
          const isAdmin = msg.senderRole === 'admin';

          return (
            <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className={`
                max-w-[85%] p-4 rounded-[1.5rem] text-sm font-medium
                ${isMe ? `${accentColor} text-primary-dark rounded-tr-none` : isAdmin ? 'bg-card border border-accent-gold/20 text-white rounded-tl-none' : 'bg-surface border border-border text-white rounded-tl-none'}
              `}>
                {msg.text}
              </div>
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1.5 px-1">
                {isMe ? 'Sent' : msg.senderName} • {msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
              </span>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-primary-dark via-primary-dark to-transparent pt-12">
        <form onSubmit={handleSendMessage} className="relative flex items-center gap-3">
           <input
             type="text"
             placeholder="Transmit message..."
             value={newMessage}
             onChange={(e) => setNewMessage(e.target.value)}
             className="flex-1 bg-surface border border-border rounded-2xl py-5 px-6 text-white text-sm focus:border-accent-gold outline-none shadow-2xl"
           />
           <button 
             type="submit"
             className={`w-14 h-14 ${accentColor} rounded-2xl flex items-center justify-center text-primary-dark shadow-lg active:scale-95 transition-all shrink-0`}
           >
             <Send size={24} />
           </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
