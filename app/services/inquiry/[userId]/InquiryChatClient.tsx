"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";
import {
  ArrowLeft,
  Phone,
  MoreVertical,
  Send,
  Paperclip,
  Mic,
  CheckCircle2,
  Wifi,
  WifiOff,
} from "lucide-react";

type Message = {
  id: string;
  content: string;
  isSystem: boolean;
  senderId: string;
  sender: {
    id: string;
    name: string | null;
    image: string | null;
  };
  createdAt: Date;
};

type Inquiry = {
  id: string;
  status: string;
  phoneRevealed: boolean;
  messages: Message[];
  prefillMessage?: string;
};

type Provider = {
  id: string;
  name: string | null;
  image: string | null;
  profile: {
    currentCity: string | null;
  } | null;
};

type InquiryChatClientProps = {
  providerUserId: string;
  provider: Provider;
  currentUserId: string;
};

export default function InquiryChatClient({
  providerUserId,
  provider,
  currentUserId,
}: InquiryChatClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [editingPrefill, setEditingPrefill] = useState(false);
  const [prefillMessage, setPrefillMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Initialize Socket.io connection
  useEffect(() => {
    // Use window.location.origin to ensure correct URL
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
      console.log("✅ Socket.io connected:", socket.id);
      console.log("   Transport:", socket.io.engine?.transport?.name || "unknown");
      setIsConnected(true);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Socket.io disconnected. Reason:", reason);
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("⚠️ Socket.io connection error:", error.message);
      setIsConnected(false);
    });

    // Log connection attempts
    socket.io.on("reconnect_attempt", (attemptNumber) => {
      console.log(`🔄 Socket.io reconnection attempt ${attemptNumber}`);
    });

    socket.io.on("reconnect", (attemptNumber) => {
      console.log(`✅ Socket.io reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
    });

    socket.io.on("reconnect_failed", () => {
      console.error("❌ Socket.io reconnection failed");
      setIsConnected(false);
    });

    // Listen for new messages
    socket.on("new_message", (newMessage: any) => {
      console.log("Received new message via socket:", newMessage);
      setInquiry((prev) => {
        if (!prev) return prev;
        // Check if message already exists to avoid duplicates
        if (prev.messages.some((m) => m.id === newMessage.id)) {
          console.log("Message already exists, skipping:", newMessage.id);
          return prev;
        }
        // Convert createdAt string to Date if needed
        const message: Message = {
          ...newMessage,
          createdAt: newMessage.createdAt ? new Date(newMessage.createdAt) : new Date(),
        };
        // Sort messages by createdAt to ensure proper order
        const updatedMessages = [...prev.messages, message].sort((a, b) => {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
        console.log("Updated messages count:", updatedMessages.length);
        return {
          ...prev,
          messages: updatedMessages,
        };
      });
      setTimeout(() => scrollToBottom(), 100);
    });

    // Listen for phone revealed
    socket.on("phone_revealed", (data: { inquiryId: string; phoneRevealed: boolean }) => {
      setInquiry((prev) => {
        if (!prev || prev.id !== data.inquiryId) return prev;
        return {
          ...prev,
          phoneRevealed: data.phoneRevealed,
        };
      });
    });

    // Listen for status changes
    socket.on("inquiry_status_changed", (data: { inquiryId: string; status: string }) => {
      setInquiry((prev) => {
        if (!prev || prev.id !== data.inquiryId) return prev;
        return {
          ...prev,
          status: data.status,
        };
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Join inquiry room when inquiry is loaded and socket is connected
  useEffect(() => {
    if (inquiry?.id && socketRef.current) {
      if (socketRef.current.connected) {
        socketRef.current.emit("join_inquiry", inquiry.id);
        console.log("Joined inquiry room:", inquiry.id);
      } else {
        // Wait for connection before joining
        socketRef.current.once("connect", () => {
          socketRef.current?.emit("join_inquiry", inquiry.id);
          console.log("Joined inquiry room after connect:", inquiry.id);
        });
      }
    }

    return () => {
      if (inquiry?.id && socketRef.current?.connected) {
        socketRef.current.emit("leave_inquiry", inquiry.id);
        console.log("Left inquiry room:", inquiry.id);
      }
    };
  }, [inquiry?.id, isConnected]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    initializeInquiry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [inquiry?.messages]);

  const initializeInquiry = async () => {
    try {
      // Try to get existing inquiry
      const res = await fetch(`/api/services/inquiry/${providerUserId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.inquiry) {
          // Ensure messages are sorted by createdAt
          const sortedMessages = data.inquiry.messages
            ? [...data.inquiry.messages].sort((a: Message, b: Message) => {
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
              })
            : [];
          setInquiry({
            ...data.inquiry,
            messages: sortedMessages,
          });
          if (data.inquiry.prefillMessage) {
            setPrefillMessage(data.inquiry.prefillMessage);
          }
          setLoading(false);
          return;
        }
      }

      // Create new inquiry
      const createRes = await fetch(`/api/services/inquiry/${providerUserId}`, {
        method: "POST",
      });
      if (createRes.ok) {
        const data = await createRes.json();
        setInquiry({
          ...data.inquiry,
          messages: data.inquiry.messages || [],
        });
        if (data.inquiry.prefillMessage) {
          setPrefillMessage(data.inquiry.prefillMessage);
        }
      }
    } catch (error) {
      console.error("Failed to initialize inquiry:", error);
      // Don't show alert for initialization errors, just log them
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(
        `/api/services/inquiry/${providerUserId}/message`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        // Optimistically add message to UI (socket will also send it)
        if (data.message) {
          setInquiry((prev) => {
            if (!prev) {
              // If inquiry doesn't exist yet, we need to fetch it
              initializeInquiry();
              return prev;
            }
            // Check if message already exists
            if (prev.messages.some((m) => m.id === data.message.id)) {
              return prev;
            }
            // Ensure createdAt is a Date object
            const message: Message = {
              ...data.message,
              createdAt: data.message.createdAt ? new Date(data.message.createdAt) : new Date(),
            };
            // Sort messages by createdAt
            const updatedMessages = [...prev.messages, message].sort((a, b) => {
              return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            });
            return {
              ...prev,
              messages: updatedMessages,
              phoneRevealed: data.phoneRevealed !== undefined ? data.phoneRevealed : prev.phoneRevealed,
              status: data.status || prev.status,
            };
          });
        }
        setMessage("");
        setEditingPrefill(false);
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
    if (editingPrefill && prefillMessage.trim()) {
      sendMessage(prefillMessage);
    } else if (message.trim()) {
      sendMessage(message);
    }
  };

  const quickReplies = [
    "🏠 Home visit chahiye",
    "📱 Video call karein",
    "💰 Price confirm karein",
    "🚨 Urgent hai",
  ];

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
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

  // Calculate derived values before early returns
  const messagesArray = inquiry?.messages ?? [];
  const realMessages = messagesArray.filter((m) => !m.isSystem);
  const showPrefill = realMessages.length === 0 && Boolean(prefillMessage);

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
        {provider.image ? (
          <img
            src={provider.image}
            alt={provider.name || "Provider"}
            className="w-[34px] h-[34px] rounded-xl object-cover"
          />
        ) : (
          <div className="w-[34px] h-[34px] rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center text-white text-xs font-bold">
            {getInitials(provider.name)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black truncate">
            {provider.name || "Service Provider"}
          </div>
          <div className="text-xs text-white/55 flex items-center gap-1">
            {provider.profile?.currentCity || "Location"} ·{" "}
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
        <button className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition">
          <Phone className="w-4 h-4" />
        </button>
        <button className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Context Card */}
      <div className="bg-blue-50 border-b border-blue-100 px-4 py-3 flex items-center gap-2.5 flex-shrink-0">
        <div className="text-lg">🏥</div>
        <div className="flex-1">
          <div className="text-xs font-black text-blue-700 uppercase tracking-wider mb-0.5">
            Service Inquiry
          </div>
            <div className="text-xs font-black text-gray-900">
            {provider.name} · {inquiry && inquiry.status === "AGREED" ? "Agreed" : "New"}
          </div>
          <div className="text-xs text-gray-600">
            {provider.profile?.currentCity || "Location"} ·{" "}
            {inquiry && inquiry.status === "AGREED" ? "Agreed ✓" : "Community Rate"}
          </div>
        </div>
        <div
          className={`px-2 py-1 rounded-full text-xs font-bold ${
            inquiry && inquiry.status === "AGREED"
              ? "bg-green-100 text-green-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {inquiry && inquiry.status === "AGREED" ? "Agreed ✓" : "New"}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2" style={{ minHeight: 0 }}>
        {inquiry && inquiry.messages.length === 0 && (
          <div className="text-center py-4">
            <div className="text-xs font-bold text-gray-400 mb-1">
              {formatDate(new Date())} · {(() => {
                const today = new Date();
                return today.toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                });
              })()}
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-full px-3 py-1.5 inline-block text-xs font-bold text-blue-700">
              💬 Chat started · {provider.name} responds in ~8 min
            </div>
          </div>
        )}

        {inquiry && inquiry.messages
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

        {/* Phone Reveal Card */}
        {inquiry && inquiry.phoneRevealed && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 flex items-center gap-2.5 my-2">
            <div className="text-lg">📱</div>
            <div className="flex-1">
              <div className="text-xs font-black text-green-800 mb-0.5">
                Phone numbers shared
              </div>
              <div className="text-sm font-black text-gray-900 tracking-wide">
                +91 98765 ●●●●●
              </div>
            </div>
            <div className="flex gap-1.5">
              <button className="px-2.5 py-1 bg-green-600 text-white text-xs font-bold rounded-lg">
                📞 Call
              </button>
              <button className="px-2.5 py-1 bg-white text-green-600 border border-green-200 text-xs font-bold rounded-lg">
                💬 WA
              </button>
            </div>
          </div>
        )}

        {/* Appointment Agreed Pill */}
        {inquiry && inquiry.status === "AGREED" && (() => {
          const priceMessage = inquiry.messages.find((m) => m.content.includes("₹"));
          const priceMatch = priceMessage?.content.match(/₹\d+/);
          const price = priceMatch?.[0] || "TBD";
          return (
            <div className="bg-green-50 border border-green-200 rounded-xl px-3.5 py-2.5 text-center my-2">
              <div className="text-xs font-bold text-green-800 leading-relaxed">
                📅 Agreed · {provider.profile?.currentCity || "Location"} · ₹{price}
                <br />
                <span className="text-xs font-medium text-green-700">
                  {provider.name} will visit your location
                </span>
              </div>
            </div>
          );
        })()}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      {realMessages.length === 0 && (
        <div className="px-4 pb-3 flex gap-1.5 overflow-x-auto scrollbar-hide flex-shrink-0">
          {quickReplies.map((reply, index) => (
            <button
              key={index}
              onClick={() => sendMessage(reply)}
              className="px-3 py-1.5 border border-blue-200 bg-white text-blue-700 text-xs font-bold rounded-full whitespace-nowrap hover:bg-blue-50 transition"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
          {editingPrefill ? (
            <textarea
              value={prefillMessage}
              onChange={(e) => setPrefillMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Edit your message..."
              className="flex-1 bg-transparent text-xs text-gray-900 placeholder-gray-400 resize-none focus:outline-none min-h-[40px] max-h-32"
              rows={2}
            />
          ) : (
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
              placeholder={realMessages.length === 0 ? "Edit or send message..." : "Type a message..."}
              className="flex-1 bg-transparent text-xs text-gray-500 placeholder-gray-400 focus:outline-none"
            />
          )}
          <button className="text-gray-400 hover:text-gray-600 transition">
            <Paperclip className="w-4 h-4" />
          </button>
          <button className="text-gray-400 hover:text-gray-600 transition">
            <Mic className="w-4 h-4" />
          </button>
          <button
            onClick={handleSend}
            disabled={sending || (!editingPrefill && !message.trim()) || (editingPrefill && !prefillMessage.trim())}
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
