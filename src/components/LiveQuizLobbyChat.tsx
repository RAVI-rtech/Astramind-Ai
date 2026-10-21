import React, { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, Shield, Clock, VolumeX, Volume2, AlertCircle } from "lucide-react";
import { supabase, getSupabaseAuthHeaders } from "../lib/supabase";
import { LiveQuizChatMessage } from "../types/academicLiveQuiz";

interface LiveQuizLobbyChatProps {
  roomCode: string;
  quizId?: string;
  isHost: boolean;
  currentUserDisplayName: string;
  currentUserId?: string;
  ws?: WebSocket | null;
  chatDisabled?: boolean;
  onToggleChat?: () => void;
}

export const LiveQuizLobbyChat: React.FC<LiveQuizLobbyChatProps> = ({
  roomCode,
  quizId,
  isHost,
  currentUserDisplayName,
  currentUserId,
  ws,
  chatDisabled = false,
  onToggleChat,
}) => {
  const [messages, setMessages] = useState<LiveQuizChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isChatDisabled, setIsChatDisabled] = useState<boolean>(chatDisabled);
  const [isTogglingChat, setIsTogglingChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const processedMessageIds = useRef<Set<string>>(new Set());

  const channelRef = useRef<any>(null);

  // Sync with prop
  useEffect(() => {
    setIsChatDisabled(!!chatDisabled);
  }, [chatDisabled]);

  // Scroll smoothly to the newest message
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Safe deduplicated message appender
  const addMessageSafely = (newMsg: LiveQuizChatMessage) => {
    if (!newMsg || !newMsg.id) return;
    if (processedMessageIds.current.has(newMsg.id)) return;

    processedMessageIds.current.add(newMsg.id);
    setMessages((prev) => {
      // If replacing a temporary optimistic message with same text from this user
      const tempIndex = prev.findIndex(
        (m) => m.id.startsWith("temp_") && m.message === newMsg.message && m.user_id === newMsg.user_id
      );
      if (tempIndex !== -1) {
        const next = [...prev];
        next[tempIndex] = newMsg;
        return next.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }

      if (prev.some((m) => m.id === newMsg.id)) return prev;
      const updated = [...prev, newMsg];
      return updated.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });
  };

  // 1. Load initial chat history via API
  useEffect(() => {
    if (!roomCode) return;
    const cleanRoomCode = roomCode.trim().toUpperCase();
    let isMounted = true;

    const fetchHistory = async () => {
      try {
        const authHeaders = await getSupabaseAuthHeaders();
        const resp = await fetch(`/api/live-quiz/chat/${cleanRoomCode}`, {
          headers: authHeaders,
        });
        if (resp.ok) {
          const data = await resp.json();
          if (isMounted) {
            if (data.chatDisabled !== undefined) {
              setIsChatDisabled(!!data.chatDisabled);
            }
            if (Array.isArray(data.messages)) {
              data.messages.forEach((msg: LiveQuizChatMessage) => {
                if (msg && msg.id) {
                  processedMessageIds.current.add(msg.id);
                }
              });
              setMessages(data.messages);
              setTimeout(() => scrollToBottom("auto"), 100);
            }
          }
        }
      } catch (err) {
        console.warn("Failed to load initial live quiz chat history:", err);
      }
    };

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [roomCode]);

  // 2. Supabase Realtime channel subscription (shared room channel)
  useEffect(() => {
    if (!roomCode) return;
    const cleanRoomCode = roomCode.trim().toUpperCase();
    const channelName = `quiz_lobby_chat_${cleanRoomCode}`;

    const channel = supabase
      .channel(channelName)
      .on("broadcast", { event: "chat_message" }, ({ payload }) => {
        if (payload) addMessageSafely(payload);
      })
      .on("broadcast", { event: "chat_toggle" }, ({ payload }) => {
        if (payload?.chatDisabled !== undefined) {
          setIsChatDisabled(!!payload.chatDisabled);
        }
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_quiz_chat_messages",
          filter: `room_code=eq.${cleanRoomCode}`,
        },
        (payload) => {
          if (payload?.new) {
            addMessageSafely(payload.new as LiveQuizChatMessage);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [roomCode]);

  // 3. Fast 2.5s fallback synchronization while in lobby
  useEffect(() => {
    if (!roomCode) return;
    const cleanRoomCode = roomCode.trim().toUpperCase();

    const pollLatest = async () => {
      try {
        const authHeaders = await getSupabaseAuthHeaders();
        const resp = await fetch(`/api/live-quiz/chat/${cleanRoomCode}`, {
          headers: authHeaders,
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.chatDisabled !== undefined) {
            setIsChatDisabled(!!data.chatDisabled);
          }
          if (Array.isArray(data.messages)) {
            data.messages.forEach((msg: LiveQuizChatMessage) => {
              addMessageSafely(msg);
            });
          }
        }
      } catch {
        // Silent catch for background poll
      }
    };

    const interval = setInterval(pollLatest, 2500);
    return () => clearInterval(interval);
  }, [roomCode]);

  // 4. WebSocket listener for instant zero-latency messages & chat toggle events
  useEffect(() => {
    if (!ws) return;

    const handleWsMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "chat_message" && data.message) {
          addMessageSafely(data.message);
        } else if (data.type === "chat_status" && data.chatDisabled !== undefined) {
          setIsChatDisabled(!!data.chatDisabled);
        } else if (data.room && data.room.chatDisabled !== undefined) {
          setIsChatDisabled(!!data.room.chatDisabled);
        }
      } catch {
        // Ignore parse error
      }
    };

    ws.addEventListener("message", handleWsMessage);
    return () => {
      ws.removeEventListener("message", handleWsMessage);
    };
  }, [ws]);

  // Auto-scroll on new message
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // Toggle chat status for host
  const handleHostToggleChat = async () => {
    if (!isHost || isTogglingChat) return;
    setIsTogglingChat(true);
    try {
      const cleanRoomCode = roomCode.trim().toUpperCase();
      const newStatus = !isChatDisabled;
      setIsChatDisabled(newStatus);

      // Broadcast toggle to peers immediately
      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "chat_toggle",
          payload: { chatDisabled: newStatus },
        });
      }

      if (onToggleChat) {
        onToggleChat();
      } else {
        const authHeaders = await getSupabaseAuthHeaders();
        const action = newStatus ? "disable_chat" : "enable_chat";
        const resp = await fetch("/api/live-quiz/control", {
          method: "POST",
          headers: {
            ...authHeaders,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            roomCode: cleanRoomCode,
            action,
          }),
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.chatDisabled !== undefined) {
            setIsChatDisabled(!!data.chatDisabled);
          }
        }
      }
    } catch (err) {
      console.error("Failed to toggle chat status:", err);
    } finally {
      setIsTogglingChat(false);
    }
  };

  // Send message handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;

    if (!isHost && isChatDisabled) {
      setErrorMessage("Chat is currently disabled by the host.");
      return;
    }

    if (trimmed.length > 500) {
      setErrorMessage("Message cannot exceed 500 characters.");
      return;
    }

    const cleanRoomCode = roomCode.trim().toUpperCase();
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const optimisticMsg: LiveQuizChatMessage = {
      id: tempId,
      quiz_id: quizId,
      room_code: cleanRoomCode,
      user_id: currentUserId || "user",
      display_name: currentUserDisplayName || (isHost ? "Host" : "Student"),
      message: trimmed,
      created_at: new Date().toISOString(),
      isHost: !!isHost,
    };

    // 1. Optimistically display immediately in sender's UI (<1ms)
    addMessageSafely(optimisticMsg);
    setInputText("");
    setIsSending(true);
    setErrorMessage(null);

    try {
      const authHeaders = await getSupabaseAuthHeaders();
      const resp = await fetch("/api/live-quiz/chat/send", {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomCode: cleanRoomCode,
          quizId,
          message: trimmed,
          displayName: currentUserDisplayName || (isHost ? "Host" : "Student"),
        }),
      });

      const data = await resp.json();
      if (resp.ok && data.success && data.message) {
        addMessageSafely(data.message);

        // Broadcast to all peers in this room via Supabase Realtime channel
        if (channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "chat_message",
            payload: data.message,
          });
        }
      } else {
        setErrorMessage(data.error || "Unable to send message. Please try again.");
      }
    } catch (err: any) {
      console.error("Chat send error:", err);
      setErrorMessage("Failed to send message. Check your connection.");
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div className="flex flex-col h-[480px] rounded-3xl bg-neutral-900/70 border border-neutral-800 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-800/80 bg-neutral-900/90 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              Lobby Chat
              {!isChatDisabled ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              ) : (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  Disabled
                </span>
              )}
            </h3>
            <p className="text-[10px] text-neutral-400">
              {isChatDisabled ? "Chat locked by host" : "Live discussion in lobby"}
            </p>
          </div>
        </div>

        {/* Host Control: Disable Chat / Enable Chat */}
        {isHost ? (
          <button
            onClick={handleHostToggleChat}
            disabled={isTogglingChat}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
              isChatDisabled
                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25"
                : "bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25"
            }`}
            title={isChatDisabled ? "Enable chat for students" : "Disable chat for students"}
          >
            {isChatDisabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Enable Chat</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                <span>Disable Chat</span>
              </>
            )}
          </button>
        ) : (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700">
            {messages.length} msgs
          </span>
        )}
      </div>

      {/* Messages List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-neutral-700">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-neutral-500">
            <MessageSquare className="w-8 h-8 text-neutral-600 mb-2 stroke-[1.5]" />
            <p className="text-xs font-medium text-neutral-400">No messages in lobby yet</p>
            <p className="text-[11px] text-neutral-500 mt-1 max-w-[220px]">
              Say hello, confirm you are ready, or ask the host before starting!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = currentUserId ? msg.user_id === currentUserId : false;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px]">
                  <span
                    className={`font-semibold ${
                      msg.isHost
                        ? "text-amber-400 flex items-center gap-1"
                        : isMe
                        ? "text-indigo-400"
                        : "text-neutral-300"
                    }`}
                  >
                    {msg.display_name}
                    {msg.isHost && (
                      <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <Shield className="w-2.5 h-2.5" /> Host
                      </span>
                    )}
                    {isMe && !msg.isHost && (
                      <span className="text-[9px] text-neutral-500 ml-0.5">(You)</span>
                    )}
                  </span>
                  <span className="text-[10px] text-neutral-500 flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    {formatTime(msg.created_at)}
                  </span>
                </div>
                <div
                  className={`px-3.5 py-2 rounded-2xl max-w-[85%] text-xs break-words shadow-sm leading-relaxed ${
                    isMe
                      ? "bg-indigo-600 text-white rounded-tr-sm"
                      : msg.isHost
                      ? "bg-neutral-800 border border-amber-500/30 text-neutral-100 rounded-tl-sm"
                      : "bg-neutral-800/90 border border-neutral-700/60 text-neutral-200 rounded-tl-sm"
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 border-t border-neutral-800 bg-neutral-950/60 flex flex-col gap-1.5"
      >
        {isChatDisabled && !isHost && (
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Chat has been disabled by the host.</span>
          </div>
        )}

        {isChatDisabled && isHost && (
          <div className="text-[10px] text-amber-400 px-1 font-medium flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>Chat is disabled for students. (Host notices are still delivered)</span>
          </div>
        )}

        {errorMessage && (
          <div className="text-[11px] text-rose-400 px-1">{errorMessage}</div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => {
              if (e.target.value.length <= 500) {
                setInputText(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              isChatDisabled && !isHost
                ? "Chat disabled by host"
                : "Type a message... (Enter to send)"
            }
            disabled={isSending || (isChatDisabled && !isHost)}
            maxLength={500}
            className="flex-1 bg-neutral-900 border border-neutral-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending || (isChatDisabled && !isHost)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
        {inputText.length > 400 && (
          <div className="text-[10px] text-right text-neutral-400">
            {500 - inputText.length} chars left
          </div>
        )}
      </form>
    </div>
  );
};
