
import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  Send, 
  User as UserIcon, 
  Info, 
  MessageSquare, 
  Users, 
  Hash,
  Search,
  Bell,
  MoreVertical,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  CheckSquare,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage, User, Role } from '../types';
import { firestoreService } from '../services/firestoreService';

interface ChatCenterProps {
  currentUser: User;
}

export const ChatCenter: React.FC<ChatCenterProps> = ({ currentUser }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [activeRoom, setActiveRoom] = useState('global');
  const [searchTerm, setSearchTerm] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize socket
  useEffect(() => {
    socketRef.current = io(window.location.origin);

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      socketRef.current?.emit('join:room', activeRoom);
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current.on('chat:message', (msg: ChatMessage) => {
      // Avoid duplicates from optimistic updates or double broadcasts
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [activeRoom]);

  // Subscribe to Firestore for persistence & history
  useEffect(() => {
    const unsubscribe = firestoreService.subscribeToChat(activeRoom, (newMessages) => {
      setMessages(newMessages);
    });
    return () => unsubscribe();
  }, [activeRoom]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const message: ChatMessage = {
      id: `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      senderRole: currentUser.role,
      text: inputText.trim(),
      timestamp: new Date().toISOString(),
      type: 'text',
      room: activeRoom
    };

    // Optimistic update
    setMessages(prev => [...prev, message]);
    setInputText('');

    // Persistence
    try {
      await firestoreService.createChatMessage(message);
      // Broadcast via socket for live feel
      socketRef.current?.emit('chat:message', message);
    } catch (error) {
      console.error("Error sending message:", error);
      // Fallback: remove from local state if failed
      setMessages(prev => prev.filter(m => m.id !== message.id));
    }
  };

  const filteredMessages = messages.filter(m => 
    m.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.senderName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-900 overflow-hidden shadow-2xl">
      {/* Lobby Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500">
            <MessageSquare size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Centro de Comunicación
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></span>
            </h2>
            <p className="text-sm text-slate-500 font-medium">Canal informativo en vivo para usuarios corporativos</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Buscar mensajes..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all w-64"
            />
          </div>
          <button className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-brand-500 transition-all shadow-sm active:scale-95">
            <Bell size={20} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Channels & Rooms */}
        <div className="w-80 border-r border-slate-200 dark:border-slate-900 bg-slate-50/30 dark:bg-slate-950/30 hidden lg:flex flex-col">
          <div className="p-6 space-y-6">
            <div>
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">Salas Disponibles</span>
              <div className="space-y-1">
                {[
                  { id: 'global', name: 'Canal General', icon: Hash, desc: 'Información corporativa', active: activeRoom === 'global' },
                  { id: 'audit', name: 'Canal Auditoría', icon: CheckSquare, desc: 'Solo para Auditores', active: activeRoom === 'audit', roles: [Role.SUPER_ADMIN, Role.AUDITOR, Role.PRESIDENT] },
                  { id: 'ops', name: 'Operaciones', icon: Activity, desc: 'Día a día operativo', active: activeRoom === 'ops' }
                ].filter(r => !r.roles || r.roles.includes(currentUser.role)).map(room => (
                  <button
                    key={room.id}
                    onClick={() => setActiveRoom(room.id)}
                    className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all group ${
                      room.active 
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' 
                        : 'hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${room.active ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                      <room.icon size={18} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm leading-tight">{room.name}</p>
                      <p className={`text-[10px] font-medium opacity-60 ${room.active ? 'text-white' : ''}`}>{room.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">Usuarios Activos</span>
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-950 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                    U{i}
                  </div>
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-950 bg-brand-500 flex items-center justify-center text-[10px] font-bold text-white">
                  +12
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-950/20">
          {/* Room Banner */}
          <div className="px-8 py-3 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-900 flex items-center justify-between">
             <div className="flex items-center gap-2 text-slate-500">
               <Hash size={14} className="text-brand-500" />
               <span className="text-xs font-bold uppercase tracking-widest">{activeRoom}</span>
             </div>
             <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
               <span className="flex items-center gap-1"><Users size={12} /> 16 miembros</span>
               <span className="flex items-center gap-1"><CheckCheck size={12} className="text-emerald-500" /> Lectura/Escritura</span>
             </div>
          </div>

          {/* Messages List */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar"
          >
            <AnimatePresence>
              {filteredMessages.map((msg, idx) => {
                const isMe = msg.senderId === currentUser.id;
                const prevMsg = idx > 0 ? filteredMessages[idx - 1] : null;
                const isGrouped = prevMsg && prevMsg.senderId === msg.senderId && 
                                  (new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime() < 300000);

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex items-start gap-4 ${isMe ? 'flex-row-reverse' : ''} ${isGrouped ? 'mt-1' : 'mt-6'}`}
                  >
                    {!isGrouped && (
                      <div className="w-10 h-10 rounded-2xl bg-brand-500/10 border border-brand-500/10 flex items-center justify-center text-brand-500 font-black overflow-hidden shrink-0 shadow-sm">
                        {msg.senderAvatar ? (
                          <img src={msg.senderAvatar} alt={msg.senderName} className="w-full h-full object-cover" />
                        ) : (
                          msg.senderName.charAt(0).toUpperCase()
                        )}
                      </div>
                    )}
                    {isGrouped && <div className="w-10 shrink-0" />}

                    <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      {!isGrouped && (
                        <div className={`flex items-center gap-2 mb-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <span className="text-xs font-black text-slate-900 dark:text-slate-100">{msg.senderName}</span>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-full">{msg.senderRole}</span>
                        </div>
                      )}
                      
                      <div className={`
                        p-4 rounded-3xl text-sm leading-relaxed shadow-sm
                        ${isMe 
                          ? 'bg-brand-600 text-white rounded-tr-none' 
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-tl-none'
                        }
                      `}>
                        {msg.text}
                      </div>
                      
                      <div className={`flex items-center gap-2 mt-1.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                         <span className="text-[9px] font-bold text-slate-400/60 uppercase tracking-tighter">
                           {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </span>
                         {isMe && <CheckCheck size={12} className="text-brand-400/50" />}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900">
             <form 
              onSubmit={handleSendMessage}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 flex items-center gap-2 focus-within:ring-4 focus-within:ring-brand-500/10 focus-within:border-brand-500/50 transition-all"
             >
               <button type="button" className="p-3 text-slate-400 hover:text-brand-500 transition-colors tooltip" title="Adjuntar">
                 <Paperclip size={20} />
               </button>
               <input 
                type="text" 
                placeholder={`Mensaje para #${activeRoom}...`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none py-3 px-2 text-slate-900 dark:text-white placeholder:text-slate-500"
               />
               <div className="flex items-center gap-1">
                 <button type="button" className="p-3 text-slate-400 hover:text-brand-500 transition-colors">
                   <Smile size={20} />
                 </button>
                 <button 
                  type="submit"
                  disabled={!inputText.trim()}
                  className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:grayscale transition-all p-3 rounded-xl text-white shadow-lg shadow-brand-500/20 active:scale-95"
                 >
                   <Send size={20} />
                 </button>
               </div>
             </form>
             <div className="mt-3 flex items-center justify-between px-2">
                <p className="text-[10px] text-slate-400 font-medium">Presione <kbd className="bg-slate-100 dark:bg-slate-800 px-1 rounded">Enter</kbd> para enviar</p>
                <div className="flex items-center gap-3">
                   <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Servidor Conectado</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
