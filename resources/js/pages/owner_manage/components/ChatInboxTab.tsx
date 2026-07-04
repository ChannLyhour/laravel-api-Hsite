import React, { useState, useEffect, useRef, useCallback } from 'react';
import { chatService } from '@/api/owner/chat';
import type { Conversation, Message } from '@/api/owner/chat';
import { getEcho } from '@/api/echo';
import { ordersService } from '@/api/owner/orders';
import type { Order } from '@/api/owner/orders';
import {
  FiSearch,
  FiSend,
  FiCamera,
  FiLoader,
  FiShoppingBag,
  FiDollarSign,
  FiMessageSquare,
  FiInfo,
  FiSmile,
  FiCornerUpLeft,
  FiMoreVertical,
  FiPlus,
  FiX,
  FiMic,
  FiTrash2,
} from 'react-icons/fi';
import { toast } from '@/pages/owner_manage/utils/toast';
import { resolveImageUrl } from '@/api/imageUtils';
import { authService, type User } from '@/api/auth';

const FiPin = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="1.2em"
    height="1.2em"
    stroke="currentColor"
    strokeWidth="2.5"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="12" y1="17" x2="12" y2="22" />
    <path d="M5 17h14v-1.76a2 2 0 0 0-.44-1.24l-2.78-3.5A2 2 0 0 1 15 9.26V5a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4.26a2 2 0 0 1-.78 1.24l-2.78 3.5a2 2 0 0 0-.44 1.24z" />
  </svg>
);

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

const isAppOrigin = (url: URL): boolean => {
  // Recognize link if the path matches /profile (works for any future domain or server environment)
  if (url.pathname === '/profile') return true;

  if (url.origin === window.location.origin) return true;

  try {
    const viteUrl = import.meta.env?.VITE_URL;
    if (viteUrl) {
      const parsedViteUrl = new URL(viteUrl);
      if (url.origin === parsedViteUrl.origin) return true;
    }
  } catch (_) {}

  try {
    const apiBaseUrl = import.meta.env?.VITE_API_BASE_URL;
    if (apiBaseUrl) {
      const apiHost = new URL(apiBaseUrl).hostname;
      if (apiHost && url.hostname === apiHost) return true;
    }
  } catch (_) {}

  return false;
};

interface ChatInboxTabProps {
  ownerId?: number | string;
  storeId?: number;
}

