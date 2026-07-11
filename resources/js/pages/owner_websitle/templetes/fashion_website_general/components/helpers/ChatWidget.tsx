import React, { useState, useEffect, useRef } from 'react';
import { FiMessageSquare, FiX, FiSend, FiLoader, FiCamera } from 'react-icons/fi';
import { chatService, type Message, type Conversation } from '@/api/owner/chat';
import { getEcho } from '@/api/echo';
import { useAuth } from '../../hooks/useAuth';
import { toast } from '../../utils/toast';
import { resolveImageUrl } from '@/api/imageUtils';
import type { StoreRow } from '@/api/owner/stores';

interface ChatWidgetProps {
    ownerUserId?: number | string;
    stores?: StoreRow;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ ownerUserId, stores }) => {
    const { isLoggedIn, user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [unreadCount, setUnreadCount] = useState(0);

    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        if (!isOpen) return;
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior });
        }, 100);
    };

    useEffect(() => {
        if (isLoggedIn && !conversation) {
            loadChat();
        }
    }, [isLoggedIn]);

    // Reset unread count when opening chat
    useEffect(() => {
        if (isOpen) {
            setUnreadCount(0);
            scrollToBottom('auto');
        }
    }, [isOpen]);

    const loadChat = async () => {
        try {
            setIsLoading(true);
            const convos = await chatService.getMyConversations();
            
            if (!ownerUserId) return;

            // Find conversation with this store owner
            let existing = convos.find(c => c.store_id === ownerUserId || c.other_user?.id === ownerUserId);
            
            if (!existing && isLoggedIn) {
                try {
                    const started = await chatService.startConversation(ownerUserId);
                    const updatedConvos = await chatService.getMyConversations();
                    existing = updatedConvos.find(c => c.id === started.id);
                } catch (e) {
                    console.warn('[ChatWidget] Failed to start auto-conversation:', e);
                }
            }

            if (existing) {
                setConversation(existing);
                const msgs = await chatService.getMessages(existing.id);
                setMessages(msgs);
                setUnreadCount(existing.unread_count || 0);
            }
        } catch (err) {
            console.error('[ChatWidget] Load error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Echo subscription handler
    useEffect(() => {
        if (!conversation || !isLoggedIn) return;

        const convoId = conversation.id;
        const resolvedKey = conversation.pusher_key || (stores as any)?.pusher_app_key;
        const resolvedCluster = conversation.pusher_cluster || (stores as any)?.pusher_app_cluster;

        try {
            const echo = getEcho(resolvedKey, resolvedCluster);
            echo.private(`chat.${convoId}`)
                .listen('.MessageSent', (data: { message: Message }) => {
                    setMessages(prev => {
                        if (prev.some(m => Number(m.id) === Number(data.message.id))) return prev;
                        return [...prev, data.message];
                    });
                    
                    // Increment unread if chat is closed or message is from other user
                    if (!isOpen && Number(data.message.sender_id) !== Number(user?.id)) {
                        setUnreadCount(prev => prev + 1);
                        toast.success('New message received', { icon: '💬', position: 'bottom-right' });
                    }
                    
                    scrollToBottom();
                })
                .listen('.MessageDeleted', (data: { message_id: number }) => {
                    console.log('[Echo] Message deleted event received in ChatWidget:', data);
                    setMessages(prev => prev.filter(m => Number(m.id) !== Number(data.message_id)));
                });

            return () => {
                echo.leave(`chat.${convoId}`);
            };
        } catch (err) {
            console.warn(`[ChatWidget] Echo subscription failed for chat.${convoId}`, err);
        }
    }, [conversation?.id, isLoggedIn, isOpen, user?.id]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputText.trim() || !conversation || isSending) return;

        const body = inputText.trim();
        setInputText('');
        setIsSending(true);

        try {
            const msg = await chatService.sendMessage(conversation.id, body, 'text');
            setMessages(prev => {
                if (prev.some(m => Number(m.id) === Number(msg.id))) return prev;
                return [...prev, msg];
            });
            scrollToBottom();
        } catch (err) {
            toast.error('Failed to send message');
            setInputText(body); // Restore text on failure
        } finally {
            setIsSending(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !conversation || isUploading) return;

        setIsUploading(true);
        const loadingToast = toast.loading('Uploading image...');
        try {
            const uploadRes = await chatService.uploadChatImage(file);
            const msg = await chatService.sendMessage(conversation.id, '', 'image', uploadRes.path);
            setMessages(prev => {
                if (prev.some(m => Number(m.id) === Number(msg.id))) return prev;
                return [...prev, msg];
            });
            toast.success('Image sent', { id: loadingToast });
            scrollToBottom();
        } catch (err) {
            toast.error('Failed to upload image', { id: loadingToast });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="fixed bottom-6 right-24 z-[9999] font-sans">
            {/* Toggle Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${
                    isOpen ? 'bg-stone-100 text-stone-900 border border-stone-200' : 'bg-stone-950 text-white'
                }`}
            >
                {isOpen ? <FiX className="w-6 h-6" /> : <FiMessageSquare className="w-6 h-6" />}
                {!isOpen && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#E61E25] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-md animate-cart-pop">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="absolute bottom-20 right-0 w-[calc(100vw-3rem)] sm:w-96 h-[500px] max-h-[70vh] bg-white shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-slide-up border border-stone-100">
                    {/* Header */}
                    <div className="p-4 bg-stone-950 text-white flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center border border-stone-700 overflow-hidden">
                                {conversation?.other_user?.image ? (
                                    <img src={resolveImageUrl(conversation.other_user.image)} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <FiMessageSquare className="w-5 h-5 text-stone-500" />
                                )}
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest">Store Support</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-tight">Always Active</p>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-stone-400 hover:text-white transition-colors">
                            <FiX className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/50 scrollbar-hide">
                        {!isLoggedIn ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 px-6">
                                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center text-stone-300">
                                    <FiMessageSquare className="w-8 h-8" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-black uppercase tracking-widest text-stone-950">Login to Chat</p>
                                    <p className="text-[11px] text-stone-500 font-medium leading-relaxed">
                                        Please login or register to start a real-time conversation with our support team.
                                    </p>
                                </div>
                                <button 
                                    onClick={() => {
                                        window.dispatchEvent(new CustomEvent('request_login'));
                                        setIsOpen(false);
                                    }}
                                    className="w-full py-3 bg-stone-950 hover:bg-stone-850 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-lg active:scale-95"
                                >
                                    Login / Register
                                </button>
                            </div>
                        ) : isLoading ? (
                            <div className="h-full flex items-center justify-center">
                                <FiLoader className="w-6 h-6 text-stone-400 animate-spin" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-40 px-8">
                                <div className="w-12 h-12 bg-stone-200 rounded-full flex items-center justify-center">
                                    <FiMessageSquare className="w-6 h-6 text-stone-500" />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-stone-900">Start a conversation</p>
                                <p className="text-[10px] font-medium text-stone-500">Ask us anything about our products or your orders.</p>
                            </div>
                        ) : (
                            messages.map((m, idx) => {
                                const isMe = m.sender_id === user?.id;
                                return (
                                    <div key={m.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                                        <div className={`max-w-[85%] space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                                            <div className={`p-3 rounded-2xl text-[11px] font-bold shadow-3xs leading-relaxed ${
                                                isMe 
                                                    ? 'bg-stone-950 text-white rounded-tr-none' 
                                                    : 'bg-white text-stone-900 rounded-tl-none border border-stone-200/50'
                                            }`}>
                                                {m.message_type === 'image' ? (
                                                    <img src={resolveImageUrl(m.media_url)} alt="Shared image" className="rounded-lg max-w-full h-auto" />
                                                ) : (
                                                    m.body
                                                )}
                                            </div>
                                            <p className="text-[8px] font-black uppercase tracking-tighter text-stone-400 px-1">
                                                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    {isLoggedIn && (
                        <div className="p-4 bg-white border-t border-stone-100 shrink-0">
                            <form 
                                onSubmit={handleSendMessage} 
                                className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl p-1.5 focus-within:border-stone-950 transition-colors"
                            >
                                <button 
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-900 transition-colors disabled:opacity-50"
                                >
                                    {isUploading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiCamera className="w-4 h-4" />}
                                </button>
                                <input 
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <input 
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Write a message..."
                                    className="flex-1 text-[11px] font-bold bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-stone-300 text-stone-900"
                                />
                                <button 
                                    type="submit"
                                    disabled={!inputText.trim() || isSending}
                                    className="w-8 h-8 bg-stone-950 text-white rounded-lg flex items-center justify-center hover:bg-stone-850 transition-all disabled:opacity-50 disabled:grayscale active:scale-90"
                                >
                                    {isSending ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiSend className="w-3.5 h-3.5" />}
                                </button>
                            </form>
                            <p className="text-[8px] text-center text-stone-400 font-bold uppercase tracking-widest mt-2">
                                Powered by Real-time Aura Sync
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

