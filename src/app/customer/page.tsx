"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "@/components/providers/SessionProvider";
import { DEMO_USERS } from "@/lib/auth/demo-users";
import {
  Send,
  Bot,
  User,
  Headphones,
  Paperclip,
  Package,
  RotateCcw,
  CreditCard,
  HelpCircle,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Mail,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Loader2,
  X,
  Printer,
  ShoppingBag,
  Bell,
  Sliders,
  Crown,
  Search,
  MessageSquare,
  DollarSign,
  Truck,
  Check,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { formatCurrency, formatDate, formatDateTime, getStatusBadgeVariant } from "@/lib/utils";
import { NotificationDetailModal } from "@/components/customer/NotificationDetailModal";

type CustomerTab =
  | "overview"
  | "orders"
  | "returns"
  | "refunds"
  | "chat"
  | "conversations"
  | "notifications"
  | "account";

export default function CustomerPortalPage() {
  const { user, currentPerspective, switchUser, loading: sessionLoading } = useSession();
  const [activeTab, setActiveTab] = useState<CustomerTab>("overview");

  if (user?.role === "ADMIN" || user?.role === "SUPPORT_AGENT") {
    const isAgent = user?.role === "SUPPORT_AGENT";
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background text-foreground min-h-[60vh]">
        <div className="max-w-md w-full p-8 rounded-3xl bg-card border border-border shadow-2xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground">Customer Portal Restricted</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You are signed in as <strong>{user.name}</strong> ({isAgent ? "Tier 2 Support Specialist" : "Operations Lead & Admin"}). Staff accounts only have access to their dedicated operational workspaces.
            </p>
          </div>
          <button
            onClick={() => {
              const target = isAgent ? "/agent" : "/admin";
              window.history.pushState({}, "", target);
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
            className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition shadow-xs cursor-pointer"
          >
            {isAgent ? "Go to Agent Workspace" : "Go to Admin Command Center"}
          </button>
        </div>
      </div>
    );
  }

  // Chat State
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationStatus, setConversationStatus] = useState("AI_HANDLING");
  const [attachedFile, setAttachedFile] = useState<any | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // CSAT Rating state
  const [csatSubmitted, setCsatSubmitted] = useState(false);
  const [csatRating, setCsatRating] = useState<number | null>(null);
  const [csatComment, setCsatComment] = useState("");

  // Customer Data State
  const [orders, setOrders] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [pastConversations, setPastConversations] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedCustomerNotif, setSelectedCustomerNotif] = useState<any | null>(null);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [selectedReturnLabel, setSelectedReturnLabel] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (activeTab === "chat") {
      scrollToBottom();
    }
  }, [messages, isAiThinking, activeTab]);

  const conversationIdRef = useRef(conversationId);
  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  // Real-time synchronization: persistent listener for Agent takeover and replies
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource("/api/events?channel=*");
      es.onmessage = (e) => {
        try {
          const evt = JSON.parse(e.data);
          const currentId = conversationIdRef.current;
          if (evt.type === "NEW_MESSAGE") {
            const msg = evt.payload?.message;
            if (msg && evt.payload?.conversationId === currentId && msg.senderType === "AGENT") {
              setIsAiThinking(false);
              setMessages((prev) => {
                if (prev.some((m) => m.id === msg.id)) return prev;
                return [...prev, msg];
              });
            }
          } else if (evt.type === "AGENT_TAKEOVER") {
            if (evt.payload?.conversationId === currentId) {
              setConversationStatus("AGENT_ACTIVE");
            }
          } else if (evt.type === "STATUS_CHANGE") {
            if (evt.payload?.conversationId === currentId && evt.payload?.status) {
              setConversationStatus(evt.payload.status);
            }
          }
        } catch {}
      };
    } catch {}
    return () => {
      if (es) es.close();
    };
  }, []);

  // Load customer data whenever active user changes
  useEffect(() => {
    if (user?.customerId) {
      loadCustomerData();
      loadConversation();
      loadPastConversations();
      loadNotifications();
    }
  }, [user?.email, user?.customerId]);

  const loadCustomerData = async () => {
    try {
      const [ordRes, retRes] = await Promise.all([
        fetch("/api/customer/orders"),
        fetch("/api/customer/returns"),
      ]);
      const ordData = await ordRes.json();
      const retData = await retRes.json();

      if (ordData.success) setOrders(ordData.orders || []);
      if (retData.success) setReturns(retData.returns || []);
    } catch (e) {
      console.error("Failed to load customer orders/returns:", e);
    }
  };

  const loadPastConversations = async () => {
    try {
      const res = await fetch("/api/customer/conversations");
      const data = await res.json();
      if (data.success) {
        setPastConversations(data.conversations || []);
      }
    } catch (e) {
      console.error("Failed to load past conversations:", e);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await fetch("/api/customer/notifications");
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error("Failed to load notifications:", e);
    }
  };

  const loadConversation = async () => {
    try {
      const res = await fetch("/api/customer/conversations");
      const data = await res.json();
      if (data.success && data.conversations && data.conversations.length > 0) {
        const latest = data.conversations[0];
        setConversationId(latest.id);
        setConversationStatus(latest.status);
        setMessages(latest.messages || []);
      } else {
        // Fresh conversation for new customer
        setConversationId(null);
        setConversationStatus("AI_HANDLING");
        setMessages([
          {
            id: "welcome-1",
            senderType: "AI",
            senderName: "NovaMart AI Assistant",
            content: `Hello ${user?.name?.split(" ")[0] || "there"}! 👋 Welcome to NovaMart Support.\n\nI can assist you with tracking your recent orders, starting return requests, answering store policy questions, or connecting you with a specialist. How can I help you today?`,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (e) {
      console.error("Failed to load active conversation:", e);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || inputMessage).trim();
    if (!messageContent && !attachedFile) return;

    const userMsg = {
      id: `temp-${Date.now()}`,
      senderType: "CUSTOMER",
      senderName: user?.name || "Customer",
      content: messageContent,
      attachments: attachedFile ? JSON.stringify([attachedFile]) : null,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setAttachedFile(null);
    setIsAiThinking(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageContent,
          conversationId,
          attachments: attachedFile ? [attachedFile] : undefined,
          stream: true,
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("text/event-stream") && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        const streamingAiMsgId = `stream-${Date.now()}`;
        let accumulatedText = "";
        let toolCallList: any[] = [];

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const event = JSON.parse(line.slice(6));
                if (event.type === "thinking") {
                  setIsAiThinking(true);
                } else if (event.type === "tool_call") {
                  toolCallList.push(event.data);
                } else if (event.type === "token") {
                  setIsAiThinking(false);
                  accumulatedText += event.data;
                  setMessages((prev) => {
                    const existing = prev.find((m) => m.id === streamingAiMsgId);
                    if (existing) {
                      return prev.map((m) =>
                        m.id === streamingAiMsgId
                          ? { ...m, content: accumulatedText, toolCalls: JSON.stringify(toolCallList) }
                          : m
                      );
                    } else {
                      return [
                        ...prev,
                        {
                          id: streamingAiMsgId,
                          senderType: "AI",
                          senderName: "NovaMart AI Assistant",
                          content: accumulatedText,
                          toolCalls: JSON.stringify(toolCallList),
                          createdAt: new Date().toISOString(),
                        },
                      ];
                    }
                  });
                } else if (event.type === "done") {
                  setIsAiThinking(false);
                  if (event.conversationId) setConversationId(event.conversationId);
                  if (event.aiResult?.escalated) setConversationStatus("NEEDS_HUMAN");
                  if (event.message) {
                    setMessages((prev) =>
                      prev.map((m) => (m.id === streamingAiMsgId ? event.message : m))
                    );
                  }
                  loadCustomerData();
                }
              } catch {}
            }
          }
        }
        return;
      }

      // Fallback JSON parsing
      const data = await res.json();
      setIsAiThinking(false);

      if (data.success) {
        if (data.conversationId) {
          setConversationId(data.conversationId);
        }
        if (data.agentActive) {
          setConversationStatus("AGENT_ACTIVE");
        }
        if (data.escalated) {
          setConversationStatus("NEEDS_HUMAN");
        }

        // Add AI response
        if (data.aiMessage) {
          setMessages((prev) => [...prev, data.aiMessage]);
        }

        // Reload customer orders/returns in case tool modified state
        loadCustomerData();
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            senderType: "AI",
            senderName: "NovaMart AI Assistant",
            content: `⚠️ I encountered an issue processing your request: ${data.error || "Please try again."}`,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          senderType: "AI",
          senderName: "NovaMart AI Assistant",
          content: "⚠️ Network connection interrupted. Please try again.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.file) {
        setAttachedFile(data.file);
      } else {
        alert(data.error || "Failed to upload file");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload file.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCsatSubmit = async () => {
    if (!csatRating || !conversationId) return;
    try {
      const res = await fetch("/api/customer/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          score: csatRating,
          comment: csatComment,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCsatSubmitted(true);
      }
    } catch (e) {
      console.error("CSAT submission error:", e);
    }
  };

  // Dynamic Prompt Suggestions based on Persona
  const getPromptSuggestions = () => {
    if (user?.email === DEMO_USERS.SARAH_JOHNSON.email) {
      return [
        { label: "📦 Track my order ORD-9821", text: "Where is my order ORD-9821?" },
        { label: "🔄 Return NovaPod Earbuds (ORD-9821)", text: "I would like to return the NovaPod Earbuds from order ORD-9821. The ear tips do not fit." },
        { label: "❓ What is the NovaMart return policy?", text: "What is your 30-day return policy and how do refunds work?" },
      ];
    }
    if (user?.email === DEMO_USERS.DAVID_SMITH.email) {
      return [
        { label: "🚚 Track my order ORD-8412", text: "What is the status of my order ORD-8412?" },
        { label: "📦 When will ORD-9104 arrive?", text: "When is my CloudKnit Merino Wool Sweater (ORD-9104) scheduled for delivery?" },
        { label: "👑 What are my Platinum VIP perks?", text: "Can you tell me what perks come with my Platinum VIP status?" },
      ];
    }
    if (user?.email === DEMO_USERS.JAMES_WILSON.email) {
      return [
        { label: "⚠️ Charged twice for ORD-7734!", text: "I was charged twice $189.99 for order ORD-7734 on my credit card!" },
        { label: "💳 View my payment receipt", text: "Can you check the transaction history for order ORD-7734?" },
        { label: "🎧 Connect me with a Billing Specialist", text: "Please connect me with a live human billing agent immediately." },
      ];
    }
    if (user?.email === DEMO_USERS.EMILY_DAVIS.email) {
      return [
        { label: "🎧 Warranty on Headphones (ORD-6129)", text: "My SoundPulse Headphones from order ORD-6129 have a loose hinge. Is this covered under warranty?" },
        { label: "🔄 Request replacement RMA", text: "I would like to arrange a warranty replacement or exchange for order ORD-6129." },
        { label: "⭐ Check my Silver VIP status", text: "What benefits do I get with my Silver VIP membership?" },
      ];
    }
    return [
      { label: "📦 Where is my recent order?", text: "Where is my most recent order and what is the tracking status?" },
      { label: "🔄 How do I start a return?", text: "How do I return an item I recently received?" },
      { label: "💬 Connect with support agent", text: "I have a complex issue and would like to speak with a human support agent." },
    ];
  };

  const promptSuggestions = getPromptSuggestions();

  // Filtered orders for search
  const filteredOrders = searchQuery
    ? orders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.items?.some((it: any) => it.product?.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : orders;

  const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const activeReturnsCount = returns.filter((r) => r.status !== "REJECTED").length;

  return (
    <div className="flex-1 flex flex-col bg-background text-foreground">
      {/* 1. Customer Workspace Header Banner */}
      <div className="border-b border-border/80 bg-gradient-to-r from-card via-background to-card px-4 sm:px-8 py-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Customer Profile Identity */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={
                  currentPerspective?.avatar ||
                  user?.avatar ||
                  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80"
                }
                alt={user?.name || "Customer"}
                className="w-16 h-16 rounded-2xl object-cover ring-4 ring-brand-500/20 shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 ring-2 ring-background flex items-center justify-center text-[10px] text-white font-bold">
                ✓
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {user?.name || "Sarah Johnson"}
                </h1>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                    currentPerspective?.badgeColor || "bg-brand-500/15 text-brand-500 border-brand-500/30"
                  }`}
                >
                  {currentPerspective?.tier || "Gold VIP"}
                </span>
                <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
                  Customer Workspace
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                <span>{user?.email || "sarah.j@example.com"}</span>
                <span>•</span>
                <span>{orders.length} Total Orders</span>
                <span>•</span>
                <span>{formatCurrency(totalSpent)} Lifetime Spend</span>
              </p>
            </div>
          </div>

          {/* Scenario Spotlight Box */}
          <div className="bg-card border border-brand-500/30 rounded-xl p-3.5 max-w-md shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center gap-2 text-xs font-bold text-brand-400 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{currentPerspective?.scenarioTitle || "Active Customer Scenario"}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {currentPerspective?.scenarioDescription ||
                "Ask about order status, return eligibility, or billing in the 24/7 AI chat."}
            </p>
          </div>
        </div>

        {/* 2. Customer Navigation Tabs */}
        <div className="max-w-7xl mx-auto mt-6 flex overflow-x-auto gap-1 border-b border-border/60 pb-px scrollbar-none">
          {[
            { id: "overview", label: "Overview", icon: ShoppingBag },
            { id: "orders", label: "Orders", icon: Package, badge: orders.length },
            { id: "returns", label: "Returns", icon: RotateCcw, badge: activeReturnsCount > 0 ? activeReturnsCount : null },
            { id: "refunds", label: "Refunds & Billing", icon: CreditCard },
            { id: "chat", label: "24/7 AI Chat", icon: Bot, isHighlight: true },
            { id: "conversations", label: "Past Conversations", icon: MessageSquare, badge: pastConversations.length },
            { id: "notifications", label: "Notifications", icon: Bell, badge: notifications.length },
            { id: "account", label: "Account & Preferences", icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as CustomerTab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border-b-2 ${
                  isActive
                    ? "border-brand-500 text-brand-500 bg-brand-500/10 font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/40"
                } ${tab.isHighlight && !isActive ? "text-amber-400 bg-amber-500/5 hover:bg-amber-500/10" : ""}`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-brand-500" : ""}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge !== null && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? "bg-brand-500 text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Tab Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => setActiveTab("chat")}
                className="p-5 rounded-2xl bg-card border border-border hover:border-brand-500/50 hover:shadow-lg transition-all text-left group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-500/15 text-brand-500 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                  <Bot className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-foreground flex items-center justify-between">
                  <span>24/7 AI Assistant</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition" />
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Instant automated order tracking, return validation & FAQs.
                </p>
              </button>

              <button
                onClick={() => setActiveTab("orders")}
                className="p-5 rounded-2xl bg-card border border-border hover:border-brand-500/50 hover:shadow-lg transition-all text-left group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                  <Package className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-foreground flex items-center justify-between">
                  <span>Track Packages</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition" />
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  View tracking numbers, carrier status & item manifests.
                </p>
              </button>

              <button
                onClick={() => setActiveTab("returns")}
                className="p-5 rounded-2xl bg-card border border-border hover:border-brand-500/50 hover:shadow-lg transition-all text-left group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-foreground flex items-center justify-between">
                  <span>Return Portal</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition" />
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Request refunds and print prepaid FedEx shipping labels.
                </p>
              </button>

              <button
                onClick={() => setActiveTab("refunds")}
                className="p-5 rounded-2xl bg-card border border-border hover:border-brand-500/50 hover:shadow-lg transition-all text-left group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-foreground flex items-center justify-between">
                  <span>Billing & Receipts</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition" />
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Transaction receipts, payment history and refund status.
                </p>
              </button>
            </div>

            {/* Active Order Spotlight Banner */}
            {orders[0] && (
              <div className="bg-card border border-border rounded-2xl p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand-500">
                      Most Recent Purchase
                    </span>
                    <h2 className="text-lg font-bold text-foreground mt-0.5">
                      Order {orders[0].orderNumber}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Placed on {formatDate(orders[0].createdAt)} • Total: {formatCurrency(orders[0].totalAmount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${
                        orders[0].status === "DELIVERED"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                      }`}
                    >
                      {orders[0].status}
                    </span>
                    <button
                      onClick={() => {
                        setActiveTab("chat");
                        handleSendMessage(`Where is my order ${orders[0].orderNumber}?`);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>Ask AI to Track</span>
                    </button>
                  </div>
                </div>

                {/* Items in this order */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {orders[0].items?.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center gap-3"
                    >
                      <img
                        src={item.product?.imageUrl || "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=100"}
                        alt={item.product?.name}
                        className="w-12 h-12 rounded-lg object-cover bg-background border border-border"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-foreground truncate">{item.product?.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          Qty: {item.quantity} • {formatCurrency(item.unitPrice)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ORDERS */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
              <div>
                <h2 className="text-lg font-bold text-foreground">Order History ({orders.length})</h2>
                <p className="text-xs text-muted-foreground">
                  View and manage all purchases associated with {user?.email}.
                </p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search orders or items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-card border border-border text-xs focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-card border border-border rounded-2xl p-5 hover:border-brand-500/40 transition shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{order.orderNumber}</span>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                            order.status === "DELIVERED"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : order.status === "SHIPPED"
                              ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                              : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Placed on {formatDate(order.createdAt)} • Total: {formatCurrency(order.totalAmount)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setActiveTab("chat");
                          handleSendMessage(`I would like help with order ${order.orderNumber}`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-muted hover:bg-accent text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Get AI Help</span>
                      </button>
                    </div>
                  </div>

                  {/* Tracking details */}
                  {order.trackingNumber && (
                    <div className="mt-3 py-2 px-3 rounded-xl bg-muted/30 text-xs flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-brand-400" />
                        <span>
                          Carrier: <strong>{order.carrier || "FedEx Express"}</strong> • Tracking:{" "}
                          <span className="font-mono text-brand-300 font-semibold">{order.trackingNumber}</span>
                        </span>
                      </div>
                      {order.deliveredAt && (
                        <span className="text-emerald-400 font-medium text-[11px]">
                          Delivered on {formatDate(order.deliveredAt)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Items List */}
                  <div className="mt-3 space-y-2">
                    {order.items?.map((it: any) => (
                      <div key={it.id} className="flex items-center justify-between text-xs py-1.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={it.product?.imageUrl || "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=100"}
                            alt={it.product?.name}
                            className="w-10 h-10 rounded-lg object-cover bg-background border border-border"
                          />
                          <div>
                            <div className="font-semibold text-foreground">{it.product?.name}</div>
                            <div className="text-[11px] text-muted-foreground">Qty: {it.quantity}</div>
                          </div>
                        </div>
                        <div className="text-right font-semibold text-foreground">
                          {formatCurrency(it.unitPrice)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: RETURNS */}
        {activeTab === "returns" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-lg font-bold text-foreground">Returns & Exchanges</h2>
                <p className="text-xs text-muted-foreground">
                  Track active return requests and download pre-paid shipping labels.
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveTab("chat");
                  handleSendMessage("I want to start a return for my delivered order.");
                }}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-xs transition flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Start Return with AI</span>
              </button>
            </div>

            {returns.length === 0 ? (
              <div className="p-12 text-center bg-card border border-border rounded-2xl">
                <RotateCcw className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <h3 className="text-sm font-bold text-foreground">No Returns on Record</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  You do not have any open return requests. Eligible items can be returned within 30 days of delivery.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {returns.map((ret) => (
                  <div
                    key={ret.id}
                    className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{ret.returnNumber}</span>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                            ret.status === "REFUNDED"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : ret.status === "APPROVED"
                              ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                              : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {ret.status}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Reason: <span className="font-medium text-foreground">{ret.reason}</span> • Refund Amount:{" "}
                        <strong className="text-emerald-400">{formatCurrency(ret.refundAmount)}</strong>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Requested on {formatDate(ret.createdAt)} • Associated Order: {ret.order?.orderNumber || "ORD-9821"}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedReturnLabel(ret)}
                        className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-xs transition flex items-center gap-2 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>View Return Label</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: REFUNDS & BILLING */}
        {activeTab === "refunds" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">Refunds & Billing History</h2>
              <p className="text-xs text-muted-foreground">
                Verified payment authorizations, transactions, and completed refunds.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-card border border-border">
                <div className="text-xs text-muted-foreground font-medium">Total Lifetime Purchases</div>
                <div className="text-2xl font-bold text-foreground mt-1">{formatCurrency(totalSpent)}</div>
                <div className="text-[11px] text-muted-foreground mt-1">Across {orders.length} orders</div>
              </div>

              <div className="p-5 rounded-2xl bg-card border border-border">
                <div className="text-xs text-muted-foreground font-medium">Total Processed Refunds</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1">
                  {formatCurrency(returns.reduce((acc, r) => acc + (r.status === "REFUNDED" ? r.refundAmount : 0), 0))}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">Credited to original payment method</div>
              </div>

              <div className="p-5 rounded-2xl bg-card border border-border">
                <div className="text-xs text-muted-foreground font-medium">Payment Protection</div>
                <div className="text-sm font-bold text-foreground mt-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>256-Bit SSL Encrypted</span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">Zero unauthorized charge liability</div>
              </div>
            </div>

            {/* Billing Transactions List */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-xs">
              <h3 className="font-bold text-sm text-foreground mb-3">Transaction Receipts</h3>
              <div className="space-y-3">
                {orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3.5 rounded-xl bg-muted/30 border border-border/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-foreground">Order Payment — {ord.orderNumber}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Credit Card ending in 4242 • {formatDateTime(ord.createdAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-foreground">{formatCurrency(ord.totalAmount)}</div>
                      <span className="text-[10px] text-emerald-400 font-semibold">PAID</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: 24/7 AI CHAT */}
        {activeTab === "chat" && (
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[75vh]">
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-muted/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-xs">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm flex items-center gap-2">
                    <span>NovaMart AI Support Assistant</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                      ONLINE
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Connected to Customer Profile ({user?.name})
                  </div>
                </div>
              </div>

              {conversationStatus === "NEEDS_HUMAN" && (
                <span className="text-xs px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30 flex items-center gap-1.5 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Escalated to Human Agent</span>
                </span>
              )}
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
              {messages
                .filter((msg) => msg.senderType !== "SYSTEM")
                .map((msg) => {
                const isUser = msg.senderType === "CUSTOMER";
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                        isUser
                          ? "bg-brand-600 text-white shadow-xs"
                          : msg.senderType === "AGENT"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-muted border border-border text-brand-400"
                      }`}
                    >
                      {isUser ? "You" : msg.senderType === "AGENT" ? "Agent" : <Bot className="w-4 h-4" />}
                    </div>

                    <div className={`max-w-[85%] sm:max-w-xl space-y-1.5`}>
                      <div className="flex items-center gap-2 text-[11px] px-1">
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          {isUser ? user?.name : msg.senderName || "NovaMart Assistant"}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">•</span>
                        <span className="text-slate-700 dark:text-slate-300 font-bold">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      <div
                        className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                          isUser
                            ? "bg-brand-600 text-white rounded-tr-xs shadow-xs font-bold"
                            : msg.senderType === "AGENT"
                            ? "bg-emerald-100 dark:bg-emerald-950/70 border-2 border-emerald-500 dark:border-emerald-500/50 text-emerald-950 dark:text-emerald-50 rounded-tl-xs shadow-xs font-bold"
                            : "bg-muted/60 border border-border text-foreground rounded-tl-xs shadow-xs font-medium"
                        }`}
                      >
                        {msg.content?.replace(/#{1,6}\s*/g, "").replace(/\*+/g, "")}
                      </div>

                      {/* Tool Calls inspection badge */}
                      {msg.toolCalls && (
                        <div className="text-[10px] px-2.5 py-1 rounded-md bg-brand-500/10 text-brand-400 border border-brand-500/20 inline-flex items-center gap-1.5 mt-1 font-mono">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Autonomous tool verified: getMyOrders</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isAiThinking && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-muted border border-border text-brand-400 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-3.5 rounded-2xl bg-muted/60 border border-border rounded-tl-xs flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" />
                    <span>Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Prompt Suggestion Chips */}
            <div className="px-4 py-2 border-t border-border/60 bg-muted/20 flex flex-wrap gap-2">
              <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1 my-auto">
                <Sparkles className="w-3 h-3 text-amber-300" /> Suggestions:
              </span>
              {promptSuggestions.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(sug.text)}
                  className="text-xs px-3 py-1 rounded-full bg-card hover:bg-accent border border-border text-foreground transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{sug.label}</span>
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-border bg-card">
              {attachedFile && (
                <div className="mb-2 px-3 py-1.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs flex items-center justify-between text-brand-300">
                  <span className="truncate">📎 Attached: {attachedFile.name}</span>
                  <button onClick={() => setAttachedFile(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,.pdf"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="p-2.5 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition border border-border cursor-pointer"
                  title="Upload receipt or item photo"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  placeholder="Ask a question about orders, returns, or billing..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-muted/60 border border-border text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
                />

                <button
                  type="submit"
                  disabled={!inputMessage.trim() && !attachedFile}
                  className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 6: PAST CONVERSATIONS */}
        {activeTab === "conversations" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">Support Conversation History</h2>
              <p className="text-xs text-muted-foreground">
                Transcripts of all support interactions logged under {user?.email}.
              </p>
            </div>

            {pastConversations.length === 0 ? (
              <div className="p-12 text-center bg-card border border-border rounded-2xl">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <h3 className="text-sm font-bold text-foreground">No Past Conversations</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Start your first chat with our 24/7 assistant in the AI Chat tab.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pastConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="p-5 rounded-2xl bg-card border border-border hover:border-brand-500/40 transition shadow-xs flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{conv.conversationNumber || conv.id}</span>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                            conv.status === "RESOLVED"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                          }`}
                        >
                          {conv.status}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {conv.messages?.length || 0} messages • Updated {formatDateTime(conv.updatedAt)}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setConversationId(conv.id);
                        setMessages(conv.messages || []);
                        setActiveTab("chat");
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-muted hover:bg-accent text-xs font-semibold transition cursor-pointer"
                    >
                      Open Chat →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 7: NOTIFICATIONS */}
        {activeTab === "notifications" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">Account Notifications ({notifications.length})</h2>
              <p className="text-xs text-muted-foreground">
                Live delivery alerts, return approvals, and ticket updates. Click any notification to view details.
              </p>
            </div>

            {notifications.length === 0 ? (
              <div className="p-12 text-center bg-card border border-border rounded-2xl">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <h3 className="text-sm font-bold text-foreground">No Notifications</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  You are all caught up with your latest order and support updates.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => setSelectedCustomerNotif(n)}
                    className="p-5 rounded-2xl bg-card border border-border shadow-xs flex items-start gap-4 hover:border-brand-500/50 hover:bg-accent/40 transition cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-brand-500/15 text-brand-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition">
                      {n.type === "ORDER" ? (
                        <Package className="w-4 h-4 text-indigo-400" />
                      ) : n.type === "RETURN" ? (
                        <RotateCcw className="w-4 h-4 text-amber-400" />
                      ) : n.type === "EMAIL" ? (
                        <Mail className="w-4 h-4 text-blue-400" />
                      ) : (
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs text-foreground group-hover:text-brand-400 transition">
                            {n.title}
                          </h4>
                          {n.status && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">
                              {n.status}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">{formatDate(n.date)}</span>
                      </div>
                      {n.subtitle && (
                        <div className="text-[11px] font-medium text-brand-400/90 mt-0.5">
                          {n.subtitle}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
                    </div>
                    <div className="shrink-0 my-auto text-muted-foreground group-hover:text-brand-400 transition">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Selected Customer Notification Detail Modal */}
        {selectedCustomerNotif && (
          <NotificationDetailModal
            notification={selectedCustomerNotif}
            onClose={() => setSelectedCustomerNotif(null)}
            onNavigate={(t) => setActiveTab(t as CustomerTab)}
          />
        )}

        {/* TAB 8: ACCOUNT & PREFERENCES */}
        {activeTab === "account" && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-lg font-bold text-foreground">Account & Notification Settings</h2>
              <p className="text-xs text-muted-foreground">
                Manage your profile information and email preference toggles.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-foreground">Loyalty Status: {currentPerspective?.tier}</h3>
              <p className="text-xs text-muted-foreground">
                As a valued {currentPerspective?.tier} member, you enjoy automated return label generation, prioritized support queue, and extended return windows.
              </p>

              <div className="pt-4 border-t border-border/80 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-xs text-foreground">Email Notifications</div>
                  <div className="text-[11px] text-muted-foreground">
                    Receive tracking alerts and return authorization updates via email.
                  </div>
                </div>
                <button
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    emailNotifications ? "bg-brand-600" : "bg-muted"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      emailNotifications ? "right-1" : "left-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Printable FedEx Return Label Modal */}
      {selectedReturnLabel && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-brand-500" />
                <h3 className="font-bold text-base text-foreground">Prepaid Return Label</h3>
              </div>
              <button
                onClick={() => setSelectedReturnLabel(null)}
                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Label Preview Card */}
            <div className="p-5 bg-white text-slate-900 rounded-2xl border-2 border-dashed border-slate-300 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between font-bold text-sm border-b pb-2">
                <span>FedEx Ground Return</span>
                <span>RMA: {selectedReturnLabel.returnNumber}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block">SHIP FROM:</span>
                  <strong>{user?.name}</strong>
                  <div>100 Market Street</div>
                  <div>San Francisco, CA 94105</div>
                </div>
                <div>
                  <span className="text-slate-500 block">SHIP TO:</span>
                  <strong>NovaMart Logistics Center</strong>
                  <div>750 Commerce Way</div>
                  <div>Louisville, KY 40218</div>
                </div>
              </div>

              <div className="pt-2 text-center border-t">
                <div className="text-[10px] text-slate-500">TRACKING NUMBER</div>
                <div className="text-base font-bold tracking-widest my-1">
                  TRK-FDX-982144721
                </div>
                <div className="h-10 bg-slate-200 rounded flex items-center justify-center text-[10px] text-slate-600 font-bold">
                  ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedReturnLabel(null)}
                className="px-4 py-2 rounded-xl bg-muted hover:bg-accent text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Shipping Label</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
