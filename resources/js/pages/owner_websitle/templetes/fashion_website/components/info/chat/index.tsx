import React, { useState, useEffect, useRef, useCallback } from 'react';
import { chatService } from '@/api/owner/chat';
import type { Message, Conversation } from '@/api/owner/chat';
import { authService } from '@/api/auth';
import { FiCamera, FiSend, FiLoader, FiMessageSquare, FiSmile, FiCornerUpLeft, FiPlus, FiX, FiMic, FiTrash2, FiMoreVertical } from 'react-icons/fi';
import { toast } from '../../../utils/toast';
import { resolveImageUrl } from '@/api/imageUtils';
import { getEcho, getEchoAuthToken } from '@/api/echo';

const VoicePlayer: React.FC<{ src: string; isMe: boolean }> = ({ src, isMe }) => {
     const audioRef = useRef<HTMLAudioElement | null>(null);
     const [isPlaying, setIsPlaying] = useState(false);
     const [currentTime, setCurrentTime] = useState(0);
     const [duration, setDuration] = useState(0);
     const progressRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
          const audio = new Audio(src);
          audioRef.current = audio;

          const onPlay = () => setIsPlaying(true);
          const onPause = () => setIsPlaying(false);
          const onTimeUpdate = () => setCurrentTime(audio.currentTime);
          const onDurationChange = () => {
               if (audio.duration && isFinite(audio.duration)) {
                    setDuration(audio.duration);
                    if (audio.currentTime >= audio.duration - 0.05 && !isPlaying) {
                         audio.currentTime = 0;
                         setCurrentTime(0);
                    }
               }
          };
          const onLoadedMetadata = () => {
               if (audio.duration && isFinite(audio.duration)) {
                    setDuration(audio.duration);
               } else if (audio.duration === Infinity) {
                    audio.currentTime = 1e101;
               }
          };
          const onEnded = () => {
               setIsPlaying(false);
               setCurrentTime(0);
          };

          audio.addEventListener('play', onPlay);
          audio.addEventListener('pause', onPause);
          audio.addEventListener('timeupdate', onTimeUpdate);
          audio.addEventListener('durationchange', onDurationChange);
          audio.addEventListener('loadedmetadata', onLoadedMetadata);
          audio.addEventListener('ended', onEnded);

          audio.load();

          return () => {
               audio.pause();
               audio.removeEventListener('play', onPlay);
               audio.removeEventListener('pause', onPause);
               audio.removeEventListener('timeupdate', onTimeUpdate);
               audio.removeEventListener('durationchange', onDurationChange);
               audio.removeEventListener('loadedmetadata', onLoadedMetadata);
               audio.removeEventListener('ended', onEnded);
               audioRef.current = null;
          };
     }, [src]);

     useEffect(() => {
          let isMounted = true;
          const getDurationFromAudioContext = async () => {
               try {
                    const response = await fetch(src);
                    const arrayBuffer = await response.arrayBuffer();
                    const offlineCtx = new (window.OfflineAudioContext || (window as any).webkitOfflineAudioContext)(1, 44100, 44100);
                    offlineCtx.decodeAudioData(
                         arrayBuffer,
                         (buffer) => {
                              if (isMounted && buffer.duration && isFinite(buffer.duration)) {
                                   setDuration(buffer.duration);
                              }
                         },
                         () => { }
                    );
               } catch (e) {
                    console.warn('Could not decode audio duration via AudioContext:', e);
               }
          };

          if (src) {
               getDurationFromAudioContext();
          }

          return () => {
               isMounted = false;
          };
     }, [src]);

     const togglePlay = () => {
          if (!audioRef.current) return;
          if (isPlaying) {
               audioRef.current.pause();
          } else {
               audioRef.current.play().catch(() => { });
          }
     };

     const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
          if (!audioRef.current || !progressRef.current || duration === 0) return;
          const rect = progressRef.current.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const width = rect.width;
          const clickPercent = clickX / width;
          const nextTime = clickPercent * duration;
          audioRef.current.currentTime = nextTime;
          setCurrentTime(nextTime);
     };

     const formatPlayTime = (time: number) => {
          if (isNaN(time) || !isFinite(time)) return '0:00';
          const mins = Math.floor(time / 60);
          const secs = Math.floor(time % 60);
          return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
     };

     // Waveform heights in percentage
     const waveformHeights = [25, 40, 30, 55, 65, 45, 75, 35, 55, 45, 70, 40, 55, 30, 50, 35, 60, 45, 65, 30, 40, 25];
     const activeBarCount = duration > 0 ? Math.floor((currentTime / duration) * waveformHeights.length) : 0;

     return (
          <div className={`flex items-center gap-3.5 py-2.5 px-4 rounded-[10px] min-w-[240px] select-none ${isMe ? 'bg-[#1a73e8] text-white rounded-br-[4px]' : 'bg-slate-100 text-slate-800 rounded-bl-[4px]'
               }`}>
               {/* Play/Pause Button */}
               <button
                    type="button"
                    onClick={togglePlay}
                    className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer border-none transition-transform active:scale-90 bg-transparent shrink-0 ${isMe ? 'text-white' : 'text-[#1a73e8]'
                         }`}
               >
                    {isPlaying ? (
                         <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                         </svg>
                    ) : (
                         <svg className="w-5 h-5 fill-current translate-x-0.5" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                         </svg>
                    )}
               </button>

               {/* Waveform Seek Container */}
               <div
                    ref={progressRef}
                    onClick={handleTimelineClick}
                    className="flex-1 h-8 flex items-center gap-[3px] cursor-pointer"
               >
                    {waveformHeights.map((h, i) => {
                         const isActive = i < activeBarCount;
                         let barBgClass = '';
                         if (isMe) {
                              barBgClass = isActive ? 'bg-white' : 'bg-white/35';
                         } else {
                              barBgClass = isActive ? 'bg-[#1a73e8]' : 'bg-slate-300';
                         }
                         return (
                              <div
                                   key={i}
                                   className={`w-[3px] rounded-full transition-all ${barBgClass}`}
                                   style={{ height: `${h}%` }}
                              />
                         );
                    })}
               </div>

               {/* Duration Label */}
               <span className={`text-[11px] font-bold tracking-wide shrink-0 ${isMe ? 'text-white' : 'text-slate-500'
                    }`}>
                    {formatPlayTime(isPlaying || currentTime > 0 ? currentTime : (duration && isFinite(duration) ? duration : 0))}
               </span>
          </div>
     );
};

interface ChatTabProps {
     ownerUserId?: number | string;
     user: any;
     stores?: any;
     onTabChange?: (tab: 'profile' | 'orders' | 'giftcard' | 'address' | 'chat') => void;
}

export const ChatTab: React.FC<ChatTabProps> = ({ ownerUserId, user, stores, onTabChange }) => {
     const renderMessageBody = (text: string, isMe?: boolean) => {
          if (!text) return '';
          const resolvedText = text.replace(/\{\{BASE_URL\}\}|\[BASE_URL\]/g, window.location.origin);
          const urlRegex = /(https?:\/\/[^\s]+)/g;
          const parts = resolvedText.split(urlRegex);
          return parts.map((part, index) => {
               if (part.match(urlRegex)) {
                    let linkText = part;
                    try {
                         const url = new URL(part);
                         const isProfileRoute = url.pathname === '/profile';
                         if (isProfileRoute && url.searchParams.get('tab') === 'orders') {
                              linkText = 'Detail';
                         }
                    } catch (_) { }
                    return (
                         <a
                              key={index}
                              href={part}
                              onClick={(e) => {
                                   e.stopPropagation();
                                   try {
                                        const url = new URL(part);
                                        const isProfileRoute = url.pathname === '/profile';
                                        if (isProfileRoute) {
                                             e.preventDefault();
                                             const tabParam = url.searchParams.get('tab');
                                             if (tabParam === 'orders') {
                                                  window.history.pushState(null, '', url.pathname + url.search + url.hash);
                                                  window.dispatchEvent(new PopStateEvent('popstate'));
                                                  if (onTabChange) {
                                                       onTabChange('orders');
                                                       return;
                                                  }
                                             }
                                        }
                                   } catch (err) {
                                        console.warn('Failed to parse message URL:', err);
                                   }
                              }}
                              className={`underline font-bold break-all cursor-pointer ${isMe
                                   ? 'text-yellow-300 hover:text-yellow-200'
                                   : 'text-blue-500 hover:text-blue-600'
                                   }`}
                              target="_blank"
                              rel="noopener noreferrer"
                         >
                              {linkText}
                         </a>
                    );
               }
               return part;
          });
     };

     const [conversation, setConversation] = useState<Conversation | null>(null);
     const [messages, setMessages] = useState<Message[]>([]);
     const [inputValue, setInputValue] = useState('');
     const [isSending, setIsSending] = useState(false);
     const [isLoading, setIsLoading] = useState(true);
     const [isUploading, setIsUploading] = useState(false);
     const [loadingMessages, setLoadingMessages] = useState(false);
     const [hasMoreMessages, setHasMoreMessages] = useState(true);
     const [loadingMore, setLoadingMore] = useState(false);
     const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);
     const [activeReactMessageId, setActiveReactMessageId] = useState<number | null>(null);
     const [activeMenuMessageId, setActiveMenuMessageId] = useState<number | null>(null);
     const [flashingMsgId, setFlashingMsgId] = useState<number | null>(null);
     // Multi-image queue: each entry = { file, preview (object URL) }
     const [pendingImages, setPendingImages] = useState<{ file: File; preview: string }[]>([]);

     // Voice Recording & Emoji States
     const [isRecording, setIsRecording] = useState(false);
     const [recordingTime, setRecordingTime] = useState(0);
     const [showEmojiPicker, setShowEmojiPicker] = useState(false);
     const mediaRecorderRef = useRef<MediaRecorder | null>(null);
     const audioChunksRef = useRef<Blob[]>([]);
     const recordingIntervalRef = useRef<any>(null);
     const audioStreamRef = useRef<MediaStream | null>(null);
     const isCancelRequestedRef = useRef(false);

     useEffect(() => {
          return () => {
               if (recordingIntervalRef.current) {
                    clearInterval(recordingIntervalRef.current);
               }
               if (audioStreamRef.current) {
                    audioStreamRef.current.getTracks().forEach(track => track.stop());
               }
          };
     }, []);

     const formatDuration = (sec: number) => {
          const m = Math.floor(sec / 60);
          const s = sec % 60;
          return `${m}:${s < 10 ? '0' : ''}${s}`;
     };

     const startRecording = async () => {
          try {
               const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
               audioStreamRef.current = stream;

               const options = { mimeType: 'audio/webm' };
               let recorder: MediaRecorder;
               try {
                    recorder = new MediaRecorder(stream, options);
               } catch (e) {
                    recorder = new MediaRecorder(stream);
               }

               mediaRecorderRef.current = recorder;
               audioChunksRef.current = [];

               recorder.ondataavailable = (e) => {
                    if (e.data && e.data.size > 0) {
                         audioChunksRef.current.push(e.data);
                    }
               };

               recorder.onstop = async () => {
                    stream.getTracks().forEach(track => track.stop());

                    if (isCancelRequestedRef.current) {
                         audioChunksRef.current = [];
                         return;
                    }

                    const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
                    audioChunksRef.current = [];

                    if (audioBlob.size === 0) return;

                    const audioFile = new File([audioBlob], `voice_memo_${Date.now()}.webm`, {
                         type: audioBlob.type
                    });

                    setIsUploading(true);
                    const loadingToast = toast.loading('Sending voice message...');
                    try {
                         const uploadRes = await chatService.uploadChatImage(audioFile);
                         const audioMsg = await chatService.sendMessage(
                              conversation!.id,
                              '',
                              'audio' as any,
                              uploadRes.path,
                              replyingToMessage?.id || undefined
                         );
                         setReplyingToMessage(null);
                         setMessages(prev => {
                              if (prev.some(m => Number(m.id) === Number(audioMsg.id))) return prev;
                              setTimeout(scrollToBottom, 50);
                              return [...prev, audioMsg];
                         });
                         toast.success('Voice message sent');
                    } catch (err: any) {
                         toast.error(err?.message || 'Failed to send voice message');
                    } finally {
                         setIsUploading(false);
                         toast.dismiss(loadingToast);
                    }
               };

               recorder.start(200);
               setIsRecording(true);
               setRecordingTime(0);
               recordingIntervalRef.current = setInterval(() => {
                    setRecordingTime(prev => prev + 1);
               }, 1000);
          } catch (err) {
               toast.error('Could not access microphone. Please check permissions.');
               console.error('Microphone access error:', err);
          }
     };

     const stopAndSendRecording = () => {
          isCancelRequestedRef.current = false;
          stopRecording();
     };

     const cancelRecording = () => {
          isCancelRequestedRef.current = true;
          stopRecording();
     };

     const stopRecording = () => {
          if (recordingIntervalRef.current) {
               clearInterval(recordingIntervalRef.current);
               recordingIntervalRef.current = null;
          }
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
               mediaRecorderRef.current.stop();
          }
          setIsRecording(false);
     };

     // States for full-screen image preview modal
     const [previewImages, setPreviewImages] = useState<string[]>([]);
     const [previewIndex, setPreviewIndex] = useState<number>(0);
     const [showPreview, setShowPreview] = useState<boolean>(false);

     const handleImageClick = (urls: string[], index: number) => {
          setPreviewImages(urls);
          setPreviewIndex(index);
          setShowPreview(true);
     };

     // Keyboard event listener for preview modal
     useEffect(() => {
          if (!showPreview) return;
          const handleKeyDown = (e: KeyboardEvent) => {
               if (e.key === 'Escape') {
                    setShowPreview(false);
               } else if (e.key === 'ArrowRight' && previewImages.length > 1) {
                    setPreviewIndex(prev => (prev + 1) % previewImages.length);
               } else if (e.key === 'ArrowLeft' && previewImages.length > 1) {
                    setPreviewIndex(prev => (prev - 1 + previewImages.length) % previewImages.length);
               }
          };
          window.addEventListener('keydown', handleKeyDown);
          return () => window.removeEventListener('keydown', handleKeyDown);
     }, [showPreview, previewImages.length]);

     const messagesEndRef = useRef<HTMLDivElement>(null);
     const multiFileInputRef = useRef<HTMLInputElement>(null);
     const messageContainerRef = useRef<HTMLDivElement>(null);
     const isFirstLoad = useRef(true);
     const lastMessageIdRef = useRef<number | null>(null);

     // Scroll messages to the bottom
     const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
          if (messagesEndRef.current) {
               const container = messagesEndRef.current.parentElement;
               if (container) {
                    container.scrollTo({
                         top: container.scrollHeight,
                         behavior
                    });
               } else {
                    messagesEndRef.current.scrollIntoView({ behavior });
               }
          }
     };

     // 1. Resolve or start conversation on mount
     useEffect(() => {
          let isMounted = true;
          const initChat = async () => {
               try {
                    setIsLoading(true);
                    // We use stores.id first if available, else stores.created_by, else ownerUserId
                    const targetStoreId = stores?.id || stores?.created_by || ownerUserId;

                    if (!targetStoreId) {
                         throw new Error('No valid store or owner ID available.');
                    }

                    // Call startConversation to either get the existing one or create a new one
                    const convo = await chatService.startConversation(targetStoreId);

                    if (isMounted) {
                         // Now fetch conversations to load the full details (like other_user)
                         const allConvos = await chatService.getMyConversations();
                         const matched = allConvos.find(c => Number(c.id) === Number(convo.id));

                         if (matched) {
                              setConversation(matched);
                              // Fetch initial messages (5 messages history limit)
                              const fetchInitial = async () => {
                                   try {
                                        setLoadingMessages(true);
                                        const limit = 5;
                                        const msgs = await chatService.getMessages(matched.id, limit);
                                        setMessages(msgs);
                                        setHasMoreMessages(msgs.length === limit);
                                   } catch (err) {
                                        console.error('Failed to load initial messages:', err);
                                   } finally {
                                        setLoadingMessages(false);
                                   }
                              };
                              fetchInitial();
                         }
                    }
               } catch (err: any) {
                    console.error('Failed to initialize chat:', err);
                    toast.error(err?.message || 'Unable to open store chat');
               } finally {
                    if (isMounted) setIsLoading(false);
               }
          };

          initChat();

          return () => {
               isMounted = false;
          };
     }, [ownerUserId, stores]);

     // ── Load older messages when scrolling to top (infinite scroll pagination) ─
     const loadMoreMessages = useCallback(async () => {
          if (!conversation || loadingMore || !hasMoreMessages || messages.length === 0) return;

          const convoId = conversation.id;
          const firstMsgId = messages[0].id;
          const limit = 5;

          try {
               setLoadingMore(true);

               const container = messageContainerRef.current;
               const prevScrollHeight = container ? container.scrollHeight : 0;
               const prevScrollTop = container ? container.scrollTop : 0;

               const olderMsgs = await chatService.getMessages(convoId, limit, firstMsgId);

               if (olderMsgs.length > 0) {
                    setMessages(prev => [...olderMsgs, ...prev]);
                    setHasMoreMessages(olderMsgs.length === limit);

                    // Maintain scroll position so it doesn't jump
                    setTimeout(() => {
                         if (container) {
                              const newScrollHeight = container.scrollHeight;
                              container.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
                         }
                    }, 30);
               } else {
                    setHasMoreMessages(false);
               }
          } catch (err) {
               console.error('Failed to load older messages:', err);
          } finally {
               setLoadingMore(false);
          }
     }, [conversation, loadingMore, hasMoreMessages, messages]);

     const handleScrollToMessage = async (messageId: number) => {
          let el = document.querySelector(`[data-msg-id="${messageId}"]`);
          if (el) {
               el.scrollIntoView({ behavior: 'smooth', block: 'center' });
               setFlashingMsgId(messageId);
               setTimeout(() => {
                    setFlashingMsgId(null);
               }, 1500);
               return;
          }

          const convoId = conversation?.id;
          if (!convoId) {
               toast.error('No active conversation');
               return;
          }

          const loadingToast = toast.loading('Loading message history...');
          try {
               let currentMessages = [...messages];
               let localHasMore = hasMoreMessages;
               let found = false;
               let iterations = 0;
               const maxIterations = 8;
               const limit = 20;

               while (!found && localHasMore && iterations < maxIterations) {
                    const firstMsgId = currentMessages[0]?.id;
                    if (!firstMsgId) break;

                    const olderMsgs = await chatService.getMessages(convoId, limit, firstMsgId);
                    iterations++;

                    if (olderMsgs.length === 0) {
                         localHasMore = false;
                         setHasMoreMessages(false);
                         break;
                    }

                    currentMessages = [...olderMsgs, ...currentMessages];
                    setMessages(currentMessages);

                    if (olderMsgs.length < limit) {
                         localHasMore = false;
                         setHasMoreMessages(false);
                    }

                    await new Promise(resolve => setTimeout(resolve, 80));

                    el = document.querySelector(`[data-msg-id="${messageId}"]`);
                    if (el) {
                         found = true;
                         toast.dismiss(loadingToast);
                         el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                         setFlashingMsgId(messageId);
                         setTimeout(() => {
                              setFlashingMsgId(null);
                         }, 1500);
                         return;
                    }
               }

               toast.dismiss(loadingToast);
               if (!found) {
                    toast.error('Original message not found in history');
               }
          } catch (err) {
               toast.dismiss(loadingToast);
               toast.error('Failed to load message history');
          }
     };

     const handleIncomingReaction = useCallback(
          (messageId: number, reactions: any[]) => {
               setMessages(prev =>
                    prev.map(m =>
                         m.id === messageId
                              ? { ...m, reactions }
                              : m
                    )
               );
          },
          []
     );

     const handleReactToMessage = async (messageId: number, emoji: string) => {
          try {
               setMessages(prev =>
                    prev.map(m => {
                         if (m.id !== messageId) return m;
                         const currentReactions = m.reactions || [];
                         const userReaction = currentReactions.find(r => Number(r.user_id) === Number(user?.id));

                         let nextReactions = [...currentReactions];
                         if (userReaction) {
                              if (userReaction.emoji === emoji) {
                                   nextReactions = nextReactions.filter(r => Number(r.user_id) !== Number(user?.id));
                              } else {
                                   nextReactions = nextReactions.map(r =>
                                        Number(r.user_id) === Number(user?.id) ? { ...r, emoji } : r
                                   );
                              }
                         } else {
                              nextReactions.push({
                                   id: -Date.now(),
                                   message_id: messageId,
                                   user_id: Number(user?.id),
                                   emoji,
                                   user: {
                                        id: Number(user?.id),
                                        name: user?.name || 'You',
                                   },
                              });
                         }
                         return { ...m, reactions: nextReactions };
                    })
               );

               setActiveReactMessageId(null);

               const res = await chatService.reactToMessage(messageId, emoji);

               setMessages(prev =>
                    prev.map(m =>
                         m.id === messageId ? { ...m, reactions: res.reactions } : m
                    )
               );
          } catch (err) {
               toast.error('Failed to react to message');
          }
     };

     const handleRemoveMessage = async (msgId: number) => {
          const prev = messages;
          setMessages(p => p.filter(m => m.id !== msgId));
          setActiveMenuMessageId(null);
          try {
               await chatService.deleteMessage(msgId);
               toast.success('Message removed');
          } catch (err) {
               setMessages(prev);
               toast.error('Failed to remove message');
          }
     };

     const groupReactions = (reactions?: any[]) => {
          if (!reactions || reactions.length === 0) return [];
          const map: Record<string, { emoji: string; count: number; userReacted: boolean; names: string[] }> = {};
          reactions.forEach(r => {
               const isMe = Number(r.user_id) === Number(user?.id);
               const name = r.user?.name || 'User';
               if (!map[r.emoji]) {
                    map[r.emoji] = { emoji: r.emoji, count: 0, userReacted: false, names: [] };
               }
               map[r.emoji].count += 1;
               if (isMe) map[r.emoji].userReacted = true;
               map[r.emoji].names.push(isMe ? 'You' : name);
          });
          return Object.values(map);
     };

     const handleScroll = () => {
          const container = messageContainerRef.current;
          if (container && container.scrollTop === 0 && hasMoreMessages && !loadingMore) {
               loadMoreMessages();
          }
     };

     // 2. Listen to real-time messages using Laravel Echo (subscribe once per conversation)
     const token = getEchoAuthToken();
     useEffect(() => {
          if (!conversation) return;

          const convoId = conversation.id;
          const echo = getEcho(conversation.pusher_key, conversation.pusher_cluster);
          echo
               .private(`chat.${convoId}`)
               .listen('.MessageSent', (data: { message: Message }) => {
                    const incomingMsg = data.message;
                    setMessages(prev => {
                         if (prev.some(m => Number(m.id) === Number(incomingMsg.id))) return prev;
                         setTimeout(scrollToBottom, 50);
                         return [...prev, incomingMsg];
                    });
               })
               .listen('.MessageReactionUpdated', (data: { message_id: number; reactions: any[] }) => {
                    handleIncomingReaction(data.message_id, data.reactions);
               })
               .listen('.MessageDeleted', (data: { message_id: number }) => {
                    console.log('[Echo] Message deleted event received:', data);
                    setMessages(prev => {
                         const filtered = prev.filter(m => Number(m.id) !== Number(data.message_id));
                         console.log('[Echo] Messages list after delete filter:', filtered.map(m => m.id));
                         return filtered;
                    });
               });

          return () => {
               echo.leave(`chat.${convoId}`);
          };
          // Re-subscribe when conversation ID or token changes
     }, [conversation?.id, token, handleIncomingReaction]);

     // Scroll when messages change
     useEffect(() => {
          if (messages.length > 0) {
               const lastMsg = messages[messages.length - 1];
               const lastMsgId = lastMsg.id;

               if (isFirstLoad.current) {
                    scrollToBottom('auto');
                    isFirstLoad.current = false;
                    lastMessageIdRef.current = lastMsgId;
               } else if (lastMsgId !== lastMessageIdRef.current) {
                    // Only scroll to bottom if a NEW message was appended
                    scrollToBottom('smooth');
                    lastMessageIdRef.current = lastMsgId;
               }
          } else {
               lastMessageIdRef.current = null;
          }
     }, [messages]);

     // ── Keep customer marked online with 60s heartbeat ──────────────────────
     useEffect(() => {
          // Fire immediately when chat mounts
          authService.heartbeat().catch(() => { });
          const id = setInterval(() => {
               // Only heartbeat when tab is visible
               if (!document.hidden) {
                    authService.heartbeat().catch(() => { });
               }
          }, 60_000);
          return () => clearInterval(id);
     }, []);

     // ── Mark offline on tab close / navigate away ─────────────────────────
     useEffect(() => {
          const handleOffline = () => {
               authService.markOffline();
          };
          // pagehide fires more reliably than beforeunload on mobile/Safari
          window.addEventListener('pagehide', handleOffline);
          window.addEventListener('beforeunload', handleOffline);
          return () => {
               window.removeEventListener('pagehide', handleOffline);
               window.removeEventListener('beforeunload', handleOffline);
               // Also fire when the React component unmounts (chat widget closed)
               authService.markOffline();
          };
     }, []);

     // ── Poll owner online status every 30s from DB (replaces Pusher broadcast) ──
     useEffect(() => {
          if (!conversation?.other_user?.id) return;
          const ownerId = conversation.other_user.id;

          const poll = async () => {
               try {
                    const statuses = await chatService.getUserStatus([ownerId]);
                    const s = statuses.find(x => x.user_id === ownerId);
                    if (!s) return;
                    setConversation(prev => {
                         if (!prev) return prev;
                         return {
                              ...prev,
                              other_user: {
                                   ...prev.other_user,
                                   is_online: s.is_online,
                                   last_seen_at: s.last_seen_at,
                              },
                         };
                    });
               } catch (_) { }
          };

          // Fire immediately, then every 30 seconds
          poll();
          const id = setInterval(poll, 30_000);
          return () => clearInterval(id);
     }, [conversation?.other_user?.id]);

     // 3. Send message (text + image queue)
     const handleSendMessage = async (e?: React.FormEvent) => {
          if (e) e.preventDefault();
          const hasText = inputValue.trim().length > 0;
          const hasImages = pendingImages.length > 0;
          if (!conversation || (!hasText && !hasImages) || isSending || isUploading) return;

          const text = inputValue.trim();
          setInputValue('');
          setIsSending(true);

          try {
               // 1. Send text message first (if any)
               if (hasText) {
                    const newMsg = await chatService.sendMessage(
                         conversation.id,
                         text,
                         'text',
                         undefined,
                         replyingToMessage?.id || undefined
                    );
                    setReplyingToMessage(null);
                    setMessages(prev => {
                         if (prev.some(m => m.id === newMsg.id)) return prev;
                         setTimeout(scrollToBottom, 50);
                         return [...prev, newMsg];
                    });
               }

               // 2. Upload & send each queued image sequentially
               if (hasImages) {
                    const imagesToSend = [...pendingImages];
                    // Revoke preview URLs and clear queue immediately
                    imagesToSend.forEach(p => URL.revokeObjectURL(p.preview));
                    setPendingImages([]);
                    if (multiFileInputRef.current) multiFileInputRef.current.value = '';

                    for (const { file } of imagesToSend) {
                         setIsUploading(true);
                         try {
                              const uploadRes = await chatService.uploadChatImage(file);
                              const imageMsg = await chatService.sendMessage(
                                   conversation.id,
                                   '',
                                   'image',
                                   uploadRes.path,
                                   replyingToMessage?.id || undefined
                              );
                              setReplyingToMessage(null);
                              setMessages(prev => {
                                   if (prev.some(m => Number(m.id) === Number(imageMsg.id))) return prev;
                                   setTimeout(scrollToBottom, 50);
                                   return [...prev, imageMsg];
                              });
                         } catch (imgErr: any) {
                              toast.error(imgErr?.message || `Failed to upload ${file.name}`);
                         } finally {
                              setIsUploading(false);
                         }
                    }
               }
          } catch (err: any) {
               toast.error('Failed to send message');
               setInputValue(text);
          } finally {
               setIsSending(false);
          }
     };

     // 4. Multi-image queue handlers
     const MAX_FILE_SIZE_MB = 25;
     const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
     const MAX_IMAGES = 10;

     const handleAttachmentClick = () => {
          multiFileInputRef.current?.click();
     };

     const handleMultiFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const files = Array.from(e.target.files || []);
          if (!files.length) return;

          const valid: { file: File; preview: string }[] = [];
          let rejected = 0;

          for (const file of files) {
               if (file.size > MAX_FILE_SIZE_BYTES) {
                    rejected++;
                    continue;
               }
               valid.push({ file, preview: URL.createObjectURL(file) });
          }

          if (rejected > 0) {
               toast.error(`${rejected} file(s) exceed the ${MAX_FILE_SIZE_MB}MB limit and were skipped.`);
          }

          setPendingImages(prev => {
               const combined = [...prev, ...valid];
               if (combined.length > MAX_IMAGES) {
                    toast.error(`Max ${MAX_IMAGES} images per message.`);
                    return combined.slice(0, MAX_IMAGES);
               }
               return combined;
          });

          // Reset input so same files can be added again if needed
          if (multiFileInputRef.current) multiFileInputRef.current.value = '';
     };

     const handleRemovePendingImage = (index: number) => {
          setPendingImages(prev => {
               URL.revokeObjectURL(prev[index].preview);
               return prev.filter((_, i) => i !== index);
          });
     };

     const formatMessageTime = (dateStr: string) => {
          try {
               const date = new Date(dateStr);
               return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
          } catch {
               return '';
          }
     };

     const renderMessageDateSeparator = (msg: Message, prevMsg?: Message) => {
          try {
               const msgDate = new Date(msg.created_at).toLocaleDateString([], { day: 'numeric', month: 'long' });
               if (!prevMsg) {
                    return (
                         <div className="flex justify-center my-4 select-none">
                              <span className="px-3 py-1 bg-slate-100 border border-slate-200/50 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                   {msgDate}
                              </span>
                         </div>
                    );
               }
               const prevDate = new Date(prevMsg.created_at).toLocaleDateString([], { day: 'numeric', month: 'long' });
               if (msgDate !== prevDate) {
                    return (
                         <div className="flex justify-center my-4 select-none">
                              <span className="px-3 py-1 bg-slate-100 border border-slate-200/50 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                   {msgDate}
                              </span>
                         </div>
                    );
               }
          } catch (_) { }
          return null;
     };

     // ── Group consecutive image messages from same sender (within 60s) into a collage ──
     type SingleEntry = { kind: 'single'; msg: Message };
     type GroupEntry = { kind: 'group'; msgs: Message[]; senderId: number };
     type MsgEntry = SingleEntry | GroupEntry;

     const groupMessages = (msgs: Message[]): MsgEntry[] => {
          const result: MsgEntry[] = [];
          let i = 0;
          while (i < msgs.length) {
               const msg = msgs[i];
               if (msg.message_type === 'image') {
                    const group = [msg];
                    let j = i + 1;
                    while (
                         j < msgs.length &&
                         msgs[j].message_type === 'image' &&
                         Number(msgs[j].sender_id) === Number(msg.sender_id) &&
                         Math.abs(new Date(msgs[j].created_at).getTime() - new Date(msg.created_at).getTime()) < 60_000
                    ) {
                         group.push(msgs[j]);
                         j++;
                    }
                    if (group.length > 1) {
                         result.push({ kind: 'group', msgs: group, senderId: Number(msg.sender_id) });
                    } else {
                         result.push({ kind: 'single', msg });
                    }
                    i = j;
               } else {
                    result.push({ kind: 'single', msg });
                    i++;
               }
          }
          return result;
     };

     // ── Image collage grid renderer ──────────────────────────────────────────
     const renderImageCollage = (imgs: Message[]) => {
          const MAX_SHOW = 4;
          const shown = imgs.slice(0, MAX_SHOW);
          const extra = imgs.length - MAX_SHOW;

          // Grid layout classes
          const gridClass =
               shown.length === 1 ? 'grid-cols-1' :
                    shown.length === 2 ? 'grid-cols-2' :
                         shown.length === 3 ? 'grid-cols-2' :
                              'grid-cols-2';

          return (
               <div className={`grid ${gridClass} gap-1 rounded-[10px] overflow-hidden`} style={{ maxWidth: 220 }}>
                    {shown.map((m, idx) => {
                         const isLast = idx === shown.length - 1;
                         const showOverlay = isLast && extra > 0;
                         // 3-image: first spans 2 cols
                         const spanFull = shown.length === 3 && idx === 0;
                         return (
                              <div
                                   key={m.id}
                                   data-msg-id={m.id}
                                   className={`relative overflow-hidden ${spanFull ? 'col-span-2' : ''
                                        }`}
                                   style={{ aspectRatio: spanFull ? '2/1' : '1/1' }}
                              >
                                   <a
                                        href={m.media_url ? resolveImageUrl(m.media_url) : '#'}
                                        onClick={(e) => {
                                             e.preventDefault();
                                             const allUrls = imgs.map(img => img.media_url ? resolveImageUrl(img.media_url) : '').filter(Boolean);
                                             handleImageClick(allUrls, idx);
                                        }}
                                        className="block w-full h-full cursor-pointer"
                                   >
                                        <img
                                             src={m.media_url ? resolveImageUrl(m.media_url) : ''}
                                             alt={`Photo ${idx + 1}`}
                                             className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                                             onLoad={() => scrollToBottom('auto')}
                                        />
                                   </a>
                                   {showOverlay && (
                                        <div
                                             className="absolute inset-0 bg-black/55 flex items-center justify-center cursor-pointer"
                                             onClick={() => {
                                                  const allUrls = imgs.map(img => img.media_url ? resolveImageUrl(img.media_url) : '').filter(Boolean);
                                                  handleImageClick(allUrls, MAX_SHOW - 1);
                                             }}
                                        >
                                             <span className="text-white text-lg font-black">+{extra + 1}</span>
                                        </div>
                                   )}
                              </div>
                         );
                    })}
               </div>
          );
     };

     if (isLoading) {
          return (
               <div className="w-full h-[450px] flex flex-col items-center justify-center gap-2 text-stone-400">
                    <FiLoader className="w-8 h-8 animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Opening Chat Securely...</span>
               </div>
          );
     }

     if (!conversation) {
          return (
               <div className="w-full h-[450px] flex flex-col items-center justify-center gap-3 text-stone-400">
                    <FiMessageSquare className="w-10 h-10 stroke-1" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Unable to establish connection</span>
               </div>
          );
     }

     const otherUser = conversation.other_user;
     const storeNameText = stores?.store_name || otherUser?.name || 'Boutique Store';

     return (
          <div className="w-full flex flex-col h-[550px] bg-white border border-stone-200/40 rounded-[3px] overflow-hidden select-none font-sans text-stone-850">
               {/* ── Chat Header ─────────────────────────────────────────── */}
               <div className="flex justify-between items-center px-5 py-4 bg-white border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-3">
                         <div className="relative">
                              {stores?.logo_url ? (
                                   <img
                                        src={resolveImageUrl(stores?.logo_url)}
                                        alt={storeNameText}
                                        className="w-10 h-10 rounded-full object-cover border border-slate-100"
                                   />
                              ) : (
                                   <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black">
                                        {storeNameText.charAt(0).toUpperCase()}
                                   </div>
                              )}
                              <span
                                   className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${otherUser?.is_online ? 'bg-emerald-500' : 'bg-slate-300'
                                        }`}
                              />
                         </div>
                         <div className="text-left">
                              <h4 className="text-xs font-black text-slate-800 leading-tight">
                                   {storeNameText}
                              </h4>
                              <span className={`text-[10px] font-bold tracking-wider ${otherUser?.is_online ? 'text-emerald-500' : 'text-slate-400'
                                   }`}>
                                   {otherUser?.is_online ? 'ONLINE' : 'OFFLINE'}
                              </span>
                         </div>
                    </div>
               </div>

               {/* ── Message Feed ───────────────────────────────────────── */}
               <div
                    ref={messageContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/20 custom-scrollbar"
               >
                    {loadingMessages ? (
                         <div className="h-full flex flex-col items-center justify-center py-20 text-slate-400">
                              <FiLoader className="w-8 h-8 animate-spin text-primary mb-2.5" />
                              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading Messages...</p>
                         </div>
                    ) : messages.length === 0 ? (
                         <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                              <FiMessageSquare className="w-8 h-8 stroke-1 mb-2" />
                              <p className="text-[10px] font-black uppercase tracking-widest">Start the Conversation</p>
                              <p className="text-[9px] font-semibold text-slate-400 mt-1 max-w-[200px] leading-relaxed">
                                   Ask about product availability, order details, or sizing suggestions.
                              </p>
                         </div>
                    ) : (
                         <>
                              {/* Loading Older Messages Spinner */}
                              {loadingMore && (
                                   <div className="w-full flex justify-center py-2 text-slate-400 select-none">
                                        <FiLoader className="w-4 h-4 animate-spin text-primary mr-1.5" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Loading older messages...</span>
                                   </div>
                              )}

                              {/* History Limit Indicator */}
                              {messages.length > 0 && !loadingMore && (
                                   <div className="w-full flex justify-center pb-2 select-none">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100/80 border border-slate-200/50 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                             <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
                                             <span>History Limit: Last 100 Messages Shown</span>
                                        </div>
                                   </div>
                              )}

                              {(() => {
                                   const sliced = messages.slice(-100);
                                   const grouped = groupMessages(sliced);

                                   return grouped.map((entry, entryIdx) => {
                                        const currentMsg = entry.kind === 'single' ? entry.msg : entry.msgs[0];
                                        const prevEntry = entryIdx > 0 ? grouped[entryIdx - 1] : undefined;
                                        const prevMsg = prevEntry ? (prevEntry.kind === 'single' ? prevEntry.msg : prevEntry.msgs[0]) : undefined;

                                        const separator = renderMessageDateSeparator(currentMsg, prevMsg);

                                        if (entry.kind === 'group') {
                                             // ── IMAGE GROUP BUBBLE ──────────────────────────────
                                             const isMe = entry.senderId === Number(user?.id);
                                             const first = entry.msgs[0];
                                             return (
                                                  <React.Fragment key={`group-${first.id}-${entryIdx}`}>
                                                       {separator}
                                                       <div
                                                            className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} ${entry.msgs.some(m => m.id === flashingMsgId) ? 'animate-msg-flash' : ''
                                                                 }`}
                                                       >
                                                            {isMe ? (
                                                                 <div className="flex gap-3 items-start max-w-[85%] justify-end group relative">
                                                                      {/* Action Bar (revealed on hover) */}
                                                                      <div className={`absolute right-full top-1/2 -translate-y-1/2 pr-3 z-30 transition-opacity duration-150 ${activeReactMessageId === first.id
                                                                           ? 'opacity-100 pointer-events-auto'
                                                                           : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'
                                                                           }`}>
                                                                           <div className="flex items-center gap-1 bg-slate-100/90 border border-slate-200/50 rounded-full px-1.5 py-1 shadow-3xs">
                                                                                <div className="relative flex items-center justify-center">
                                                                                     <button
                                                                                          type="button"
                                                                                          onClick={() => setActiveReactMessageId(prev => prev === first.id ? null : first.id)}
                                                                                          className={`p-1 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-200/80 transition-all border-none bg-transparent cursor-pointer flex items-center justify-center ${activeReactMessageId === first.id ? 'bg-slate-200 text-slate-900' : ''
                                                                                               }`}
                                                                                          title="React"
                                                                                     >
                                                                                          <FiSmile className="w-3.5 h-3.5" />
                                                                                     </button>

                                                                                     {activeReactMessageId === first.id && (
                                                                                          <>
                                                                                               <div className="fixed inset-0 z-40 bg-transparent cursor-default" onClick={() => setActiveReactMessageId(null)} />
                                                                                               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-50 bg-[#262626] text-white rounded-full py-1.5 px-3.5 shadow-lg border border-slate-800 flex items-center gap-2 select-none">
                                                                                                    {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                                                                                                         <button
                                                                                                              key={emoji}
                                                                                                              type="button"
                                                                                                              onClick={() => handleReactToMessage(first.id, emoji)}
                                                                                                              className="text-base hover:scale-125 hover:-translate-y-0.5 active:scale-95 transition-all border-none bg-transparent cursor-pointer"
                                                                                                         >
                                                                                                              {emoji}
                                                                                                         </button>
                                                                                                    ))}
                                                                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-[#262626] rotate-45 -mt-1" />
                                                                                               </div>
                                                                                          </>
                                                                                     )}
                                                                                </div>
                                                                                <button
                                                                                     type="button"
                                                                                     onClick={() => {
                                                                                          setReplyingToMessage(first);
                                                                                          const input = document.querySelector('input[placeholder="Ask a question..."]') as HTMLInputElement;
                                                                                          if (input) input.focus();
                                                                                     }}
                                                                                     className="p-1 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-200/80 transition-all border-none bg-transparent cursor-pointer flex items-center justify-center"
                                                                                     title="Reply"
                                                                                >
                                                                                     <FiCornerUpLeft className="w-3.5 h-3.5" />
                                                                                </button>
                                                                                <div className="relative flex items-center justify-center">
                                                                                     <button
                                                                                          type="button"
                                                                                          onClick={() => setActiveMenuMessageId(prev => prev === first.id ? null : first.id)}
                                                                                          className="p-1 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-200/80 transition-all border-none bg-transparent cursor-pointer flex items-center justify-center"
                                                                                          title="More Options"
                                                                                     >
                                                                                          <FiMoreVertical className="w-3.5 h-3.5" />
                                                                                     </button>

                                                                                     {activeMenuMessageId === first.id && (
                                                                                          <>
                                                                                               <div className="fixed inset-0 z-40 bg-transparent cursor-default" onClick={() => setActiveMenuMessageId(null)} />
                                                                                               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-50 bg-[#262626] text-white rounded-[8px] py-1.5 px-1 shadow-lg border border-slate-800 text-left min-w-[90px] flex flex-col select-none">
                                                                                                    <button
                                                                                                         type="button"
                                                                                                         onClick={() => handleRemoveMessage(first.id)}
                                                                                                         className="w-full text-left px-3 py-1.5 hover:bg-white/10 rounded-[6px] text-[11px] font-bold text-white border-none bg-transparent cursor-pointer transition-colors"
                                                                                                    >
                                                                                                         Remove
                                                                                                    </button>
                                                                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-[#262626] rotate-45 -mt-1" />
                                                                                               </div>
                                                                                          </>
                                                                                     )}
                                                                                </div>
                                                                           </div>
                                                                      </div>

                                                                      <div className="flex flex-col items-end">
                                                                           <div className="flex items-baseline mb-1.5 select-none">
                                                                                <span className="text-[9px] font-bold text-slate-400 mr-2">{formatMessageTime(first.created_at)}</span>
                                                                                <span className="text-xs font-black text-slate-800">You</span>
                                                                           </div>
                                                                           <div className="rounded-[12px] overflow-hidden shadow-3xs">
                                                                                {renderImageCollage(entry.msgs)}
                                                                           </div>
                                                                           <span className="text-[9px] font-bold text-slate-400 mt-1 select-none">
                                                                                {entry.msgs.length} photos
                                                                           </span>

                                                                           {/* Reactions */}
                                                                           {first.reactions && first.reactions.length > 0 && (
                                                                                <div className="flex flex-wrap gap-1.5 mt-1.5 select-none justify-end">
                                                                                     {groupReactions(first.reactions).map(g => (
                                                                                          <button
                                                                                               key={g.emoji}
                                                                                               type="button"
                                                                                               onClick={() => handleReactToMessage(first.id, g.emoji)}
                                                                                               title={g.names.join(', ')}
                                                                                               className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer shadow-3xs ${g.userReacted
                                                                                                    ? 'bg-[#1a73e8]/10 text-[#1a73e8] border-[#1a73e8]/30 hover:bg-[#1a73e8]/20 shadow-2xs'
                                                                                                    : 'bg-slate-50 border-slate-200/60 text-slate-600 hover:bg-slate-100'
                                                                                                    }`}
                                                                                          >
                                                                                               <span className="text-sm scale-110 duration-150">{g.emoji}</span>
                                                                                               <span className="font-extrabold tracking-tight">{g.count}</span>
                                                                                          </button>
                                                                                     ))}
                                                                                </div>
                                                                           )}
                                                                      </div>
                                                                      <div className="shrink-0 mb-0.5 select-none">
                                                                           <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shadow-3xs">
                                                                                {user?.name ? user.name.charAt(0).toUpperCase() : 'Y'}
                                                                           </div>
                                                                      </div>
                                                                 </div>
                                                            ) : (
                                                                 <div className="flex gap-3 items-start max-w-[85%] justify-start group relative">
                                                                      <div className="shrink-0 mb-0.5 select-none">
                                                                           {stores?.logo_url ? (
                                                                                <img src={resolveImageUrl(stores.logo_url)} alt={storeNameText} className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-3xs" />
                                                                           ) : (
                                                                                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shadow-3xs">
                                                                                     {storeNameText.charAt(0).toUpperCase()}
                                                                                </div>
                                                                           )}
                                                                      </div>
                                                                      <div className="flex flex-col items-start">
                                                                           <div className="flex items-baseline mb-1.5 select-none">
                                                                                <span className="text-xs font-black text-slate-800">{storeNameText}</span>
                                                                                <span className="text-[9px] font-bold text-slate-400 ml-2">{formatMessageTime(first.created_at)}</span>
                                                                           </div>
                                                                           <div className="rounded-[12px] overflow-hidden shadow-3xs border border-slate-150">
                                                                                {renderImageCollage(entry.msgs)}
                                                                           </div>
                                                                           <span className="text-[9px] font-bold text-slate-400 mt-1 select-none">
                                                                                {entry.msgs.length} photos
                                                                           </span>

                                                                           {/* Reactions */}
                                                                           {first.reactions && first.reactions.length > 0 && (
                                                                                <div className="flex flex-wrap gap-1.5 mt-1.5 select-none justify-start">
                                                                                     {groupReactions(first.reactions).map(g => (
                                                                                          <button
                                                                                               key={g.emoji}
                                                                                               type="button"
                                                                                               onClick={() => handleReactToMessage(first.id, g.emoji)}
                                                                                               title={g.names.join(', ')}
                                                                                               className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer shadow-3xs ${g.userReacted
                                                                                                    ? 'bg-[#1a73e8]/10 text-[#1a73e8] border-[#1a73e8]/30 hover:bg-[#1a73e8]/20 shadow-2xs'
                                                                                                    : 'bg-slate-50 border-slate-200/60 text-slate-600 hover:bg-slate-100'
                                                                                                    }`}
                                                                                          >
                                                                                               <span className="text-sm scale-110 duration-150">{g.emoji}</span>
                                                                                               <span className="font-extrabold tracking-tight">{g.count}</span>
                                                                                          </button>
                                                                                     ))}
                                                                                </div>
                                                                           )}
                                                                      </div>

                                                                      {/* Action Bar (revealed on hover) */}
                                                                      <div className={`absolute left-full top-1/2 -translate-y-1/2 pl-3 z-30 transition-opacity duration-150 ${activeReactMessageId === first.id || activeMenuMessageId === first.id
                                                                           ? 'opacity-100 pointer-events-auto'
                                                                           : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'
                                                                           }`}>
                                                                           <div className="flex items-center gap-1 bg-slate-100/90 border border-slate-200/50 rounded-full px-1.5 py-1 shadow-3xs">
                                                                                <div className="relative flex items-center justify-center">
                                                                                     <button
                                                                                          type="button"
                                                                                          onClick={() => setActiveReactMessageId(prev => prev === first.id ? null : first.id)}
                                                                                          className={`p-1 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-200/80 transition-all border-none bg-transparent cursor-pointer flex items-center justify-center ${activeReactMessageId === first.id ? 'bg-slate-200 text-slate-900' : ''
                                                                                               }`}
                                                                                          title="React"
                                                                                     >
                                                                                          <FiSmile className="w-3.5 h-3.5" />
                                                                                     </button>

                                                                                     {activeReactMessageId === first.id && (
                                                                                          <>
                                                                                               <div className="fixed inset-0 z-40 bg-transparent cursor-default" onClick={() => setActiveReactMessageId(null)} />
                                                                                               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-50 bg-[#262626] text-white rounded-full py-1.5 px-3.5 shadow-lg border border-slate-800 flex items-center gap-2 select-none">
                                                                                                    {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                                                                                                         <button
                                                                                                              key={emoji}
                                                                                                              type="button"
                                                                                                              onClick={() => handleReactToMessage(first.id, emoji)}
                                                                                                              className="text-base hover:scale-125 hover:-translate-y-0.5 active:scale-95 transition-all border-none bg-transparent cursor-pointer"
                                                                                                         >
                                                                                                              {emoji}
                                                                                                         </button>
                                                                                                    ))}
                                                                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-[#262626] rotate-45 -mt-1" />
                                                                                               </div>
                                                                                          </>
                                                                                     )}
                                                                                </div>
                                                                                <button
                                                                                     type="button"
                                                                                     onClick={() => {
                                                                                          setReplyingToMessage(first);
                                                                                          const input = document.querySelector('input[placeholder="Ask a question..."]') as HTMLInputElement;
                                                                                          if (input) input.focus();
                                                                                     }}
                                                                                     className="p-1 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-200/80 transition-all border-none bg-transparent cursor-pointer flex items-center justify-center"
                                                                                     title="Reply"
                                                                                >
                                                                                     <FiCornerUpLeft className="w-3.5 h-3.5" />
                                                                                </button>
                                                                                <div className="relative flex items-center justify-center">
                                                                                     <button
                                                                                          type="button"
                                                                                          onClick={() => setActiveMenuMessageId(prev => prev === first.id ? null : first.id)}
                                                                                          className="p-1 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-200/80 transition-all border-none bg-transparent cursor-pointer flex items-center justify-center"
                                                                                          title="More Options"
                                                                                     >
                                                                                          <FiMoreVertical className="w-3.5 h-3.5" />
                                                                                     </button>

                                                                                     {activeMenuMessageId === first.id && (
                                                                                          <>
                                                                                               <div className="fixed inset-0 z-40 bg-transparent cursor-default" onClick={() => setActiveMenuMessageId(null)} />
                                                                                               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-50 bg-[#262626] text-white rounded-[8px] py-1.5 px-1 shadow-lg border border-slate-800 text-left min-w-[90px] flex flex-col select-none">
                                                                                                    <button
                                                                                                         type="button"
                                                                                                         onClick={() => handleRemoveMessage(first.id)}
                                                                                                         className="w-full text-left px-3 py-1.5 hover:bg-white/10 rounded-[6px] text-[11px] font-bold text-white border-none bg-transparent cursor-pointer transition-colors"
                                                                                                    >
                                                                                                         Remove
                                                                                                    </button>
                                                                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-[#262626] rotate-45 -mt-1" />
                                                                                               </div>
                                                                                          </>
                                                                                     )}
                                                                                </div>
                                                                           </div>
                                                                      </div>
                                                                 </div>
                                                            )}
                                                       </div>
                                                  </React.Fragment>
                                             );
                                        }

                                        // ── SINGLE MESSAGE ──────────────────────────────────
                                        const { msg } = entry;
                                        const isMe = Number(msg.sender_id) === Number(user?.id);
                                        const index = entryIdx;
                                        return (
                                             <React.Fragment key={msg.id || index}>
                                                  {separator}
                                                  <div
                                                       data-msg-id={msg.id}
                                                       className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} ${flashingMsgId === msg.id ? 'animate-msg-flash' : ''}`}
                                                  >
                                                       {isMe ? (
                                                            /* OUTGOING MESSAGE (Right Aligned) */
                                                            <div className="flex gap-3 items-start max-w-[85%] justify-end group relative">
                                                                 {/* Action Bar (revealed on hover) */}
                                                                 <div className={`absolute right-full top-1/2 -translate-y-1/2 pr-3 z-30 transition-opacity duration-150 ${activeReactMessageId === msg.id || activeMenuMessageId === msg.id
                                                                      ? 'opacity-100 pointer-events-auto'
                                                                      : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'
                                                                      }`}>
                                                                      <div className="flex items-center gap-1 bg-slate-100/90 border border-slate-200/50 rounded-full px-1.5 py-1 shadow-3xs">
                                                                           <div className="relative flex items-center justify-center">
                                                                                <button
                                                                                     type="button"
                                                                                     onClick={() => setActiveReactMessageId(prev => prev === msg.id ? null : msg.id)}
                                                                                     className={`p-1 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-200/80 transition-all border-none bg-transparent cursor-pointer flex items-center justify-center ${activeReactMessageId === msg.id ? 'bg-slate-200 text-slate-900' : ''
                                                                                          }`}
                                                                                     title="React"
                                                                                >
                                                                                     <FiSmile className="w-3.5 h-3.5" />
                                                                                </button>

                                                                                {activeReactMessageId === msg.id && (
                                                                                     <>
                                                                                          <div className="fixed inset-0 z-40 bg-transparent cursor-default" onClick={() => setActiveReactMessageId(null)} />
                                                                                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-50 bg-[#262626] text-white rounded-full py-1.5 px-3.5 shadow-lg border border-slate-800 flex items-center gap-2 select-none">
                                                                                               {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                                                                                                    <button
                                                                                                         key={emoji}
                                                                                                         type="button"
                                                                                                         onClick={() => handleReactToMessage(msg.id, emoji)}
                                                                                                         className="text-base hover:scale-125 hover:-translate-y-0.5 active:scale-95 transition-all border-none bg-transparent cursor-pointer"
                                                                                                    >
                                                                                                         {emoji}
                                                                                                    </button>
                                                                                               ))}
                                                                                               <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-[#262626] rotate-45 -mt-1" />
                                                                                          </div>
                                                                                     </>
                                                                                )}
                                                                           </div>
                                                                           <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                     setReplyingToMessage(msg);
                                                                                     const input = document.querySelector('input[placeholder="Ask a question..."]') as HTMLInputElement;
                                                                                     if (input) input.focus();
                                                                                }}
                                                                                className="p-1 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-200/80 transition-all border-none bg-transparent cursor-pointer flex items-center justify-center"
                                                                                title="Reply"
                                                                           >
                                                                                <FiCornerUpLeft className="w-3.5 h-3.5" />
                                                                           </button>
                                                                           <div className="relative flex items-center justify-center">
                                                                                <button
                                                                                     type="button"
                                                                                     onClick={() => setActiveMenuMessageId(prev => prev === msg.id ? null : msg.id)}
                                                                                     className="p-1 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-200/80 transition-all border-none bg-transparent cursor-pointer flex items-center justify-center"
                                                                                     title="More Options"
                                                                                >
                                                                                     <FiMoreVertical className="w-3.5 h-3.5" />
                                                                                </button>

                                                                                {activeMenuMessageId === msg.id && (
                                                                                     <>
                                                                                          <div className="fixed inset-0 z-40 bg-transparent cursor-default" onClick={() => setActiveMenuMessageId(null)} />
                                                                                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-50 bg-[#262626] text-white rounded-[8px] py-1.5 px-1 shadow-lg border border-slate-800 text-left min-w-[90px] flex flex-col select-none">
                                                                                               <button
                                                                                                    type="button"
                                                                                                    onClick={() => handleRemoveMessage(msg.id)}
                                                                                                    className="w-full text-left px-3 py-1.5 hover:bg-white/10 rounded-[6px] text-[11px] font-bold text-white border-none bg-transparent cursor-pointer transition-colors"
                                                                                               >
                                                                                                    Remove
                                                                                               </button>
                                                                                               <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-[#262626] rotate-45 -mt-1" />
                                                                                          </div>
                                                                                     </>
                                                                                )}
                                                                           </div>
                                                                      </div>
                                                                 </div>

                                                                 {/* Content Block */}
                                                                 <div className="flex flex-col items-end">
                                                                      {/* Header: Time and Name */}
                                                                      <div className="flex items-baseline mb-1.5 select-none">
                                                                           <span className="text-[9px] font-bold text-slate-400 mr-2">
                                                                                {formatMessageTime(msg.created_at)}
                                                                           </span>
                                                                           <span className="text-xs font-black text-slate-800">You</span>
                                                                      </div>
                                                                      {msg.reply_to_message && (
                                                                           <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mb-1 select-none justify-end pr-1">
                                                                                <FiCornerUpLeft className="w-3 h-3 text-slate-450 rotate-180" />
                                                                                <span>
                                                                                     You replied to{' '}
                                                                                     <strong className="text-slate-500 font-extrabold">
                                                                                          {Number(msg.reply_to_message.sender?.id) === Number(user?.id)
                                                                                               ? 'yourself'
                                                                                               : (msg.reply_to_message.sender?.name || 'User')}
                                                                                     </strong>
                                                                                </span>
                                                                           </div>
                                                                      )}
                                                                      {/* Bubble */}
                                                                      <div className={msg.message_type === 'audio' ? 'text-left' : 'px-4 py-2.5 rounded-[5px] text-xs leading-relaxed font-medium bg-[#1a73e8] text-white shadow-3xs text-left'}>
                                                                           {msg.reply_to_message && (
                                                                                <div
                                                                                     onClick={() => handleScrollToMessage(msg.reply_to_message_id!)}
                                                                                     className="mb-2.5 p-2 bg-black/15 hover:bg-black/25 border-l-2 border-white/60 text-white/90 cursor-pointer transition-all select-none text-left rounded-r-[6px] rounded-l-[2px]"
                                                                                >
                                                                                     <div className="text-[9px] font-black uppercase tracking-wider text-white/70">
                                                                                          {msg.reply_to_message.sender?.name || 'User'}
                                                                                     </div>
                                                                                     <p className="max-h-28 overflow-y-auto custom-scrollbar mt-0.5 text-[11px] leading-normal font-medium italic text-white/95 whitespace-pre-wrap break-words">
                                                                                          {msg.reply_to_message.message_type === 'image' ? '📷 Photo' : msg.reply_to_message.message_type === 'audio' ? '🎵 Voice message' : renderMessageBody(msg.reply_to_message.body || '', true)}
                                                                                     </p>
                                                                                </div>
                                                                           )}
                                                                           {msg.message_type === 'image' ? (
                                                                                <div className="relative rounded overflow-hidden mt-0.5 border border-slate-200/20">
                                                                                     <a
                                                                                          href={msg.media_url ? resolveImageUrl(msg.media_url) : '#'}
                                                                                          onClick={(e) => {
                                                                                               e.preventDefault();
                                                                                               if (msg.media_url) {
                                                                                                    handleImageClick([resolveImageUrl(msg.media_url)], 0);
                                                                                               }
                                                                                          }}
                                                                                          className="block cursor-pointer"
                                                                                     >
                                                                                          <img
                                                                                               src={msg.media_url ? resolveImageUrl(msg.media_url) : ''}
                                                                                               alt="Attachment"
                                                                                               className="max-w-full max-h-60 object-contain rounded hover:opacity-95 transition-opacity"
                                                                                               onLoad={() => scrollToBottom('auto')}
                                                                                          />
                                                                                     </a>
                                                                                </div>
                                                                           ) : msg.message_type === 'audio' ? (
                                                                                <VoicePlayer src={msg.media_url ? resolveImageUrl(msg.media_url) : ''} isMe={true} />
                                                                           ) : (
                                                                                <p className="whitespace-pre-wrap break-words">{renderMessageBody(msg.body || '', true)}</p>
                                                                           )}
                                                                      </div>
                                                                      {/* Reactions */}
                                                                      {msg.reactions && msg.reactions.length > 0 && (
                                                                           <div className="flex flex-wrap gap-1.5 mt-1.5 select-none justify-end">
                                                                                {groupReactions(msg.reactions).map(g => (
                                                                                     <button
                                                                                          key={g.emoji}
                                                                                          type="button"
                                                                                          onClick={() => handleReactToMessage(msg.id, g.emoji)}
                                                                                          title={g.names.join(', ')}
                                                                                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer shadow-3xs ${g.userReacted
                                                                                               ? 'bg-[#1a73e8]/10 text-[#1a73e8] border-[#1a73e8]/30 hover:bg-[#1a73e8]/20 shadow-2xs'
                                                                                               : 'bg-slate-50 border-slate-200/60 text-slate-600 hover:bg-slate-100'
                                                                                               }`}
                                                                                     >
                                                                                          <span className="text-sm scale-110 duration-150">{g.emoji}</span>
                                                                                          <span className="font-extrabold tracking-tight">{g.count}</span>
                                                                                     </button>
                                                                                ))}
                                                                           </div>
                                                                      )}
                                                                 </div>
                                                                 {/* Avatar */}
                                                                 <div className="shrink-0 mt-0.5 select-none">
                                                                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shadow-3xs">
                                                                           {user?.name ? user.name.charAt(0).toUpperCase() : 'Y'}
                                                                      </div>
                                                                 </div>
                                                            </div>
                                                       ) : (
                                                            /* INCOMING MESSAGE (Left Aligned) */
                                                            <div className="flex gap-3 items-start max-w-[85%] justify-start group relative">
                                                                 {/* Avatar */}
                                                                 <div className="shrink-0 mt-0.5 select-none">
                                                                      {stores?.logo_url ? (
                                                                           <img
                                                                                src={resolveImageUrl(stores.logo_url)}
                                                                                alt={storeNameText}
                                                                                className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-3xs"
                                                                           />
                                                                      ) : (
                                                                           <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shadow-3xs">
                                                                                {storeNameText.charAt(0).toUpperCase()}
                                                                           </div>
                                                                      )}
                                                                 </div>
                                                                 {/* Content Block */}
                                                                 <div className="flex flex-col items-start">
                                                                      {/* Header: Name and Time */}
                                                                      <div className="flex items-baseline mb-1.5 select-none">
                                                                           <span className="text-xs font-black text-slate-800">{storeNameText}</span>
                                                                           <span className="text-[9px] font-bold text-slate-400 ml-2">
                                                                                {formatMessageTime(msg.created_at)}
                                                                           </span>
                                                                      </div>
                                                                      {msg.reply_to_message && (
                                                                           <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mb-1 select-none justify-start pl-1">
                                                                                <FiCornerUpLeft className="w-3 h-3 text-slate-450" />
                                                                                <span>
                                                                                     <strong className="text-slate-500 font-extrabold">{storeNameText}</strong>
                                                                                     {' '}replied to{' '}
                                                                                     <strong className="text-slate-500 font-extrabold">
                                                                                          {Number(msg.reply_to_message.sender?.id) === Number(user?.id)
                                                                                               ? 'You'
                                                                                               : (msg.reply_to_message.sender?.name || 'User')}
                                                                                     </strong>
                                                                                </span>
                                                                           </div>
                                                                      )}
                                                                      {/* Bubble */}
                                                                      <div className={msg.message_type === 'audio' ? 'text-left' : 'px-4 py-2.5 rounded-[5px] text-xs leading-relaxed font-medium bg-white text-slate-800 border border-slate-150 text-left'}>
                                                                           {msg.reply_to_message && (
                                                                                <div
                                                                                     onClick={() => handleScrollToMessage(msg.reply_to_message_id!)}
                                                                                     className="mb-2.5 p-2 bg-slate-50 hover:bg-slate-100/80 border-l-2 border-slate-400 text-[10px] text-slate-600 cursor-pointer transition-all select-none text-left rounded-r-[6px] rounded-l-[2px]"
                                                                                >
                                                                                     <div className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                                                                                          {msg.reply_to_message.sender?.name || 'User'}
                                                                                     </div>
                                                                                     <p className="max-h-28 overflow-y-auto custom-scrollbar mt-0.5 text-[11px] leading-normal font-medium italic text-slate-700 whitespace-pre-wrap break-words">
                                                                                          {msg.reply_to_message.message_type === 'image' ? '📷 Photo' : msg.reply_to_message.message_type === 'audio' ? '🎵 Voice message' : renderMessageBody(msg.reply_to_message.body || '', false)}
                                                                                     </p>
                                                                                </div>
                                                                           )}
                                                                           {msg.message_type === 'image' ? (
                                                                                <div className="relative rounded overflow-hidden mt-0.5 border border-slate-200/20">
                                                                                     <a
                                                                                          href={msg.media_url ? resolveImageUrl(msg.media_url) : '#'}
                                                                                          onClick={(e) => {
                                                                                               e.preventDefault();
                                                                                               if (msg.media_url) {
                                                                                                    handleImageClick([resolveImageUrl(msg.media_url)], 0);
                                                                                               }
                                                                                          }}
                                                                                          className="block cursor-pointer"
                                                                                     >
                                                                                          <img
                                                                                               src={msg.media_url ? resolveImageUrl(msg.media_url) : ''}
                                                                                               alt="Attachment"
                                                                                               className="max-w-full max-h-60 object-contain rounded hover:opacity-95 transition-opacity"
                                                                                               onLoad={() => scrollToBottom('auto')}
                                                                                          />
                                                                                     </a>
                                                                                </div>
                                                                           ) : msg.message_type === 'audio' ? (
                                                                                <VoicePlayer src={msg.media_url ? resolveImageUrl(msg.media_url) : ''} isMe={false} />
                                                                           ) : (
                                                                                <p className="whitespace-pre-wrap break-words">{renderMessageBody(msg.body || '', false)}</p>
                                                                           )}
                                                                      </div>
                                                                      {/* Reactions */}
                                                                      {msg.reactions && msg.reactions.length > 0 && (
                                                                           <div className="flex flex-wrap gap-1.5 mt-1.5 select-none justify-start">
                                                                                {groupReactions(msg.reactions).map(g => (
                                                                                     <button
                                                                                          key={g.emoji}
                                                                                          type="button"
                                                                                          onClick={() => handleReactToMessage(msg.id, g.emoji)}
                                                                                          title={g.names.join(', ')}
                                                                                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer shadow-3xs ${g.userReacted
                                                                                               ? 'bg-[#1a73e8]/10 text-[#1a73e8] border-[#1a73e8]/30 hover:bg-[#1a73e8]/20 shadow-2xs'
                                                                                               : 'bg-slate-50 border-slate-200/60 text-slate-600 hover:bg-slate-100'
                                                                                               }`}
                                                                                     >
                                                                                          <span className="text-sm scale-110 duration-150">{g.emoji}</span>
                                                                                          <span className="font-extrabold tracking-tight">{g.count}</span>
                                                                                     </button>
                                                                                ))}
                                                                           </div>
                                                                      )}
                                                                 </div>

                                                                 {/* Action Bar (revealed on hover) */}
                                                                 <div className={`absolute left-full top-1/2 -translate-y-1/2 pl-3 z-30 transition-opacity duration-150 ${activeReactMessageId === msg.id || activeMenuMessageId === msg.id
                                                                      ? 'opacity-100 pointer-events-auto'
                                                                      : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'
                                                                      }`}>
                                                                      <div className="flex items-center gap-1 bg-slate-100/90 border border-slate-200/50 rounded-full px-1.5 py-1 shadow-3xs">
                                                                           <div className="relative flex items-center justify-center">
                                                                                <button
                                                                                     type="button"
                                                                                     onClick={() => setActiveReactMessageId(prev => prev === msg.id ? null : msg.id)}
                                                                                     className={`p-1 rounded-full text-slate-500 hover:text-slate-950 hover:bg-slate-200/80 transition-all border-none bg-transparent cursor-pointer flex items-center justify-center ${activeReactMessageId === msg.id ? 'bg-slate-200 text-slate-900' : ''
                                                                                          }`}
                                                                                     title="React"
                                                                                >
                                                                                     <FiSmile className="w-3.5 h-3.5" />
                                                                                </button>

                                                                                {activeReactMessageId === msg.id && (
                                                                                     <>
                                                                                          <div className="fixed inset-0 z-40 bg-transparent cursor-default" onClick={() => setActiveReactMessageId(null)} />
                                                                                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-50 bg-[#262626] text-white rounded-full py-1.5 px-3.5 shadow-lg border border-slate-800 flex items-center gap-2 select-none">
                                                                                               {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                                                                                                    <button
                                                                                                         key={emoji}
                                                                                                         type="button"
                                                                                                         onClick={() => handleReactToMessage(msg.id, emoji)}
                                                                                                         className="text-base hover:scale-125 hover:-translate-y-0.5 active:scale-95 transition-all border-none bg-transparent cursor-pointer"
                                                                                                    >
                                                                                                         {emoji}
                                                                                                    </button>
                                                                                               ))}
                                                                                               <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-[#262626] rotate-45 -mt-1" />
                                                                                          </div>
                                                                                     </>
                                                                                )}
                                                                           </div>
                                                                           <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                     setReplyingToMessage(msg);
                                                                                     const input = document.querySelector('input[placeholder="Ask a question..."]') as HTMLInputElement;
                                                                                     if (input) input.focus();
                                                                                }}
                                                                                className="p-1 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-200/80 transition-all border-none bg-transparent cursor-pointer flex items-center justify-center"
                                                                                title="Reply"
                                                                           >
                                                                                <FiCornerUpLeft className="w-3.5 h-3.5" />
                                                                           </button>
                                                                           <div className="relative flex items-center justify-center">
                                                                                <button
                                                                                     type="button"
                                                                                     onClick={() => setActiveMenuMessageId(prev => prev === msg.id ? null : msg.id)}
                                                                                     className="p-1 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-200/80 transition-all border-none bg-transparent cursor-pointer flex items-center justify-center"
                                                                                     title="More Options"
                                                                                >
                                                                                     <FiMoreVertical className="w-3.5 h-3.5" />
                                                                                </button>

                                                                                {activeMenuMessageId === msg.id && (
                                                                                     <>
                                                                                          <div className="fixed inset-0 z-40 bg-transparent cursor-default" onClick={() => setActiveMenuMessageId(null)} />
                                                                                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-50 bg-[#262626] text-white rounded-[8px] py-1.5 px-1 shadow-lg border border-slate-800 text-left min-w-[90px] flex flex-col select-none">
                                                                                               <button
                                                                                                    type="button"
                                                                                                    onClick={() => handleRemoveMessage(msg.id)}
                                                                                                    className="w-full text-left px-3 py-1.5 hover:bg-white/10 rounded-[6px] text-[11px] font-bold text-white border-none bg-transparent cursor-pointer transition-colors"
                                                                                               >
                                                                                                    Remove
                                                                                               </button>
                                                                                               <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-[#262626] rotate-45 -mt-1" />
                                                                                          </div>
                                                                                     </>
                                                                                )}
                                                                           </div>
                                                                      </div>
                                                                 </div>
                                                            </div>
                                                       )}
                                                  </div>
                                             </React.Fragment>
                                        );
                                   });
                              })()}
                         </>
                    )}
                    <div ref={messagesEndRef} />
               </div>

               {/* ── Input Section ──────────────────────────────────────── */}
               {replyingToMessage && (
                    <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-150 flex items-center justify-between gap-3 shrink-0 select-none animate-slide-up">
                         <div className="flex-1 min-w-0 border-l-[3px] border-primary pl-3">
                              <div className="flex items-center gap-1.5">
                                   <span className="text-[10px] font-black uppercase text-primary">Replying to</span>
                                   <span className="text-[10px] font-black text-slate-800">
                                        {Number(replyingToMessage.sender_id) === Number(user?.id) ? 'You' : (otherUser?.name || 'Owner')}
                                   </span>
                              </div>
                              <p className="text-xs text-slate-500 truncate mt-0.5 italic">
                                   {replyingToMessage.message_type === 'image'
                                        ? '📷 Photo'
                                        : replyingToMessage.message_type === 'audio'
                                             ? '🎵 Voice message'
                                             : replyingToMessage.body && replyingToMessage.body.length > 80
                                                  ? replyingToMessage.body.slice(0, 80) + '...'
                                                  : replyingToMessage.body}
                              </p>
                         </div>
                         <button
                              type="button"
                              onClick={() => setReplyingToMessage(null)}
                              className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 border-none bg-transparent cursor-pointer flex items-center justify-center"
                              title="Cancel Reply"
                         >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                         </button>
                    </div>
               )}
               {/* ── Pending Image Preview Tray ──────────────────────────── */}
               {pendingImages.length > 0 && (
                    <div className="px-4 pt-3 pb-1 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
                         {pendingImages.map((img, idx) => (
                              <div key={idx} className="relative shrink-0 group/thumb">
                                   <img
                                        src={img.preview}
                                        alt={`pending-${idx}`}
                                        className="w-16 h-16 object-cover rounded-[10px] border border-slate-200 shadow-3xs"
                                   />
                                   <button
                                        type="button"
                                        onClick={() => handleRemovePendingImage(idx)}
                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-800 hover:bg-red-600 text-white rounded-full flex items-center justify-center border-2 border-white transition-colors cursor-pointer"
                                        title="Remove"
                                   >
                                        <FiX className="w-2.5 h-2.5" />
                                   </button>
                                   {/* Size label */}
                                   <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[8px] font-bold px-1 rounded">
                                        {(img.file.size / (1024 * 1024)).toFixed(1)}MB
                                   </span>
                              </div>
                         ))}
                         {/* Add more tile */}
                         {pendingImages.length < MAX_IMAGES && (
                              <button
                                   type="button"
                                   onClick={handleAttachmentClick}
                                   className="w-16 h-16 shrink-0 rounded-[10px] border-2 border-dashed border-slate-300 hover:border-primary hover:bg-primary/5 flex flex-col items-center justify-center text-slate-400 hover:text-primary transition-all cursor-pointer"
                                   title="Add more images"
                              >
                                   <FiPlus className="w-5 h-5" />
                                   <span className="text-[8px] font-bold mt-0.5">Add</span>
                              </button>
                         )}
                    </div>
               )}
               <form
                    onSubmit={handleSendMessage}
                    className="px-5 py-4 border-t border-slate-100 bg-white flex items-center gap-3 shrink-0 relative"
               >
                    {isRecording ? (
                         <div className="flex-grow flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-[10px] px-3 py-2 text-xs font-semibold select-none">
                              <div className="flex items-center gap-2 text-red-600 animate-pulse">
                                   <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
                                   <span className="text-[11px] uppercase tracking-wider font-extrabold">Recording</span>
                              </div>
                              <span className="text-slate-500 font-mono pl-1 border-l border-slate-200">
                                   {formatDuration(recordingTime)}
                              </span>
                              <div className="flex-grow" />
                              <div className="flex items-center gap-1">
                                   <button
                                        type="button"
                                        onClick={cancelRecording}
                                        className="p-1.5 rounded-full text-slate-400 hover:text-red-600 hover:bg-slate-200 transition-all border-none bg-transparent cursor-pointer flex items-center justify-center"
                                        title="Discard Recording"
                                   >
                                        <FiTrash2 className="w-4 h-4" />
                                   </button>
                                   <button
                                        type="button"
                                        onClick={stopAndSendRecording}
                                        className="p-1.5 rounded-full text-blue-600 hover:text-blue-800 hover:bg-slate-200 transition-all border-none bg-transparent cursor-pointer flex items-center justify-center"
                                        title="Send Voice Message"
                                   >
                                        <FiSend className="w-4 h-4" />
                                   </button>
                              </div>
                         </div>
                    ) : (
                         <>
                              <button
                                   type="button"
                                   onClick={startRecording}
                                   disabled={isUploading || isSending}
                                   className="w-10 h-10 rounded-[10px] bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center shrink-0 transition-all cursor-pointer disabled:opacity-50"
                                   title="Record voice message"
                              >
                                   <FiMic className="w-5 h-5 text-slate-500" />
                              </button>

                              {/* Camera / attach button */}
                              <button
                                   type="button"
                                   onClick={handleAttachmentClick}
                                   disabled={isUploading || pendingImages.length >= MAX_IMAGES}
                                   className="w-10 h-10 rounded-[10px] bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center shrink-0 transition-all cursor-pointer disabled:opacity-50 relative"
                                   title={`Send images (max ${MAX_IMAGES}, ${MAX_FILE_SIZE_MB}MB each)`}
                              >
                                   {isUploading ? (
                                        <FiLoader className="w-4 h-4 animate-spin text-slate-400" />
                                   ) : (
                                        <FiCamera className="w-5 h-5" />
                                   )}
                                   {pendingImages.length > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
                                             {pendingImages.length}
                                        </span>
                                   )}
                              </button>

                              {/* Hidden multi-file input */}
                              <input
                                   type="file"
                                   ref={multiFileInputRef}
                                   onChange={handleMultiFileChange}
                                   accept="image/*"
                                   multiple
                                   className="hidden"
                              />

                              <div className="flex-grow relative flex items-center">
                                   <input
                                        type="text"
                                        value={inputValue}
                                        onChange={e => setInputValue(e.target.value)}
                                        disabled={isSending || isUploading}
                                        placeholder="Ask a question..."
                                        className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-[10px] text-xs font-semibold focus:bg-white focus:border-primary outline-none transition-all"
                                   />
                                   <button
                                        type="button"
                                        onClick={() => setShowEmojiPicker(prev => !prev)}
                                        className="absolute right-3 text-slate-400 hover:text-slate-700 transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center"
                                        title="Insert emoji"
                                   >
                                        <FiSmile className="w-5 h-5" />
                                   </button>

                                   {showEmojiPicker && (
                                        <>
                                             <div className="fixed inset-0 z-45 bg-transparent cursor-default" onClick={() => setShowEmojiPicker(false)} />
                                             <div className="absolute bottom-full right-0 mb-3 z-50 bg-[#262626] text-white rounded-[12px] p-3 shadow-lg border border-slate-800 w-64 select-none">
                                                  <div className="grid grid-cols-7 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                                                       {[
                                                            '👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👏', '🎉', '✨',
                                                            '😊', '😍', '🤣', '😭', '🥺', '😎', '🤔', '🙄', '😡', '😴',
                                                            '🙌', '🤝', '✌️', '👌', '✍️', '👋', '👀', '💯', '✔️', '❌',
                                                            '💡', '💬', '📢', '🔔', '📌', '⭐', '💔', '💖', '💘',
                                                            '🍔', '🍕', '🍰', '☕', '🥤', '🍺', '🚗', '✈️', '🏠', '🎁'
                                                       ].map(emoji => (
                                                            <button
                                                                 key={emoji}
                                                                 type="button"
                                                                 onClick={() => {
                                                                      setInputValue(prev => prev + emoji);
                                                                      setShowEmojiPicker(false);
                                                                      const input = document.querySelector('input[placeholder="Ask a question..."]') as HTMLInputElement;
                                                                      if (input) input.focus();
                                                                 }}
                                                                 className="text-lg hover:scale-125 hover:-translate-y-0.5 active:scale-95 transition-all border-none bg-transparent cursor-pointer flex items-center justify-center p-1 rounded hover:bg-white/10"
                                                            >
                                                                 {emoji}
                                                            </button>
                                                       ))}
                                                  </div>
                                             </div>
                                        </>
                                   )}
                              </div>

                              <button
                                   type="submit"
                                   disabled={(!inputValue.trim() && pendingImages.length === 0) || isSending || isUploading}
                                   className="w-10 h-10 rounded-[10px] bg-primary hover:bg-primary-hover text-white flex items-center justify-center shrink-0 transition-all cursor-pointer disabled:opacity-40 shadow-sm"
                              >
                                   {isSending || isUploading ? (
                                        <FiLoader className="w-4 h-4 animate-spin" />
                                   ) : (
                                        <FiSend className="w-4.5 h-4.5 text-white" />
                                   )}
                              </button>
                         </>
                    )}
               </form>

               {/* Image Preview Modal */}
               {showPreview && previewImages.length > 0 && (
                    <div
                         className="fixed inset-0 z-[9999] bg-black/10 backdrop-blur-sm flex flex-col items-center justify-center p-4 select-none animate-fade-in"
                         onClick={() => setShowPreview(false)}
                    >
                         {/* Close Button */}
                         <button
                              onClick={() => setShowPreview(false)}
                              className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all border-none cursor-pointer z-[10000] flex items-center justify-center shadow-lg"
                              title="Close (Esc)"
                         >
                              <FiX className="w-6 h-6" />
                         </button>

                         {/* Left Arrow */}
                         {previewImages.length > 1 && (
                              <button
                                   onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewIndex(prev => (prev - 1 + previewImages.length) % previewImages.length);
                                   }}
                                   className="absolute left-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-3.5 rounded-full transition-all border-none cursor-pointer z-[10000] flex items-center justify-center shadow-lg hover:scale-105 active:scale-95"
                                   title="Previous"
                              >
                                   <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                   </svg>
                              </button>
                         )}

                         {/* Centered Image Container */}
                         <div
                              className="relative max-w-[90vw] max-h-[75vh] flex flex-col items-center justify-center"
                              onClick={(e) => e.stopPropagation()}
                         >
                              <img
                                   src={previewImages[previewIndex]}
                                   alt="Preview"
                                   className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl transition-all duration-300"
                              />
                         </div>

                         {/* Right Arrow */}
                         {previewImages.length > 1 && (
                              <button
                                   onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewIndex(prev => (prev + 1) % previewImages.length);
                                   }}
                                   className="absolute right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-3.5 rounded-full transition-all border-none cursor-pointer z-[10000] flex items-center justify-center shadow-lg hover:scale-105 active:scale-95"
                                   title="Next"
                              >
                                   <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                   </svg>
                              </button>
                         )}

                         {/* Thumbnails at the bottom */}
                         {previewImages.length > 1 && (
                              <div className="absolute bottom-6 flex gap-2 overflow-x-auto max-w-[80vw] p-2 bg-white/5 backdrop-blur-xs rounded-xl no-scrollbar border border-white/10 shadow-2xl">
                                   {previewImages.map((url, idx) => (
                                        <button
                                             key={idx}
                                             onClick={(e) => {
                                                  e.stopPropagation();
                                                  setPreviewIndex(idx);
                                             }}
                                             className={`w-12 h-12 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${previewIndex === idx ? 'border-primary scale-110 shadow-md' : 'border-transparent opacity-50 hover:opacity-100'
                                                  }`}
                                        >
                                             <img src={url} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                                        </button>
                                   ))}
                              </div>
                         )}
                    </div>
               )}

          </div>
     );
};

