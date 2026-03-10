"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";
import {
  ArrowLeft,
  Send,
  Paperclip,
  Mic,
  Wifi,
  WifiOff,
} from "lucide-react";

type Message = {
  id: string;
  content: string;
  senderId: string;
  sender: {
    id: string;
    name: string | null;
    image: string | null;
  };
  createdAt: Date | string;
};

type Conversation = {
  id: string;
  otherUser: {
    id: string;
    name: string | null;
    image: string | null;
    profile: {
      currentCity: string | null;
    } | null;
  };
  messages: Message[];
  updatedAt: Date | string;
};

type ConversationChatClientProps = {
  otherUserId: string;
  currentUserId: string;
};

export default function ConversationChatClient({
  otherUserId,
  currentUserId,
}: ConversationChatClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [friendRequestStatus, setFriendRequestStatus] = useState<"PENDING" | "ACCEPTED" | "REJECTED" | null>(null);
  const [showPrefill, setShowPrefill] = useState(false);
  const [prefillMessage, setPrefillMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Initialize Socket.io connection
  useEffect(() => {
    const socketUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    
    const socket = io(socketUrl, {
      path: "/api/socket",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      autoConnect: true,
      forceNew: false,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Conversation Socket.io connected:", socket.id);
      setIsConnected(true);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Conversation Socket.io disconnected. Reason:", reason);
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("⚠️ Conversation Socket.io connection error:", error.message);
      setIsConnected(false);
    });

    // Listen for new messages
    socket.on("new_message", (newMessage: any) => {
      console.log("Received new message via socket:", newMessage);
      setConversation((prev) => {
        if (!prev) return prev;
        if (prev.messages.some((m) => m.id === newMessage.id)) {
          return prev;
        }
        const message: Message = {
          ...newMessage,
          createdAt: newMessage.createdAt ? new Date(newMessage.createdAt) : new Date(),
        };
        const updatedMessages = [...prev.messages, message].sort((a, b) => {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
        return {
          ...prev,
          messages: updatedMessages,
        };
      });
      setTimeout(() => scrollToBottom(), 100);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Join conversation room when conversation is loaded
  useEffect(() => {
    if (conversation?.id && socketRef.current) {
      if (socketRef.current.connected) {
        socketRef.current.emit("join_conversation", conversation.id);
        console.log("Joined conversation room:", conversation.id);
      } else {
        socketRef.current.once("connect", () => {
          socketRef.current?.emit("join_conversation", conversation.id);
          console.log("Joined conversation room after connect:", conversation.id);
        });
      }
    }

    return () => {
      if (conversation?.id && socketRef.current) {
        socketRef.current.emit("leave_conversation", conversation.id);
      }
    };
  }, [conversation?.id]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    initializeConversation();
    checkFriendRequestStatus();
  }, [otherUserId]);

  const checkFriendRequestStatus = async () => {
    try {
      const res = await fetch(`/api/friend-requests/${otherUserId}`);
      if (res.ok) {
        const data = await res.json();
        setFriendRequestStatus(data.status);
        // If just accepted and no messages, show prefill
        if (data.status === "ACCEPTED" && conversation && conversation.messages.length === 0) {
          setShowPrefill(true);
          generatePrefillMessage();
        }
      }
    } catch (error) {
      console.error("Failed to check friend request status:", error);
    }
  };

  const generatePrefillMessage = () => {
    const otherUserName = conversation?.otherUser.name || "bhai";
    const currentUserName = session?.user?.name || "Main";
    const city = conversation?.otherUser.profile?.currentCity || "yahan";
    const message = `Namaste ${otherUserName}! Main ${currentUserName}, ${city} mein hun. Community mein judna chahta hun. 🙏`;
    setPrefillMessage(message);
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  const initializeConversation = async () => {
    try {
      const res = await fetch(`/api/conversations/${otherUserId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.conversation) {
          const sortedMessages = data.conversation.messages
            ? [...data.conversation.messages].sort((a: Message, b: Message) => {
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
              })
            : [];
          const conv = {
            ...data.conversation,
            messages: sortedMessages,
          };
          setConversation(conv);
          
          // Check if we should show prefill (accepted friend request, no messages)
          if (sortedMessages.length === 0) {
            const frRes = await fetch(`/api/friend-requests/${otherUserId}`);
            if (frRes.ok) {
              const frData = await frRes.json();
              if (frData.status === "ACCEPTED") {
                setShowPrefill(true);
                const otherUserName = conv.otherUser.name || "bhai";
                const currentUserName = session?.user?.name || "Main";
                const city = conv.otherUser.profile?.currentCity || "yahan";
                setPrefillMessage(`Namaste ${otherUserName}! Main ${currentUserName}, ${city} mein hun. Community mein judna chahta hun. 🙏`);
              }
            }
          }
        } else {
          // Create new conversation
          const createRes = await fetch(`/api/conversations/${otherUserId}`, {
            method: "POST",
          });
          if (createRes.ok) {
            const createData = await createRes.json();
            const conv = {
              ...createData.conversation,
              messages: createData.conversation.messages || [],
            };
            setConversation(conv);
            
            // Check friend request status for prefill
            const frRes = await fetch(`/api/friend-requests/${otherUserId}`);
            if (frRes.ok) {
              const frData = await frRes.json();
              if (frData.status === "ACCEPTED" && conv.messages.length === 0) {
                setShowPrefill(true);
                const otherUserName = conv.otherUser.name || "bhai";
                const currentUserName = session?.user?.name || "Main";
                const city = conv.otherUser.profile?.currentCity || "yahan";
                setPrefillMessage(`Namaste ${otherUserName}! Main ${currentUserName}, ${city} mein hun. Community mein judna chahta hun. 🙏`);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to initialize conversation:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${otherUserId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setConversation((prev) => {
            if (!prev) {
              initializeConversation();
              return prev;
            }
            if (prev.messages.some((m) => m.id === data.message.id)) {
              return prev;
            }
            const message: Message = {
              ...data.message,
              createdAt: data.message.createdAt ? new Date(data.message.createdAt) : new Date(),
            };
            const updatedMessages = [...prev.messages, message].sort((a, b) => {
              return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            });
            return {
              ...prev,
              messages: updatedMessages,
            };
          });
        }
        setMessage("");
        setTimeout(() => scrollToBottom(), 100);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Failed to send message:", errorData);
        alert(errorData.error || "Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Network error. Please check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    if (message.trim()) {
      sendMessage(message);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date | string) => {
    const today = new Date();
    const msgDate = new Date(date);
    if (msgDate.toDateString() === today.toDateString()) {
      return "Today";
    }
    return msgDate.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-sm text-gray-500">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Failed to load conversation</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-blue-600 hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden" style={{ maxHeight: "90vh", height: "90vh" }}>
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-800 to-blue-900 text-white px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => router.back()}
          className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        {conversation.otherUser.image ? (
          <img
            src={conversation.otherUser.image}
            alt={conversation.otherUser.name || "User"}
            className="w-[34px] h-[34px] rounded-xl object-cover"
          />
        ) : (
          <div className="w-[34px] h-[34px] rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center text-white text-xs font-bold">
            {getInitials(conversation.otherUser.name)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black truncate">
            {conversation.otherUser.name || "User"}
          </div>
          <div className="text-xs text-white/55 flex items-center gap-1">
            {friendRequestStatus === "ACCEPTED" && (
              <>
                <span className="flex items-center gap-1 text-green-300">
                  ✓ Connected
                </span>
                <span> · </span>
              </>
            )}
            {conversation.otherUser.profile?.currentCity || "Location"} ·{" "}
            {isConnected ? (
              <span className="flex items-center gap-1">
                <Wifi className="w-3 h-3" />
                Online
              </span>
            ) : (
              <span className="flex items-center gap-1 text-white/40">
                <WifiOff className="w-3 h-3" />
                Connecting...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2" style={{ minHeight: 0 }}>
        {conversation.messages.length === 0 && (
          <>
            <div className="text-center py-4">
              <div className="text-xs font-bold text-gray-400 mb-1">
                {formatDate(new Date())}
              </div>
              {friendRequestStatus === "ACCEPTED" && (
                <div className="bg-green-50 border border-green-200 rounded-full px-3 py-1.5 inline-block text-xs font-bold text-green-700 mb-3">
                  🤝 {conversation.otherUser.name || "User"} accepted your request — you're connected!
                </div>
              )}
              <div className="bg-blue-50 border border-blue-100 rounded-full px-3 py-1.5 inline-block text-xs font-bold text-blue-700">
                💬 Start the conversation
              </div>
            </div>
            
            {/* Pre-filled opener message */}
            {showPrefill && prefillMessage && (
              <div className="mx-3 mb-3 p-3 bg-gradient-to-r from-blue-50 to-white border-2 border-dashed border-blue-200 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                    ✏️ Your opening message — edit if needed
                  </span>
                </div>
                <p className="text-sm text-gray-800 leading-relaxed mb-2" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {prefillMessage}
                </p>
                <button
                  onClick={() => {
                    setMessage(prefillMessage);
                    setShowPrefill(false);
                  }}
                  className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                >
                  ✏️ Use this message
                </button>
              </div>
            )}
          </>
        )}

        {conversation.messages
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          .map((msg, index, sortedMessages) => {
            const isMe = msg.senderId === currentUserId;
            const showDate =
              index === 0 ||
              new Date(msg.createdAt).toDateString() !==
                new Date(sortedMessages[index - 1].createdAt).toDateString();

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex items-center gap-2 my-2">
                    <div className="flex-1 h-px bg-gray-200" />
                    <div className="text-xs font-bold text-gray-400">
                      {formatDate(msg.createdAt)}
                    </div>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                )}
                <div className={`flex items-end gap-1.5 ${isMe ? "flex-row-reverse" : ""}`}>
                  {!isMe && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {getInitials(msg.sender.name)}
                    </div>
                  )}
                  <div
                    className={`max-w-[72%] rounded-2xl px-3 py-2 ${
                      isMe
                        ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-sm"
                        : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm shadow-sm"
                    }`}
                  >
                    <p className="text-xs leading-relaxed">{msg.content}</p>
                    <div
                      className={`text-xs mt-1 ${
                        isMe ? "text-white/50 text-right" : "text-gray-400"
                      }`}
                    >
                      {formatTime(msg.createdAt)}
                      {isMe && " ✓✓"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      {conversation.messages.length === 0 && friendRequestStatus === "ACCEPTED" && (
        <div className="px-3 py-2 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setMessage("👋 Namaste!")}
            className="px-3 py-1.5 rounded-full border border-blue-200 bg-white text-blue-600 text-xs font-bold whitespace-nowrap"
          >
            👋 Namaste!
          </button>
          <button
            onClick={() => {
              const state = conversation.otherUser.profile?.nativePlaceState || "Odisha";
              setMessage(`🌾 ${state} se hun`);
            }}
            className="px-3 py-1.5 rounded-full border border-blue-200 bg-white text-blue-600 text-xs font-bold whitespace-nowrap"
          >
            🌾 State se hun
          </button>
          <button
            onClick={() => setMessage("💼 Kaam ke baare mein baat karein")}
            className="px-3 py-1.5 rounded-full border border-blue-200 bg-white text-blue-600 text-xs font-bold whitespace-nowrap"
          >
            💼 Kaam ke baare mein
          </button>
        </div>
      )}

      {/* Input Bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 flex-shrink-0">
        <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 ${
          friendRequestStatus === "ACCEPTED" 
            ? "bg-blue-50 border-2 border-blue-200" 
            : "bg-gray-50 border border-gray-200"
        }`}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={friendRequestStatus === "ACCEPTED" ? "Type your message..." : "Type a message..."}
            className={`flex-1 bg-transparent text-xs focus:outline-none ${
              friendRequestStatus === "ACCEPTED" 
                ? "text-blue-600 placeholder-blue-400" 
                : "text-gray-500 placeholder-gray-400"
            }`}
          />
          <button className="text-gray-400 hover:text-gray-600 transition">
            <Paperclip className="w-4 h-4" />
          </button>
          <button className="text-gray-400 hover:text-gray-600 transition">
            <Mic className="w-4 h-4" />
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !message.trim()}
            className="w-[30px] h-[30px] bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