export const ChatInboxTab: React.FC<ChatInboxTabProps> = ({ ownerId, storeId }) => {
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
          if (isAppOrigin(url) && url.pathname === '/profile' && url.searchParams.get('tab') === 'orders') {
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
                if (isAppOrigin(url)) {
                  const orderIdParam = url.searchParams.get('order_id');
                  const tabParam = url.searchParams.get('tab');
                  if (tabParam === 'orders' && orderIdParam) {
                    e.preventDefault();
                    localStorage.setItem('pendingViewOrderId', orderIdParam);
                    localStorage.setItem('admin_active_tab', 'orders');
                    window.open('/owner', '_blank');
                    return;
                  }
                }
              } catch (err) {
                console.warn('Failed to parse chat link:', err);
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

  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
    window.dispatchEvent(
      new CustomEvent('chat_unread_count_updated', { detail: totalUnread })
    );
  }, [conversations]);

  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchText, setSearchText] = useState('');
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'unsent'>('all');
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [activeMenuMessageId, setActiveMenuMessageId] = useState<number | null>(null);
  const [pinnedMessagesByConvo, setPinnedMessagesByConvo] = useState<Record<number, Set<number>>>({});

  const activeConvoId = activeConvo?.id;
  const activeConvoIdRef = useRef(activeConvoId);

  useEffect(() => {
    activeConvoIdRef.current = activeConvoId;
  }, [activeConvoId]);

  // Customer contextual info
  const [showContextPanel, setShowContextPanel] = useState(true);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const currentUserId = currentUser?.id || (!isNaN(Number(ownerId)) ? Number(ownerId) : null);
  const isFirstLoad = useRef(true);
  const lastMessageIdRef = useRef<number | null>(null);
  // Multi-image queue: each entry = { file, preview (object URL) }
  const [pendingImages, setPendingImages] = useState<{ file: File; preview: string }[]>([]);
  const [pinnedScrollIdx, setPinnedScrollIdx] = useState(0);
  const [pinnedIconAnimating, setPinnedIconAnimating] = useState(false);
  const [flashingMsgId, setFlashingMsgId] = useState<number | null>(null);
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);
  const [activeReactMessageId, setActiveReactMessageId] = useState<number | null>(null);

  // States for full-screen image preview modal
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number>(0);
  const [showPreview, setShowPreview] = useState<boolean>(false);

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
            activeConvo!.id,
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
          setConversations(prev =>
            prev.map(c =>
              c.id === activeConvo!.id
                ? { ...c, last_message: audioMsg, updated_at: new Date().toISOString() }
                : c
            )
          );
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

  // Track which conversation channels we've subscribed to
  const subscribedChannels = useRef<Set<number>>(new Set());

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

  const handleScroll = () => {
    const container = messageContainerRef.current;
    if (container && container.scrollTop === 0 && hasMoreMessages && !loadingMore) {
      loadMoreMessages();
    }
  };

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

    if (!activeConvoId) {
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

        const olderMsgs = await chatService.getMessages(activeConvoId, limit, firstMsgId);
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
          const userReaction = currentReactions.find(r => currentUserId !== null && Number(r.user_id) === currentUserId);

          let nextReactions = [...currentReactions];
          if (userReaction) {
            if (userReaction.emoji === emoji) {
              nextReactions = nextReactions.filter(r => Number(r.user_id) !== Number(ownerId));
            } else {
              nextReactions = nextReactions.map(r =>
                Number(r.user_id) === Number(ownerId) ? { ...r, emoji } : r
              );
            }
          } else {
            nextReactions.push({
              id: -Date.now(),
              message_id: messageId,
              user_id: currentUserId || 0,
              emoji,
              user: {
                id: currentUserId || 0,
                name: currentUser?.name || 'You',
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

  const groupReactions = (reactions?: any[]) => {
    if (!reactions || reactions.length === 0) return [];
    const map: Record<string, { emoji: string; count: number; userReacted: boolean; names: string[] }> = {};
    reactions.forEach(r => {
      const isMe = currentUserId !== null && Number(r.user_id) === currentUserId;
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

  // ── Handle incoming real-time message for any conversation ──────────────
  const handleIncomingMessage = useCallback(
    (conversationId: number, incomingMsg: Message) => {
      // If this message belongs to the currently open conversation → append it
      setMessages(prev => {
        // Only add if we're looking at this conversation and it's not already there
        if (prev.length > 0 && Number(prev[0]?.conversation_id) !== Number(conversationId)) return prev;
        if (prev.some(m => Number(m.id) === Number(incomingMsg.id))) return prev;
        setTimeout(scrollToBottom, 50);
        return [...prev, incomingMsg];
      });

      // Always update the conversation preview in the left sidebar
      setConversations(prev =>
        prev.map(c =>
          Number(c.id) === Number(conversationId)
            ? {
              ...c,
              last_message: incomingMsg,
              updated_at: incomingMsg.created_at,
              // Only bump unread count if this convo is NOT active (using ref to avoid stale closures)
              unread_count: Number(c.id) === Number(activeConvoIdRef.current) ? 0 : (c.unread_count || 0) + 1,
            }
            : c
        )
      );
    },
    []
  );

  // ── Handle incoming real-time message deletion ──────────────────────────
  const handleIncomingMessageDeletion = useCallback(
    (conversationId: number, deletedMsgId: number) => {
      setMessages(prev => {
        if (prev.length > 0 && Number(prev[0]?.conversation_id) !== Number(conversationId)) return prev;
        return prev.filter(m => Number(m.id) !== Number(deletedMsgId));
      });
    },
    []
  );

  // ── Subscribe to a single conversation channel ──────────────────────────
  const subscribeToConversation = useCallback(
    (convo: Conversation) => {
      if (subscribedChannels.current.has(convo.id)) return;

      try {
        const echo = getEcho(convo.pusher_key, convo.pusher_cluster);
        echo
          .private(`chat.${convo.id}`)
          .listen('.MessageSent', (data: { message: Message }) => {
            handleIncomingMessage(convo.id, data.message);
          })
          .listen('.MessageReactionUpdated', (data: { message_id: number; reactions: any[] }) => {
            handleIncomingReaction(data.message_id, data.reactions);
          })
          .listen('.MessageDeleted', (data: { message_id: number }) => {
            console.log('[Echo] Message deleted event received in owner panel:', data);
            handleIncomingMessageDeletion(convo.id, data.message_id);
          });
        subscribedChannels.current.add(convo.id);
      } catch (err) {
        console.warn(`[Echo] Failed to subscribe to chat.${convo.id}:`, err);
      }
    },
    [handleIncomingMessage, handleIncomingReaction, handleIncomingMessageDeletion]
  );

  // ── Unsubscribe from all channels ───────────────────────────────────────
  const unsubscribeAll = useCallback(() => {
    subscribedChannels.current.forEach(id => {
      try {
        getEcho().leave(`chat.${id}`);
      } catch (_) { }
    });
    subscribedChannels.current.clear();
  }, []);

  // ── 1. Initial load of conversations + subscribe to ALL their channels ──
  useEffect(() => {
    let mounted = true;

    const loadConversations = async () => {
      try {
        setIsLoading(true);
        const convos = await chatService.getMyConversations();
        if (!mounted) return;

        setConversations(convos);

        // Check for pending selected conversation from redirect
        const pendingConvoId = (window as any).pendingViewConvoId;
        if (pendingConvoId) {
          const match = convos.find(c => c.id === pendingConvoId);
          if (match) {
            setActiveConvo(match);
          }
          (window as any).pendingViewConvoId = null;
        }

        // Subscribe to ALL conversation channels for real-time updates
        convos.forEach(subscribeToConversation);
      } catch (err) {
        console.error('Failed to load conversations:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadConversations();

    return () => {
      mounted = false;
      unsubscribeAll();
    };
  }, []); // runs once on mount

  // ── Load older messages when scrolling to top (infinite scroll pagination) ─
  const loadMoreMessages = useCallback(async () => {
    if (!activeConvoId || loadingMore || !hasMoreMessages || messages.length === 0) return;

    const firstMsgId = messages[0].id;
    const limit = 5;

    try {
      setLoadingMore(true);

      const container = messageContainerRef.current;
      const prevScrollHeight = container ? container.scrollHeight : 0;
      const prevScrollTop = container ? container.scrollTop : 0;

      const olderMsgs = await chatService.getMessages(activeConvoId, limit, firstMsgId);

      if (olderMsgs.length > 0) {
        setMessages(prev => [...olderMsgs, ...prev]);
        setHasMoreMessages(olderMsgs.length === limit);

        // Seed newly loaded pinned messages
        const newPinned = olderMsgs.filter(m => m.is_pinned).map(m => m.id);
        if (newPinned.length > 0) {
          setPinnedMessagesByConvo(prev => {
            const currentSet = new Set(prev[activeConvoId] || []);
            newPinned.forEach(id => currentSet.add(id));
            return { ...prev, [activeConvoId]: currentSet };
          });
        }

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
  }, [activeConvoId, loadingMore, hasMoreMessages, messages]);

  // ── 2. Load messages when active conversation changes ───────────────────
  useEffect(() => {
    if (!activeConvo) {
      setMessages([]);
      return;
    }

    const currentConvoId = activeConvo.id;
    const currentOtherUser = activeConvo.other_user;

    // Make sure we're subscribed (handles race conditions)
    subscribeToConversation(activeConvo);

    // Clear unread badge for the newly opened conversation
    setConversations(prev =>
      prev.map(c => (c.id === currentConvoId ? { ...c, unread_count: 0 } : c))
    );

    const loadMsgs = async () => {
      try {
        setLoadingMessages(true);
        const limit = 5;
        const msgs = await chatService.getMessages(currentConvoId, limit);
        setMessages(msgs);
        setHasMoreMessages(msgs.length === limit);

        // Seed pinned state from DB is_pinned field
        const pinned = new Set(msgs.filter(m => m.is_pinned).map(m => m.id));
        setPinnedMessagesByConvo(prev => ({ ...prev, [currentConvoId]: pinned }));
        setTimeout(scrollToBottom, 50);
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMsgs();

    // Load customer order context
    const loadCustomerContext = async () => {
      try {
        setLoadingOrders(true);
        const allOrders = await ordersService.getMyStoreOrders(
          undefined, 0, 500, undefined, storeId, undefined, ownerId
        );
        const matchingOrders = allOrders.filter(o => {
          // 1. Direct match by User ID
          if (o.userId && currentOtherUser.id && String(o.userId) === String(currentOtherUser.id)) {
            return true;
          }

          // 2. Match by name
          const isNameMatch =
            o.customer &&
            currentOtherUser.name &&
            o.customer.toLowerCase().includes(currentOtherUser.name.toLowerCase());
          if (isNameMatch) return true;

          // 3. Reverse name match
          const isReverseNameMatch =
            o.customer &&
            currentOtherUser.name &&
            currentOtherUser.name.toLowerCase().includes(o.customer.toLowerCase());
          if (isReverseNameMatch) return true;

          return false;
        });
        setCustomerOrders(matchingOrders);
      } catch (err) {
        console.warn('Failed to load customer orders context:', err);
        setCustomerOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    };

    loadCustomerContext();
  }, [activeConvoId, storeId, ownerId]);

  // Load current owner user profile
  useEffect(() => {
    authService.getCurrentUser()
      .then(data => {
        if (data?.user) setCurrentUser(data.user);
      })
      .catch(err => console.warn('Failed to load current admin user', err));
  }, []);

  // ── Keep owner marked online with a 60s heartbeat ──────────────────────
  useEffect(() => {
    // Fire immediately on mount, then every 60 seconds
    authService.heartbeat().catch(() => { });
    const id = setInterval(() => {
      authService.heartbeat().catch(() => { });
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  // ── Mark owner offline on tab close / navigate away ─────────────────────
  useEffect(() => {
    const handleOffline = () => {
      authService.markOffline();
    };
    window.addEventListener('pagehide', handleOffline);
    window.addEventListener('beforeunload', handleOffline);
    return () => {
      window.removeEventListener('pagehide', handleOffline);
      window.removeEventListener('beforeunload', handleOffline);
      authService.markOffline();
    };
  }, []);

  // ── Periodic DB poll for online presence (every 30s, replaces Pusher status broadcast) ──
  useEffect(() => {
    const poll = async () => {
      try {
        const convos = await chatService.getMyConversations();
        if (!convos.length) return;

        const userIds = [...new Set(convos.map(c => c.other_user?.id).filter(Boolean))] as number[];
        if (!userIds.length) return;

        const statuses = await chatService.getUserStatus(userIds);
        const statusMap = Object.fromEntries(statuses.map(s => [s.user_id, s]));

        setConversations(prev =>
          prev.map(c => {
            const s = statusMap[c.other_user?.id];
            if (!s) return c;
            return { ...c, other_user: { ...c.other_user, is_online: s.is_online, last_seen_at: s.last_seen_at } };
          })
        );
        setActiveConvo(prev => {
          if (!prev) return prev;
          const s = statusMap[prev.other_user?.id];
          if (!s) return prev;
          return { ...prev, other_user: { ...prev.other_user, is_online: s.is_online, last_seen_at: s.last_seen_at } };
        });
      } catch (_) { }
    };

    // Fire once immediately, then every 30 seconds
    poll();
    const id = setInterval(poll, 30_000);
    return () => clearInterval(id);
  }, []);

  // Reset first load when conversation changes
  useEffect(() => {
    isFirstLoad.current = true;
  }, [activeConvoId]);

  // Load draft when conversation changes
  useEffect(() => {
    if (activeConvoId) {
      setInputText(drafts[activeConvoId] || '');
    } else {
      setInputText('');
    }
  }, [activeConvoId]);

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

  // ── 3. Send message ─────────────────────────────────────────────────────
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const hasText = inputText.trim().length > 0;
    const hasImages = pendingImages.length > 0;
    if (!activeConvo || (!hasText && !hasImages) || isSending || isUploading) return;

    const text = inputText.trim();
    setInputText('');
    if (activeConvo?.id) {
      setDrafts(prev => ({ ...prev, [activeConvo.id]: '' }));
    }
    setIsSending(true);

    try {
      // 1. Send text message first (if any)
      if (hasText) {
        const newMsg = await chatService.sendMessage(
          activeConvo.id,
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
        setConversations(prev =>
          prev.map(c =>
            c.id === activeConvo.id
              ? { ...c, last_message: newMsg, updated_at: new Date().toISOString() }
              : c
          )
        );
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
              activeConvo.id,
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
            setConversations(prev =>
              prev.map(c =>
                c.id === activeConvo.id
                  ? { ...c, last_message: imageMsg, updated_at: new Date().toISOString() }
                  : c
              )
            );
          } catch (imgErr: any) {
            toast.error(imgErr?.message || `Failed to upload ${file.name}`);
          } finally {
            setIsUploading(false);
          }
        }
      }
    } catch (err: any) {
      toast.error('Failed to send message');
      setInputText(text);
    } finally {
      setIsSending(false);
    }
  };

  // ── 4. Multi-image queue handlers ───────────────────────────────────────
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

    if (multiFileInputRef.current) multiFileInputRef.current.value = '';
  };

  const handleRemovePendingImage = (index: number) => {
    setPendingImages(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
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

  // ── 5. Utilities ────────────────────────────────────────────────────────
  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
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

  const handleRemoveMessage = async (msgId: number) => {
    // Optimistic remove from UI immediately
    const prev = messages;
    setMessages(p => p.filter(m => m.id !== msgId));
    setActiveMenuMessageId(null);
    try {
      await chatService.deleteMessage(msgId);
      toast.success('Message removed');
    } catch (err) {
      // Rollback on failure
      setMessages(prev);
      toast.error('Failed to remove message');
    }
  };

  const handleCloseConversation = async () => {
    if (!activeConvo) return;
    if (!window.confirm('Are you sure you want to close and delete this conversation? This will permanently erase the chat history.')) {
      return;
    }
    const targetConvoId = activeConvo.id;
    try {
      await chatService.deleteConversation(targetConvoId);
      toast.success('Conversation closed successfully');
      setConversations(prev => prev.filter(c => c.id !== targetConvoId));
      setActiveConvo(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to close conversation');
    }
  };

  const handlePinMessage = async (msgId: number) => {
    if (!activeConvoId) return;
    const isCurrentlyPinned = !!(pinnedMessagesByConvo[activeConvoId]?.has(msgId));
    // Optimistic update
    setPinnedMessagesByConvo(prev => {
      const currentPins = new Set(prev[activeConvoId] || []);
      if (isCurrentlyPinned) {
        currentPins.delete(msgId);
      } else {
        currentPins.add(msgId);
      }
      return { ...prev, [activeConvoId]: currentPins };
    });
    setActiveMenuMessageId(null);
    try {
      const res = await chatService.togglePinMessage(msgId);
      toast.success(res.is_pinned ? 'Message pinned' : 'Message unpinned');
      // Sync with server response (source of truth)
      setPinnedMessagesByConvo(prev => {
        const currentPins = new Set(prev[activeConvoId] || []);
        if (res.is_pinned) {
          currentPins.add(msgId);
        } else {
          currentPins.delete(msgId);
        }
        return { ...prev, [activeConvoId]: currentPins };
      });
    } catch (err) {
      // Rollback on failure
      setPinnedMessagesByConvo(prev => {
        const currentPins = new Set(prev[activeConvoId] || []);
        if (isCurrentlyPinned) {
          currentPins.add(msgId);
        } else {
          currentPins.delete(msgId);
        }
        return { ...prev, [activeConvoId]: currentPins };
      });
      toast.error('Failed to update pin status');
    }
  };

  const calculateCustomerStats = () => {
    const count = customerOrders.length;
    const spent = customerOrders
      .filter(o => o.status === 'complete')
      .reduce((acc, o) => acc + parseFloat(o.total || '0'), 0);
    return { count, spent: spent.toFixed(2) };
  };

  const stats = calculateCustomerStats();

  const filteredConvos = conversations.filter(c => {
    // 1. Search text filter
    const term = searchText.toLowerCase();
    const name = (c.other_user?.name || '').toLowerCase();
    const firstName = (c.other_user?.first_name || '').toLowerCase();
    const lastName = (c.other_user?.last_name || '').toLowerCase();
    const matchesSearch = name.includes(term) || firstName.includes(term) || lastName.includes(term);
    if (!matchesSearch) return false;

    // 2. Tab filter
    if (activeFilter === 'unread') {
      return (c.unread_count ?? 0) > 0;
    }
    if (activeFilter === 'unsent') {
      const hasDraft = !!drafts[c.id]?.trim();
      const isUnreplied = c.last_message && currentUserId !== null && Number(c.last_message.sender_id) !== currentUserId;
      return hasDraft || isUnreplied;
    }
    return true; // 'all'
  });

  return (
    <div className="h-[calc(100vh-140px)] flex overflow-hidden shadow-sm animate-fade-in font-sans border rounded-[5px] custom-card-container">

      {/* ── Left Pane: Conversations List ───────────────────────── */}
      <div className="w-80 border-r flex flex-col shrink-0 h-full bg-black/[0.015]">
        <div className="p-4 border-b bg-transparent">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
             <input
              type="text"
              placeholder="Search chats..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-black/[0.03] border border-black/10 rounded-[5px] text-xs font-semibold outline-none transition-all"
            />
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex gap-2 px-4 py-2 border-b bg-transparent overflow-x-auto select-none shrink-0 no-scrollbar">
          {(['all', 'unread', 'unsent'] as const).map(filter => {
            const isActive = activeFilter === filter;

            // Calculate count for badge
            let count = 0;
            if (filter === 'all') {
              count = conversations.length;
            } else if (filter === 'unread') {
              count = conversations.filter(c => (c.unread_count ?? 0) > 0).length;
            } else if (filter === 'unsent') {
              count = conversations.filter(c => {
                const hasDraft = !!drafts[c.id]?.trim();
                const isUnreplied = c.last_message && currentUserId !== null && Number(c.last_message.sender_id) !== currentUserId;
                return hasDraft || isUnreplied;
              }).length;
            }

            const labelMap = {
              all: 'All',
              unread: 'Unread',
              unsent: 'Unsent'
            };

            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border-none cursor-pointer whitespace-nowrap ${isActive
                  ? 'bg-primary text-white shadow-3xs'
                  : 'bg-black/[0.04] text-inherit opacity-60 hover:opacity-100'
                  }`}
              >
                {labelMap[filter]} ({count})
              </button>
            );
          })}
        </div>

        {/* Conversation List Scroll Area */}
        <div className="flex-grow overflow-y-auto divide-y divide-slate-100/50 custom-scrollbar">
          {isLoading ? (
            <div className="h-40 flex flex-col items-center justify-center gap-2 text-slate-400">
              <FiLoader className="w-6 h-6 animate-spin text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Loading inbox...</span>
            </div>
          ) : filteredConvos.length === 0 ? (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center">
              <FiMessageSquare className="w-8 h-8 stroke-1 mb-2 text-slate-300" />
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">No active chats</p>
              <p className="text-[10px] font-semibold text-slate-400 mt-1 max-w-[200px] leading-relaxed">
                When customers reach out to your store, they will appear here.
              </p>
            </div>
          ) : (
            filteredConvos.map(convo => {
              const isSelected = activeConvo?.id === convo.id;
              const other = convo.other_user;
              const displayName = other.first_name || other.last_name
                ? `${other.first_name || ''} ${other.last_name || ''}`.trim()
                : other.name;

              return (
                <button
                  key={convo.id}
                  onClick={() => setActiveConvo(convo)}
                  className={`w-full text-left p-4 flex gap-3 border-none bg-transparent hover:bg-black/[0.04] transition-colors cursor-pointer select-none relative ${isSelected ? 'bg-primary/5 hover:bg-primary/5' : ''
                    }`}
                >
                  {/* Active bar */}
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r" />
                  )}

                  {/* Avatar with status */}
                  <div className="relative shrink-0">
                    {other.image ? (
                      <img
                        src={resolveImageUrl(other.image)}
                        alt={displayName}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${other.is_online ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className="text-xs font-bold text-slate-800 truncate pr-2">
                        {displayName}
                      </h4>
                      <span className="text-[9px] font-bold text-slate-400 uppercase shrink-0">
                        {formatTime(convo.updated_at)}
                      </span>
                    </div>

                    <p className="text-[11px] font-semibold text-slate-400 truncate leading-snug">
                      {convo.last_message
                        ? convo.last_message.message_type === 'image'
                          ? '📷 Sent a photo'
                          : convo.last_message.message_type === 'audio'
                            ? '🎵 Sent a voice message'
                            : convo.last_message.body
                        : 'Started a chat'}
                    </p>
                  </div>

                  {/* Unread count badge */}
                  {(convo.unread_count ?? 0) > 0 && (
                    <div className="shrink-0 flex items-center justify-center self-center w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold shadow-sm shadow-orange-500/10">
                      {convo.unread_count}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Middle Pane: Chat Workspace ────────────────────────── */}
      <div className="flex-grow flex flex-col h-full bg-transparent border-l border-r relative">
        {activeConvo ? (
          <>
            {/* Header */}
            <div className="px-5 py-4 border-b flex items-center justify-between shrink-0 custom-card-header-bar">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {activeConvo.other_user.image ? (
                    <img
                      src={resolveImageUrl(activeConvo.other_user.image)}
                      alt={activeConvo.other_user.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-100"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black">
                      {activeConvo.other_user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${activeConvo.other_user.is_online ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                  />
                </div>

                <div className="text-left">
                  <h4 className="text-xs font-black text-slate-800 leading-tight">
                    {activeConvo.other_user.first_name || activeConvo.other_user.last_name
                      ? `${activeConvo.other_user.first_name || ''} ${activeConvo.other_user.last_name || ''}`.trim()
                      : activeConvo.other_user.name}
                  </h4>
                  <span className={`text-[10px] font-bold tracking-wider ${activeConvo.other_user.is_online ? 'text-emerald-500' : 'text-slate-400'
                    }`}>
                    {activeConvo.other_user.is_online
                      ? 'ONLINE'
                      : activeConvo.other_user.last_seen_at
                        ? `LAST ACTIVE ${new Date(activeConvo.other_user.last_seen_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : 'OFFLINE'}
                  </span>
                </div>
              </div>

              {/* Action items */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCloseConversation}
                  className="p-2 rounded-[5px] hover:bg-red-50 text-red-650 hover:text-red-750 transition-colors border-none cursor-pointer flex items-center gap-1 text-[11px] font-bold bg-transparent"
                  title="Close and delete conversation"
                >
                  <FiTrash2 className="w-4.5 h-4.5 text-red-550" />
                  <span>Close Chat</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowContextPanel(p => !p)}
                  className={`p-2 rounded-[5px] hover:bg-black/[0.04] text-inherit transition-colors border-none cursor-pointer flex items-center gap-1 text-[11px] font-bold ${showContextPanel ? 'bg-black/[0.06] text-primary' : 'bg-transparent'
                    }`}
                  title="Toggle customer info drawer"
                >
                  <FiInfo className="w-4.5 h-4.5" />
                  <span>Customer Info</span>
                </button>
              </div>
            </div>

            {/* Pinned Messages Banner */}
            {activeConvoId && pinnedMessagesByConvo[activeConvoId]?.size > 0 && (() => {
              const pinnedIds = Array.from(pinnedMessagesByConvo[activeConvoId]);
              const pinnedMsgs = pinnedIds
                .map(id => messages.find(m => m.id === id))
                .filter(Boolean) as Message[];
              if (pinnedMsgs.length === 0) return null;
              
              // Sort chronologically by message ID
              pinnedMsgs.sort((a, b) => a.id - b.id);
              
              const safeIdx = pinnedScrollIdx % pinnedMsgs.length;
              const targetMsg = pinnedMsgs[safeIdx];
              
              // Resolve raw BASE_URL strings and format links cleanly in the preview text
              const getCleanPreviewText = (text: string) => {
                if (!text) return '';
                let resolvedText = text.replace(/\{\{BASE_URL\}\}|\[BASE_URL\]/g, window.location.origin);
                const urlRegex = /(https?:\/\/[^\s]+)/g;
                resolvedText = resolvedText.replace(urlRegex, (urlStr) => {
                  try {
                    const url = new URL(urlStr);
                    if (url.pathname === '/profile' && url.searchParams.get('tab') === 'orders') {
                      return 'Detail';
                    }
                  } catch (_) {}
                  return 'Link';
                });
                return resolvedText;
              };

              const preview = targetMsg.message_type === 'image' 
                ? '📷 Photo' 
                : targetMsg.message_type === 'audio' 
                  ? '🎵 Voice message' 
                  : getCleanPreviewText(targetMsg.body || '');
              return (
                <button
                  type="button"
                  onClick={() => {
                    if (messageContainerRef.current) {
                      const el = messageContainerRef.current.querySelector(`[data-msg-id="${targetMsg.id}"]`);
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // Pin icon bounce animation
                        setPinnedIconAnimating(true);
                        setTimeout(() => setPinnedIconAnimating(false), 600);
                        // Message flash highlight
                        setTimeout(() => {
                          setFlashingMsgId(targetMsg.id);
                          setTimeout(() => setFlashingMsgId(null), 1100);
                        }, 300);
                        // Cycle to next pinned message
                        setPinnedScrollIdx(prev => (prev + 1) % pinnedMsgs.length);
                      }
                    }
                  }}
                  className="w-full px-4 py-2 bg-black/[0.02] border-b flex items-center gap-3 hover:bg-black/[0.04] transition-colors cursor-pointer border-l-2 border-l-primary shrink-0 select-none border-none text-left"
                >
                  <div className="shrink-0">
                    <FiPin className={`w-3.5 h-3.5 text-primary transition-transform ${pinnedIconAnimating ? 'animate-pin-bounce' : ''}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-0.5">Pinned Message {pinnedMsgs.length > 1 ? `(${safeIdx + 1}/${pinnedMsgs.length})` : ''}</p>
                    <p className="text-[11px] font-semibold opacity-85 truncate">{preview}</p>
                  </div>
                  <span className="text-[9px] font-bold opacity-60 uppercase tracking-wider shrink-0">View ›</span>
                </button>
              );
            })()}

            {/* Message Pane */}
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
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-black/[0.04] border rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {hasMoreMessages ? (
                          <>
                            <FiLoader className="w-3.5 h-3.5 mr-0.5" />
                            <span className="animate-pulse">Loading more messages...</span>
                          </>
                        ) : (
                          <>
                            <FiMessageSquare className="w-3.5 h-3.5 mr-0.5" />
                            <span>History starts here</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {(() => {
                    const slicedMessages = messages.slice(-100);
                    const grouped = groupMessages(slicedMessages);
                    return grouped.map((entry, entryIdx) => {
                      const currentMsg = entry.kind === 'single' ? entry.msg : entry.msgs[0];
                      const prevEntry = entryIdx > 0 ? grouped[entryIdx - 1] : undefined;
                      const prevMsg = prevEntry ? (prevEntry.kind === 'single' ? prevEntry.msg : prevEntry.msgs[0]) : undefined;

                      const separator = renderMessageDateSeparator(currentMsg, prevMsg);

                      if (entry.kind === 'group') {
                        const isMe = currentUserId !== null && entry.senderId === currentUserId;
                        const first = entry.msgs[0];
                        return (
                          <React.Fragment key={`group-${first.id}-${entryIdx}`}>
                            {separator}
                            <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} ${entry.msgs.some(m => m.id === flashingMsgId) ? 'animate-msg-flash' : ''
                              }`}>
                              {isMe ? (
                                <div className="flex gap-3 items-start max-w-[85%] justify-end group relative">
                                  {/* Action Bar (revealed on hover) */}
                                  <div className={`absolute right-full top-1/2 -translate-y-1/2 pr-3 z-30 transition-opacity duration-150 ${activeMenuMessageId === first.id || activeReactMessageId === first.id
                                    ? 'opacity-100 pointer-events-auto'
                                    : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'
                                    }`}>
                                    <div className="flex items-center gap-1 bg-black/[0.05] backdrop-blur-md border rounded-full px-1.5 py-1 shadow-3xs">
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
                                          const input = document.querySelector('input[placeholder="Type your reply here..."]') as HTMLInputElement;
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
                                            {/* Overlay to close menu */}
                                            <div className="fixed inset-0 z-40 bg-transparent cursor-default" onClick={() => setActiveMenuMessageId(null)} />
                                            {/* Dropdown Menu */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-50 bg-[#262626] text-white rounded-[8px] py-1.5 px-1 shadow-lg border border-slate-800 text-left min-w-[90px] flex flex-col select-none">
                                              <button
                                                type="button"
                                                onClick={() => handleRemoveMessage(first.id)}
                                                className="w-full text-left px-3 py-1.5 hover:bg-white/10 rounded-[6px] text-[11px] font-bold text-white border-none bg-transparent cursor-pointer transition-colors"
                                              >
                                                Remove
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handlePinMessage(first.id)}
                                                className="w-full text-left px-3 py-1.5 hover:bg-white/10 rounded-[6px] text-[11px] font-bold text-white border-none bg-transparent cursor-pointer transition-colors"
                                              >
                                                {activeConvoId && pinnedMessagesByConvo[activeConvoId]?.has(first.id) ? 'Unpin' : 'Pin'}
                                              </button>
                                              {/* Arrow tail */}
                                              <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-[#262626] rotate-45 -mt-1" />
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end">
                                    <div className="flex items-baseline mb-1.5 select-none">
                                      {activeConvoId && pinnedMessagesByConvo[activeConvoId]?.has(first.id) && (
                                        <FiPin className="w-2.5 h-2.5 text-slate-400 rotate-45 mr-1.5" />
                                      )}
                                      <span className="text-[9px] font-bold text-slate-400 mr-2">{formatMessageTime(first.created_at)}</span>
                                      <span className="text-xs font-black text-slate-800">
                                        {currentUser ? (
                                          currentUser.first_name || currentUser.last_name
                                            ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim()
                                            : currentUser.name
                                        ) : 'You'}
                                      </span>
                                    </div>
                                    <div className="rounded-[5px] overflow-hidden shadow-3xs">
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
                                    {currentUser?.image_url ? (
                                      <img
                                        src={resolveImageUrl(currentUser.image_url)}
                                        alt={currentUser.name}
                                        className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-3xs"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shadow-3xs">
                                        {currentUser ? currentUser.name.charAt(0).toUpperCase() : 'Y'}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex gap-3 items-start max-w-[85%] justify-start group relative">
                                  <div className="shrink-0 mb-0.5 select-none">
                                    {activeConvo.other_user.image ? (
                                      <img
                                        src={resolveImageUrl(activeConvo.other_user.image)}
                                        alt={activeConvo.other_user.name}
                                        className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-3xs"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shadow-3xs">
                                        {activeConvo.other_user.name.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-col items-start">
                                    <div className="flex items-baseline mb-1.5 select-none">
                                      <span className="text-xs font-black text-slate-800">
                                        {activeConvo.other_user.first_name || activeConvo.other_user.last_name
                                          ? `${activeConvo.other_user.first_name || ''} ${activeConvo.other_user.last_name || ''}`.trim()
                                          : activeConvo.other_user.name}
                                      </span>
                                      <span className="text-[9px] font-bold text-slate-400 ml-2">{formatMessageTime(first.created_at)}</span>
                                      {activeConvoId && pinnedMessagesByConvo[activeConvoId]?.has(first.id) && (
                                        <FiPin className="w-2.5 h-2.5 text-slate-400 rotate-45 ml-1.5" />
                                      )}
                                    </div>
                                    <div className="rounded-[5px] overflow-hidden shadow-3xs border border-slate-150">
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
                                  <div className={`absolute left-full top-1/2 -translate-y-1/2 pl-3 z-30 transition-opacity duration-150 ${activeMenuMessageId === first.id || activeReactMessageId === first.id
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
                                          const input = document.querySelector('input[placeholder="Type your reply here..."]') as HTMLInputElement;
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
                                            {/* Overlay to close menu */}
                                            <div className="fixed inset-0 z-40 bg-transparent cursor-default" onClick={() => setActiveMenuMessageId(null)} />
                                            {/* Dropdown Menu */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-50 bg-[#262626] text-white rounded-[8px] py-1.5 px-1 shadow-lg border border-slate-800 text-left min-w-[90px] flex flex-col select-none">
                                              <button
                                                type="button"
                                                onClick={() => handleRemoveMessage(first.id)}
                                                className="w-full text-left px-3 py-1.5 hover:bg-white/10 rounded-[6px] text-[11px] font-bold text-white border-none bg-transparent cursor-pointer transition-colors"
                                              >
                                                Remove
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handlePinMessage(first.id)}
                                                className="w-full text-left px-3 py-1.5 hover:bg-white/10 rounded-[6px] text-[11px] font-bold text-white border-none bg-transparent cursor-pointer transition-colors"
                                              >
                                                {activeConvoId && pinnedMessagesByConvo[activeConvoId]?.has(first.id) ? 'Unpin' : 'Pin'}
                                              </button>
                                              {/* Arrow tail */}
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
                      const isMe = currentUserId !== null && Number(msg.sender_id) === currentUserId;
                      const index = entryIdx;
                      return (
                        <React.Fragment key={msg.id || index}>
                          {separator}
                          <div data-msg-id={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} ${flashingMsgId === msg.id ? 'animate-msg-flash' : ''}`}>
                            {isMe ? (
                              /* OUTGOING MESSAGE (Right Aligned) */
                              <div className="flex gap-3 items-start max-w-[85%] justify-end group relative">
                                {/* Action Bar (revealed on hover) */}
                                <div className={`absolute right-full top-1/2 -translate-y-1/2 pr-3 z-30 transition-opacity duration-150 ${activeMenuMessageId === msg.id || activeReactMessageId === msg.id
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
                                        const input = document.querySelector('input[placeholder="Type your reply here..."]') as HTMLInputElement;
                                        if (input) input.focus();
                                      }}
                                      className="p-1 rounded-full text-slate-550 hover:text-slate-900 hover:bg-slate-200/80 transition-all border-none bg-transparent cursor-pointer flex items-center justify-center"
                                      title="Reply"
                                    >
                                      <FiCornerUpLeft className="w-3.5 h-3.5" />
                                    </button>
                                    <div className="relative flex items-center justify-center">
                                      <button
                                        type="button"
                                        onClick={() => setActiveMenuMessageId(prev => prev === msg.id ? null : msg.id)}
                                        className="p-1 rounded-full text-slate-505 hover:text-slate-900 hover:bg-slate-200/80 transition-all border-none bg-transparent cursor-pointer flex items-center justify-center"
                                        title="More Options"
                                      >
                                        <FiMoreVertical className="w-3.5 h-3.5" />
                                      </button>

                                      {activeMenuMessageId === msg.id && (
                                        <>
                                          {/* Overlay to close menu */}
                                          <div className="fixed inset-0 z-40 bg-transparent cursor-default" onClick={() => setActiveMenuMessageId(null)} />
                                          {/* Dropdown Menu */}
                                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-50 bg-[#262626] text-white rounded-[8px] py-1.5 px-1 shadow-lg border border-slate-800 text-left min-w-[90px] flex flex-col select-none">
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveMessage(msg.id)}
                                              className="w-full text-left px-3 py-1.5 hover:bg-white/10 rounded-[6px] text-[11px] font-bold text-white border-none bg-transparent cursor-pointer transition-colors"
                                            >
                                              Remove
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handlePinMessage(msg.id)}
                                              className="w-full text-left px-3 py-1.5 hover:bg-white/10 rounded-[6px] text-[11px] font-bold text-white border-none bg-transparent cursor-pointer transition-colors"
                                            >
                                              {activeConvoId && pinnedMessagesByConvo[activeConvoId]?.has(msg.id) ? 'Unpin' : 'Pin'}
                                            </button>
                                            {/* Arrow tail */}
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
                                    {activeConvoId && pinnedMessagesByConvo[activeConvoId]?.has(msg.id) && (
                                      <FiPin className="w-2.5 h-2.5 text-slate-400 rotate-45 mr-1.5" />
                                    )}
                                    <span className="text-[9px] font-bold text-slate-400 mr-2">
                                      {formatMessageTime(msg.created_at)}
                                    </span>
                                    <span className="text-xs font-black text-slate-800">
                                      {currentUser ? (
                                        currentUser.first_name || currentUser.last_name
                                          ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim()
                                          : currentUser.name
                                      ) : 'You'}
                                    </span>
                                  </div>
                                  {msg.reply_to_message && (
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mb-1 select-none justify-end pr-1">
                                      <FiCornerUpLeft className="w-3 h-3 text-slate-450 rotate-180" />
                                      <span>
                                        You replied to <strong className="text-slate-500 font-extrabold">{msg.reply_to_message.sender?.name || 'User'}</strong>
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
                                  {currentUser?.image_url ? (
                                    <img
                                      src={resolveImageUrl(currentUser.image_url)}
                                      alt={currentUser.name}
                                      className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-3xs"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shadow-3xs">
                                      {currentUser ? currentUser.name.charAt(0).toUpperCase() : 'Y'}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              /* INCOMING MESSAGE (Left Aligned) */
                              <div className="flex gap-3 items-start max-w-[85%] justify-start group relative">
                                {/* Avatar */}
                                <div className="shrink-0 mt-0.5 select-none">
                                  {activeConvo.other_user.image ? (
                                    <img
                                      src={resolveImageUrl(activeConvo.other_user.image)}
                                      alt={activeConvo.other_user.name}
                                      className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-3xs"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shadow-3xs">
                                      {activeConvo.other_user.name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                {/* Content Block */}
                                <div className="flex flex-col items-start">
                                  {/* Header: Name and Time */}
                                  <div className="flex items-baseline mb-1.5 select-none">
                                    <span className="text-xs font-black text-slate-800">
                                      {activeConvo.other_user.first_name || activeConvo.other_user.last_name
                                        ? `${activeConvo.other_user.first_name || ''} ${activeConvo.other_user.last_name || ''}`.trim()
                                        : activeConvo.other_user.name}
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-400 ml-2">
                                      {formatMessageTime(msg.created_at)}
                                    </span>
                                    {activeConvoId && pinnedMessagesByConvo[activeConvoId]?.has(msg.id) && (
                                      <FiPin className="w-2.5 h-2.5 text-slate-400 rotate-45 ml-1.5" />
                                    )}
                                  </div>
                                  {msg.reply_to_message && (
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mb-1 select-none justify-start pl-1">
                                      <FiCornerUpLeft className="w-3 h-3 text-slate-450" />
                                      <span>
                                        <strong className="text-slate-500 font-extrabold">{activeConvo.other_user.name}</strong> replied to <strong className="text-slate-500 font-extrabold">{currentUserId !== null && Number(msg.reply_to_message.sender?.id) === currentUserId ? 'You' : msg.reply_to_message.sender?.name}</strong>
                                      </span>
                                    </div>
                                  )}
                                  {/* Bubble */}
                                  <div className={msg.message_type === 'audio' ? 'text-left' : 'px-4 py-2.5 rounded-[5px] text-xs leading-relaxed font-medium text-left border custom-card-container'}>
                                    {msg.reply_to_message && (
                                      <div
                                        onClick={() => handleScrollToMessage(msg.reply_to_message_id!)}
                                        className="mb-2.5 p-2 bg-black/[0.04] hover:bg-black/[0.08] border-l-2 text-[10px] cursor-pointer transition-all select-none text-left rounded-r-[6px] rounded-l-[2px]"
                                      >
                                        <div className="text-[9px] font-black uppercase tracking-wider opacity-60">
                                          {msg.reply_to_message.sender?.name || 'User'}
                                        </div>
                                        <p className="max-h-28 overflow-y-auto custom-scrollbar mt-0.5 text-[11px] leading-normal font-medium italic whitespace-pre-wrap break-words opacity-90">
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
                                <div className={`absolute left-full top-1/2 -translate-y-1/2 pl-3 z-30 transition-opacity duration-150 ${activeMenuMessageId === msg.id || activeReactMessageId === msg.id
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
                                        const input = document.querySelector('input[placeholder="Type your reply here..."]') as HTMLInputElement;
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
                                          {/* Overlay to close menu */}
                                          <div className="fixed inset-0 z-40 bg-transparent cursor-default" onClick={() => setActiveMenuMessageId(null)} />
                                          {/* Dropdown Menu */}
                                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-50 bg-[#262626] text-white rounded-[8px] py-1.5 px-1 shadow-lg border border-slate-800 text-left min-w-[90px] flex flex-col select-none">
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveMessage(msg.id)}
                                              className="w-full text-left px-3 py-1.5 hover:bg-white/10 rounded-[6px] text-[11px] font-bold text-white border-none bg-transparent cursor-pointer transition-colors"
                                            >
                                              Remove
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handlePinMessage(msg.id)}
                                              className="w-full text-left px-3 py-1.5 hover:bg-white/10 rounded-[6px] text-[11px] font-bold text-white border-none bg-transparent cursor-pointer transition-colors"
                                            >
                                              {activeConvoId && pinnedMessagesByConvo[activeConvoId]?.has(msg.id) ? 'Unpin' : 'Pin'}
                                            </button>
                                            {/* Arrow tail */}
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
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Form */}
            {replyingToMessage && (
              <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-150 flex items-center justify-between gap-3 shrink-0 select-none animate-slide-up">
                <div className="flex-1 min-w-0 border-l-3 border-primary pl-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase text-primary">Replying to</span>
                    <span className="text-[10px] font-black text-slate-800">
                      {currentUserId !== null && Number(replyingToMessage.sender_id) === currentUserId ? 'You' : (activeConvo?.other_user.name || 'User')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5 italic">
                    {replyingToMessage.message_type === 'image'
                      ? '📷 Photo'
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
              <div className="px-4 pt-3 pb-1 border-t flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 bg-black/[0.02]">
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
              className="px-5 py-4 border-t flex items-center gap-3 shrink-0 bg-black/[0.02]"
            >
              {isRecording ? (
                <div className="flex-grow flex items-center justify-between bg-black/[0.03] border rounded-[10px] px-4 py-2 animate-pulse">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <span className="text-xs font-bold">Recording voice message: {formatDuration(recordingTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={cancelRecording}
                      className="p-1.5 rounded-full text-slate-500 hover:text-red-500 hover:bg-slate-200 transition-all border-none bg-transparent cursor-pointer flex items-center justify-center"
                      title="Cancel Recording"
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
                    className="w-10 h-10 rounded-[10px] bg-black/[0.03] border text-inherit hover:bg-black/[0.06] flex items-center justify-center shrink-0 transition-all cursor-pointer disabled:opacity-50"
                    title="Record voice message"
                  >
                    <FiMic className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleAttachmentClick}
                    disabled={isUploading || pendingImages.length >= MAX_IMAGES}
                    className="w-10 h-10 rounded-[10px] bg-black/[0.03] border text-inherit hover:bg-black/[0.06] flex items-center justify-center shrink-0 transition-all cursor-pointer disabled:opacity-50 relative"
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
                      placeholder="Type your reply here..."
                      value={inputText}
                      onChange={e => {
                        const val = e.target.value;
                        setInputText(val);
                        if (activeConvoId) {
                          setDrafts(prev => ({ ...prev, [activeConvoId]: val }));
                        }
                      }}
                      disabled={isSending || isUploading}
                      className="w-full pl-4 pr-10 py-3 bg-black/[0.03] border rounded-[10px] text-xs font-semibold focus:bg-black/[0.01] focus:border-primary outline-none transition-all"
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
                        <div className="absolute bottom-full right-0 mb-3 z-50 bg-[#262626] text-white rounded-[5px] p-3 shadow-lg border border-slate-800 w-64 select-none">
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
                                  setInputText(prev => prev + emoji);
                                  setShowEmojiPicker(false);
                                  const input = document.querySelector('input[placeholder="Type your reply here..."]') as HTMLInputElement;
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
                    disabled={(!inputText.trim() && pendingImages.length === 0) || isSending || isUploading}
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
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-60">
            <FiMessageSquare className="w-12 h-12 stroke-1 mb-2" />
            <p className="text-xs font-black uppercase tracking-widest">No conversation selected</p>
            <p className="text-[11px] font-semibold mt-1 max-w-[220px] leading-relaxed text-center">
              Please choose a customer thread from the left pane to begin chatting.
            </p>
          </div>
        )}
      </div>

      {/* ── Right Pane: Customer Details & Context Panel ────────── */}
      {activeConvo && showContextPanel && (
        <div className="w-80 border-l flex flex-col shrink-0 h-full bg-black/[0.015] select-none animate-in slide-in-from-right-3 duration-300">
          {/* Header */}
          <div className="p-4 border-b bg-transparent font-extrabold text-[11px] uppercase tracking-wider text-slate-400">
            Customer Context
          </div>

          <div className="flex-grow overflow-y-auto p-4 space-y-6 custom-scrollbar text-left">
            {/* Quick Profile card */}
            <div className="p-4 rounded-[5px] border shadow-3xs flex flex-col items-center text-center custom-card-container">
              {activeConvo.other_user.image ? (
                <img
                  src={resolveImageUrl(activeConvo.other_user.image)}
                  alt={activeConvo.other_user.name}
                  className="w-14 h-14 rounded-full object-cover border border-slate-150"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center text-lg font-black shadow-3xs">
                  {activeConvo.other_user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <h4 className="text-xs font-black text-slate-800 tracking-tight mt-3">
                {activeConvo.other_user.first_name || activeConvo.other_user.last_name
                  ? `${activeConvo.other_user.first_name || ''} ${activeConvo.other_user.last_name || ''}`.trim()
                  : activeConvo.other_user.name}
              </h4>
            </div>

            {/* Quick stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-[5px] border shadow-3xs text-center custom-card-container">
                <FiShoppingBag className="w-4 h-4 text-blue-500 mx-auto mb-1.5" />
                <p className="text-[9px] font-bold text-slate-450 uppercase tracking-wider mb-0.5">Orders</p>
                <p className="text-sm font-black">
                  {loadingOrders ? '...' : stats.count}
                </p>
              </div>
              <div className="p-3 rounded-[5px] border shadow-3xs text-center custom-card-container">
                <FiDollarSign className="w-4 h-4 text-emerald-500 mx-auto mb-1.5" />
                <p className="text-[9px] font-bold text-slate-450 uppercase tracking-wider mb-0.5">Total Spent</p>
                <p className="text-sm font-black">
                  {loadingOrders ? '...' : `$${stats.spent}`}
                </p>
              </div>
            </div>

            {/* Customer Details info block */}
            <div className="rounded-[5px] border shadow-3xs overflow-hidden custom-card-container">
              <div className="px-3.5 py-2.5 text-[10px] font-black uppercase tracking-wider custom-card-header-bar">
                Account Details
              </div>
              <div className="p-3.5 space-y-3.5 text-[11px] font-semibold text-slate-600">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Username</span>
                  <span className="text-slate-800 font-extrabold">{activeConvo.other_user.name}</span>
                </div>
                {activeConvo.other_user.last_seen_at && (
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Last Seen At</span>
                    <span className="text-slate-700 font-bold">
                      {new Date(activeConvo.other_user.last_seen_at).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Orders inside the drawer */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">
                Recent Orders ({customerOrders.length})
              </h4>
              {loadingOrders ? (
                <div className="py-6 flex items-center justify-center text-slate-400">
                  <FiLoader className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : customerOrders.length === 0 ? (
                <div className="text-[10px] font-semibold text-center py-4 rounded-[5px] border border-dashed custom-card-container">
                  No orders recorded.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {customerOrders.slice(0, 3).map(order => (
                    <div
                      key={order.id}
                      className="p-3 rounded-[5px] border shadow-3xs hover:scale-[1.01] transition-all flex justify-between items-center custom-card-container"
                    >
                      <div className="text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-800">#{order.order_no || `ORD-${order.id}`}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase leading-none shrink-0">
                            {order.time ? order.time.split(',')[0] : ''}
                          </span>
                        </div>
                        <span className="text-[11px] font-black text-slate-900 block mt-1">
                          ${parseFloat(order.total || '0').toFixed(2)}
                        </span>
                      </div>

                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide leading-none ${order.status === 'complete' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        order.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          order.status === 'confirm' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                            order.status === 'processing' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                              'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                        {order.status === 'confirm' ? 'confirmed' : order.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

