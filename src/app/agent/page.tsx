"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "@/components/providers/SessionProvider";
import { DEMO_USERS } from "@/lib/auth/demo-users";
import {
  Inbox,
  Headphones,
  Bot,
  User,
  Sparkles,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  Search,
  Filter,
  ArrowRight,
  Check,
  Edit3,
  X,
  RotateCcw,
  CreditCard,
  Package,
  Layers,
  Crown,
  FileText,
  UserCheck,
  RefreshCw,
  ExternalLink,
  Loader2,
  BookOpen,
  Sliders,
  BarChart3,
  Bell,
  Ticket,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Award,
  Zap,
  MessageSquare,
  Lock,
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  getPriorityBadgeVariant,
  getStatusBadgeVariant,
} from "@/lib/utils";
import { CopilotInsight } from "@/types";

type AgentTab = "inbox" | "tickets" | "customers" | "knowledge" | "metrics";

export default function SupportAgentWorkspacePage() {
  const { user, currentPerspective } = useSession();
  const [activeTab, setActiveTab] = useState<AgentTab>("inbox");

  if (user?.role === "ADMIN") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background text-foreground min-h-[60vh]">
        <div className="max-w-md w-full p-8 rounded-3xl bg-card border border-border shadow-2xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground">Agent Workspace Restricted</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You are signed in as <strong>{user.name}</strong> (Operations Lead & Admin). Admins oversee operations from the Command Center and do not handle front-line agent queues directly.
            </p>
          </div>
          <button
            onClick={() => {
              window.history.pushState({}, "", "/admin");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
            className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition shadow-xs cursor-pointer"
          >
            Go to Admin Command Center
          </button>
        </div>
      </div>
    );
  }

  // Inbox & Conversations State
  const [conversations, setConversations] = useState<any[]>([]);
  const [inboxFilter, setInboxFilter] = useState<string>("ALL"); // ALL, NEEDS_HUMAN, AI_HANDLING, AGENT_ACTIVE, RESOLVED
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Selected Conversation State
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedConv, setSelectedConv] = useState<any | null>(null);
  const [copilot, setCopilot] = useState<CopilotInsight | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isTakingOver, setIsTakingOver] = useState(false);

  // Tickets List State
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketFilter, setTicketFilter] = useState("ALL");
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [adminAlert, setAdminAlert] = useState<any | null>(null);
  const [newTicketData, setNewTicketData] = useState({
    title: "",
    description: "",
    priority: "HIGH",
    category: "BILLING",
  });

  // Customer Directory State
  const [customerDirectory, setCustomerDirectory] = useState<any[]>([]);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  // Knowledge Base State
  const [kbArticles, setKbArticles] = useState<any[]>([]);
  const [kbSearch, setKbSearch] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const url = new URL("/api/agent/conversations", window.location.origin);
      if (inboxFilter !== "ALL") url.searchParams.set("filter", inboxFilter);
      if (priorityFilter !== "ALL") url.searchParams.set("priority", priorityFilter);
      if (searchQuery) url.searchParams.set("search", searchQuery);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations || []);
        if (!selectedConvId && data.conversations.length > 0) {
          selectConversation(data.conversations[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to fetch conversations:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/agent/tickets");
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets || []);
      }
    } catch (e) {
      console.error("Failed to fetch tickets:", e);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/agent/customers");
      const data = await res.json();
      if (data.success) {
        setCustomerDirectory(data.customers || []);
      }
    } catch (e) {
      console.error("Failed to fetch customers:", e);
    }
  };

  const fetchKbArticles = async () => {
    try {
      const res = await fetch("/api/admin/knowledge");
      const data = await res.json();
      if (data.success) {
        setKbArticles(data.articles || []);
      }
    } catch (e) {
      console.error("Failed to fetch KB articles:", e);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchTickets();
    fetchCustomers();
    fetchKbArticles();
  }, [activeTab, inboxFilter, priorityFilter, searchQuery]);

  const selectedConvIdRef = useRef(selectedConvId);
  useEffect(() => {
    selectedConvIdRef.current = selectedConvId;
  }, [selectedConvId]);

  // Real-time EventSource synchronization for Agent Inbox & Tickets
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource("/api/events?channel=*");
      es.onmessage = (e) => {
        try {
          const evt = JSON.parse(e.data);
          if (
            evt.type === "NEW_MESSAGE" ||
            evt.type === "STATUS_CHANGE" ||
            evt.type === "TICKET_CREATED" ||
            evt.type === "TICKET_UPDATED" ||
            evt.type === "AGENT_TAKEOVER"
          ) {
            const currentConvId = selectedConvIdRef.current;
            const incomingMsg = evt.payload?.message;
            const targetConvId = evt.payload?.conversationId || evt.payload?.ticket?.conversationId;

            // Instant status sync for tickets and conversations
            if (evt.payload?.status === "RESOLVED") {
              const targetTicketId = evt.payload?.ticket?.id;
              const targetCustomerId = evt.payload?.ticket?.customerId || evt.payload?.customerId;
              setTickets((prev) =>
                prev.map((t) => {
                  if (targetTicketId && t.id === targetTicketId) return { ...t, status: "RESOLVED" };
                  if (targetConvId && t.conversationId === targetConvId) return { ...t, status: "RESOLVED" };
                  if (targetCustomerId && t.customerId === targetCustomerId) return { ...t, status: "RESOLVED" };
                  return t;
                })
              );
              setConversations((prev) =>
                prev.map((c) => {
                  if (targetConvId && c.id === targetConvId) return { ...c, status: "RESOLVED" };
                  if (targetCustomerId && c.customerId === targetCustomerId) return { ...c, status: "RESOLVED" };
                  return c;
                })
              );
              if (currentConvId && currentConvId === targetConvId) {
                setSelectedConv((prev: any) => (prev ? { ...prev, status: "RESOLVED" } : prev));
              }
            }

            // 1. Instant 0ms in-memory UI reflection for incoming message
            if (evt.type === "NEW_MESSAGE" && incomingMsg && targetConvId) {
              // Append to chat stream immediately if this is the active conversation
              if (currentConvId === targetConvId) {
                setSelectedConv((prev: any) => {
                  if (!prev || prev.id !== targetConvId) return prev;
                  if (prev.messages?.some((m: any) => m.id === incomingMsg.id)) return prev;
                  return {
                    ...prev,
                    messages: [...(prev.messages || []), incomingMsg],
                  };
                });
              }

              // Update conversation list preview instantly
              setConversations((prev) => {
                const updated = prev.map((c) => {
                  if (c.id === targetConvId) {
                    return {
                      ...c,
                      updatedAt: new Date().toISOString(),
                      messages: [incomingMsg],
                      summary: incomingMsg.content ? incomingMsg.content.slice(0, 80) : c.summary,
                    };
                  }
                  return c;
                });
                return updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
              });

              // If no conversation was active yet, select this one
              if (!currentConvId) {
                selectConversation(targetConvId);
              }
            }

            // 2. Fetch fresh background data
            fetchConversations();
            fetchTickets();
            if (currentConvId && targetConvId === currentConvId && evt.type !== "NEW_MESSAGE") {
              selectConversation(currentConvId);
            }
          } else if (evt.type === "ADMIN_DISPATCH") {
            setAdminAlert(evt.payload);
          }
        } catch {}
      };
    } catch {}
    return () => {
      if (es) es.close();
    };
  }, []);

  const selectConversation = async (convId: string) => {
    setSelectedConvId(convId);
    try {
      const res = await fetch(`/api/agent/conversations/${convId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedConv(data.conversation);
        setCopilot(data.copilotInsights);
      }
    } catch (e) {
      console.error("Failed to load conversation details:", e);
    }
  };

  const handleTakeOver = async () => {
    if (!selectedConvId) return;
    setIsTakingOver(true);
    try {
      const res = await fetch(`/api/agent/conversations/${selectedConvId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TAKE_OVER" }),
      });
      const data = await res.json();
      if (data.success) {
        selectConversation(selectedConvId);
        fetchConversations();
      }
    } catch (e) {
      console.error("Take over failed:", e);
    } finally {
      setIsTakingOver(false);
    }
  };

  const handleResolveConversation = async (convId?: string) => {
    const id = convId || selectedConvId;
    if (!id) return;

    // Instant optimistic 0ms UI update
    setSelectedConv((prev: any) => (prev && prev.id === id ? { ...prev, status: "RESOLVED" } : prev));
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, status: "RESOLVED" } : c)));
    setTickets((prev) =>
      prev.map((t) => (t.conversationId === id || (selectedConv && t.customerId === selectedConv.customerId) ? { ...t, status: "RESOLVED" } : t))
    );

    try {
      const res = await fetch(`/api/agent/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESOLVE" }),
      });
      const data = await res.json();
      if (data.success) {
        await selectConversation(id);
        await fetchConversations();
        await fetchTickets();
      }
    } catch (e) {
      console.error("Resolve conversation error:", e);
    }
  };

  const handleHandoverToAi = async (convId?: string) => {
    const id = convId || selectedConvId;
    if (!id) return;
    try {
      const res = await fetch(`/api/agent/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "HANDOVER_AI" }),
      });
      const data = await res.json();
      if (data.success) {
        await selectConversation(id);
        await fetchConversations();
        await fetchTickets();
      }
    } catch (e) {
      console.error("Handover to AI error:", e);
    }
  };

  const handleSendAgentReply = async (customMessage?: string) => {
    const text = customMessage || replyText;
    if (!text.trim() || !selectedConvId) return;

    // Instant optimistic reflection in agent chat
    const tempMsgId = `agent-temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempMsgId,
      conversationId: selectedConvId,
      senderType: "AGENT",
      senderName: "Alex Rivera",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setSelectedConv((prev: any) =>
      prev ? { ...prev, messages: [...(prev.messages || []), optimisticMsg] } : prev
    );
    setReplyText("");
    setIsSending(true);

    try {
      const res = await fetch(`/api/agent/conversations/${selectedConvId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.message) {
          setSelectedConv((prev: any) =>
            prev
              ? {
                  ...prev,
                  messages: prev.messages.map((m: any) => (m.id === tempMsgId ? data.message : m)),
                }
              : prev
          );
        }
        fetchConversations();
      }
    } catch (e) {
      console.error("Agent send reply failed:", e);
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
    // Instant optimistic 0ms UI update
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status } : t)));
    if (status === "RESOLVED") {
      const matchingTicket = tickets.find((t) => t.id === ticketId);
      setConversations((prev) =>
        prev.map((c) => {
          if (matchingTicket && (c.id === matchingTicket.conversationId || c.customerId === matchingTicket.customerId)) {
            return { ...c, status: "RESOLVED" };
          }
          return c;
        })
      );
      if (selectedConvId && matchingTicket && (selectedConvId === matchingTicket.conversationId || selectedConv?.customerId === matchingTicket.customerId)) {
        setSelectedConv((prev: any) => (prev ? { ...prev, status: "RESOLVED" } : prev));
      }
    }

    try {
      const res = await fetch(`/api/agent/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchTickets();
        await fetchConversations();
        if (selectedConvId) await selectConversation(selectedConvId);
      }
    } catch (e) {
      console.error("Update ticket status error:", e);
    }
  };

  const handleOpenTicketChat = async (tck: any) => {
    try {
      setLoading(true);
      // Determine target conversation ID
      let targetConvId = tck.conversationId;

      if (!targetConvId && tck.customerId) {
        // Look in currently loaded conversations
        const match = conversations.find((c) => c.customerId === tck.customerId);
        if (match) {
          targetConvId = match.id;
        } else {
          // Fetch customer's conversations from API
          const res = await fetch(`/api/agent/conversations?search=${encodeURIComponent(tck.customer?.user?.name || tck.customerId)}`);
          const data = await res.json();
          if (data.success && data.conversations && data.conversations.length > 0) {
            targetConvId = data.conversations[0].id;
          }
        }
      }

      // If still no conversation exists, create a dedicated one for this ticket
      if (!targetConvId && tck.customerId) {
        const createRes = await fetch("/api/agent/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerId: tck.customerId,
            ticketId: tck.id,
            subject: tck.title || `Support Ticket ${tck.ticketNumber}`,
          }),
        });
        const createData = await createRes.json();
        if (createData.success && createData.conversation) {
          targetConvId = createData.conversation.id;
        }
      }

      if (targetConvId) {
        // Auto take over the conversation so human agent is directly active
        try {
          await fetch(`/api/agent/conversations/${targetConvId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "TAKE_OVER" }),
          });
        } catch {}

        // Switch to inbox tab and select conversation
        setActiveTab("inbox");
        await selectConversation(targetConvId);
        await fetchConversations();
      } else {
        setActiveTab("inbox");
      }
    } catch (err) {
      console.error("Failed to open ticket chat:", err);
      setActiveTab("inbox");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketData.title.trim()) return;

    try {
      const res = await fetch("/api/agent/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newTicketData,
          customerId: selectedConv?.customerId || "cust-01",
          conversationId: selectedConvId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateTicketModal(false);
        setNewTicketData({ title: "", description: "", priority: "HIGH", category: "BILLING" });
        fetchTickets();
        if (selectedConvId) selectConversation(selectedConvId);
      }
    } catch (e) {
      console.error("Create ticket error:", e);
    }
  };

  const needsHumanCount = conversations.filter((c) => c.status === "NEEDS_HUMAN").length;
  const aiHandlingCount = conversations.filter((c) => c.status === "AI_HANDLING").length;
  const agentActiveCount = conversations.filter((c) => c.status === "AGENT_ACTIVE").length;

  return (
    <div className="flex-1 flex flex-col bg-background text-foreground">
      {/* 1. Agent Workspace Header Banner */}
      <div className="border-b border-border/80 bg-gradient-to-r from-card via-background to-card px-4 sm:px-8 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={
                  user?.avatar ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80"
                }
                alt="Alex Rivera"
                className="w-14 h-14 rounded-2xl object-cover ring-4 ring-emerald-500/20 shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-background animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  {user?.name || "Alex Rivera"}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Tier 2 Support Specialist
                </span>
                <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
                  Agent Workspace
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3">
                <span>Shift Status: Active</span>
                <span>•</span>
                <span className="text-amber-400 font-semibold">{needsHumanCount} Escalations Pending</span>
                <span>•</span>
                <span>{tickets.filter((t) => t.status !== "RESOLVED").length} Open Tickets</span>
              </p>
            </div>
          </div>

          {/* Quick Metrics Pills */}
          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-card border border-border text-center shadow-xs">
              <div className="text-[10px] text-muted-foreground uppercase font-bold">First Response</div>
              <div className="text-xs font-bold text-emerald-400 mt-0.5">38s avg</div>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-card border border-border text-center shadow-xs">
              <div className="text-[10px] text-muted-foreground uppercase font-bold">AI Resolution</div>
              <div className="text-xs font-bold text-brand-400 mt-0.5">84.2%</div>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-card border border-border text-center shadow-xs">
              <div className="text-[10px] text-muted-foreground uppercase font-bold">CSAT Score</div>
              <div className="text-xs font-bold text-amber-400 mt-0.5">4.9 / 5.0 ★</div>
            </div>
          </div>
        </div>

        {/* Admin Operational Directive Alert Banner */}
        {adminAlert && (
          <div className="max-w-7xl mx-auto mt-4 p-4 rounded-2xl bg-gradient-to-r from-rose-950/90 via-red-950/70 to-rose-950/90 border border-rose-500/40 shadow-xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase bg-rose-500 text-white shadow-xs">
                    {adminAlert.priority || "DIRECTIVE"}
                  </span>
                  <span className="font-bold text-xs text-rose-200">
                    {adminAlert.title || "Admin Directive"} • From {adminAlert.sender || "Operations Lead"}
                  </span>
                </div>
                <p className="text-xs text-rose-100 font-medium mt-0.5">
                  {adminAlert.message}
                </p>
              </div>
            </div>
            <button
              onClick={() => setAdminAlert(null)}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-semibold cursor-pointer shrink-0"
            >
              Acknowledge
            </button>
          </div>
        )}

        {/* 2. Workspace Tabs Navigation */}
        <div className="max-w-7xl mx-auto mt-5 flex overflow-x-auto gap-1 border-b border-border/60 pb-px scrollbar-none">
          {[
            { id: "inbox", label: "Real-Time Inbox & Chat", icon: Inbox, badge: needsHumanCount > 0 ? needsHumanCount : null, alert: needsHumanCount > 0 },
            { id: "tickets", label: "Support Tickets Queue", icon: Ticket, badge: tickets.length },
            { id: "customers", label: "Customer Lookup", icon: UserCheck },
            { id: "knowledge", label: "Knowledge Base", icon: BookOpen },
            { id: "metrics", label: "Performance Metrics", icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AgentTab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border-b-2 ${
                  isActive
                    ? "border-emerald-500 text-emerald-400 bg-emerald-500/10 font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/40"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-emerald-400" : ""}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge !== null && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      tab.alert
                        ? "bg-amber-500 text-white animate-pulse"
                        : isActive
                        ? "bg-emerald-500 text-white"
                        : "bg-muted text-muted-foreground"
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
        {/* TAB 1: INBOX & AI COPILOT */}
        {activeTab === "inbox" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[78vh]">
            {/* Left: Queue Conversations List (4 cols) */}
            <div className="lg:col-span-4 bg-card border border-border rounded-2xl flex flex-col overflow-hidden shadow-sm">
              {/* Filter Tabs */}
              <div className="p-3 border-b border-border bg-muted/30 space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-background border border-border text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="flex gap-1 overflow-x-auto pb-1">
                  {[
                    { id: "ALL", label: "All" },
                    { id: "NEEDS_HUMAN", label: "Escalated", count: needsHumanCount },
                    { id: "AGENT_ACTIVE", label: "Mine", count: agentActiveCount },
                    { id: "AI_HANDLING", label: "AI Active", count: aiHandlingCount },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setInboxFilter(f.id)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer ${
                        inboxFilter === f.id
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {f.label} {f.count !== undefined && f.count > 0 && `(${f.count})`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto divide-y divide-border/60">
                {conversations.map((conv) => {
                  const isSelected = selectedConvId === conv.id;
                  const isNeedsHuman = conv.status === "NEEDS_HUMAN";
                  return (
                    <button
                      key={conv.id}
                      onClick={() => selectConversation(conv.id)}
                      className={`w-full text-left p-3.5 transition flex flex-col gap-1.5 cursor-pointer ${
                        isSelected
                          ? "bg-emerald-500/10 border-l-4 border-l-emerald-500"
                          : "hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-bold text-xs text-foreground truncate">
                            {conv.customer?.user?.name || "Customer"}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                              conv.customer?.vipTier === "PLATINUM"
                                ? "bg-purple-500/15 text-purple-400"
                                : conv.customer?.vipTier === "GOLD"
                                ? "bg-amber-500/15 text-amber-400"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {conv.customer?.vipTier || "STANDARD"}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {formatRelativeTime(conv.updatedAt)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground truncate font-mono text-[10px]">
                          {conv.conversationNumber}
                        </span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            isNeedsHuman
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse"
                              : conv.status === "AGENT_ACTIVE"
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-blue-500/15 text-blue-400"
                          }`}
                        >
                          {isNeedsHuman ? "⚠️ Needs Agent" : conv.status}
                        </span>
                      </div>

                      {conv.summary && (
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                          {conv.summary}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Center: Live 3-Party Chat Stream (5 cols) */}
            <div className="lg:col-span-5 bg-card border border-border rounded-2xl flex flex-col overflow-hidden shadow-sm">
              {/* Chat Header & Take Over Bar */}
              <div className="p-3.5 border-b border-border bg-muted/30 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs flex items-center gap-2 text-foreground">
                    <span>{selectedConv?.customer?.user?.name || "Customer Chat"}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      ({selectedConv?.conversationNumber || ""})
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Customer ID: {selectedConv?.customerId} • Status: {selectedConv?.status}
                  </div>
                </div>

                {selectedConv?.status === "NEEDS_HUMAN" ? (
                  <button
                    onClick={handleTakeOver}
                    disabled={isTakingOver}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer animate-pulse"
                  >
                    <Headphones className="w-3.5 h-3.5" />
                    <span>{isTakingOver ? "Joining..." : "Take Over Chat"}</span>
                  </button>
                ) : selectedConv?.status === "AGENT_ACTIVE" ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1">
                      <UserCheck className="w-3 h-3" />
                      <span>Agent Connected</span>
                    </span>
                    <button
                      onClick={() => handleResolveConversation()}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1 cursor-pointer"
                      title="Resolve issue and automatically hand back customer inquiries to the AI"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Resolve & Return to AI</span>
                    </button>
                  </div>
                ) : selectedConv?.status === "RESOLVED" ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Resolved • AI Auto-Active</span>
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Message Stream */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
                {selectedConv?.messages?.map((msg: any) => {
                  const isAgent = msg.senderType === "AGENT";
                  const isCustomer = msg.senderType === "CUSTOMER";
                  const isAi = msg.senderType === "AI";
                  const isSystem = msg.senderType === "SYSTEM";

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="text-center my-2">
                        <span className="text-[10px] px-3 py-1 rounded-full bg-muted border border-border text-muted-foreground font-medium">
                          🔔 {msg.content}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2.5 ${isAgent ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                          isAgent
                            ? "bg-emerald-600 text-white shadow-xs"
                            : isCustomer
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-muted border border-border text-brand-400"
                        }`}
                      >
                        {isAgent ? "AR" : isCustomer ? "C" : <Bot className="w-3.5 h-3.5" />}
                      </div>

                      <div className="max-w-[85%] space-y-1">
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground px-1">
                          <span className="font-bold text-foreground">
                            {isAgent ? "Alex Rivera (You)" : isCustomer ? msg.senderName : "AI Assistant"}
                          </span>
                          <span>•</span>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>

                        <div
                          className={`p-3 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
                            isAgent
                              ? "bg-emerald-600 text-white font-medium rounded-tr-xs"
                              : isCustomer
                              ? "bg-muted/80 border border-border text-foreground rounded-tl-xs"
                              : "bg-brand-950/30 border border-brand-500/20 text-foreground rounded-tl-xs"
                          }`}
                        >
                          {msg.content?.replace(/#{1,6}\s*/g, "").replace(/\*+/g, "")}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Agent Reply Input Box */}
              <div className="p-3 border-t border-border bg-card">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendAgentReply();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder={
                      selectedConv?.status === "AI_HANDLING"
                        ? "Take over or type to join conversation as Agent..."
                        : "Type reply to customer..."
                    }
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 py-2 px-3 rounded-xl bg-muted/60 border border-border text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim() || isSending}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Right: AI Support Copilot Panel (3 cols) */}
            <div className="lg:col-span-3 bg-card border border-border rounded-2xl p-4 flex flex-col overflow-y-auto space-y-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground pb-2 border-b border-border">
                <div className="w-6 h-6 rounded-lg bg-brand-500/15 text-brand-400 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                </div>
                <span>AI Support Copilot</span>
                <span className="text-[9px] ml-auto px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold">
                  ACTIVE
                </span>
              </div>

              {/* Intent & Confidence Card */}
              {copilot && (
                <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase">Detected Intent</span>
                    <span className="text-[10px] font-bold text-emerald-400">
                      {Math.round((copilot.confidence || 0.95) * 100)}% Conf
                    </span>
                  </div>
                  <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>{copilot.intent || "RETURN_REQUEST"}</span>
                  </div>
                </div>
              )}

              {/* 2-Sentence Conversation Summary */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-1.5">
                <div className="text-[11px] font-bold text-muted-foreground uppercase">Issue Summary</div>
                <p className="text-xs text-foreground leading-relaxed">
                  {copilot?.summary ||
                    "Customer inquiring about order status and return validation for recently delivered items."}
                </p>
              </div>

              {/* 1-Click Suggested Response with Accept Button */}
              {copilot?.suggestedReply && (
                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>Suggested Reply</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">Private</span>
                  </div>
                  <p className="text-xs text-emerald-100 italic leading-relaxed">
                    "{copilot.suggestedReply}"
                  </p>
                  <button
                    onClick={() => {
                      setReplyText(copilot.suggestedReply);
                    }}
                    className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Accept & Insert Suggestion</span>
                  </button>
                </div>
              )}

              {/* Recommended Next Actions */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-2">
                <div className="text-[11px] font-bold text-muted-foreground uppercase">Recommended Next Steps</div>
                <ul className="text-xs space-y-1.5 text-foreground">
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold">1.</span>
                    <span>Confirm order receipt and items condition</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold">2.</span>
                    <span>Issue prepaid return authorization (FedEx Ground)</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold">3.</span>
                    <span>Send confirmation email to customer address</span>
                  </li>
                </ul>
              </div>

              {/* Policy Warnings & Context Notes */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>VIP Policy Warning</span>
                </div>
                <p className="text-[11px] text-amber-200/80">
                  Customer has Gold VIP status: Return window extended to 45 days and return shipping fee waived.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SUPPORT TICKETS QUEUE */}
        {activeTab === "tickets" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">Support Tickets Queue ({tickets.length})</h2>
                <p className="text-xs text-muted-foreground">
                  Manage escalations, priorities, ticket assignments, and resolutions.
                </p>
              </div>
              <button
                onClick={() => setShowCreateTicketModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Support Ticket</span>
              </button>
            </div>

            <div className="space-y-3">
              {tickets.map((tck) => (
                <div
                  key={tck.id}
                  onClick={() => handleOpenTicketChat(tck)}
                  className="p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-brand-500/50 hover:bg-accent/40 transition cursor-pointer group"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-foreground group-hover:text-brand-400 transition">
                        {tck.ticketNumber}
                      </span>
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          tck.priority === "URGENT"
                            ? "bg-red-500/15 text-red-400 border border-red-500/30"
                            : tck.priority === "HIGH"
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                            : "bg-blue-500/15 text-blue-400"
                        }`}
                      >
                        {tck.priority}
                      </span>
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          tck.status === "RESOLVED"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {tck.status}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-400 border border-brand-500/20 font-medium flex items-center gap-1">
                        <MessageSquare className="w-2.5 h-2.5" />
                        Live Chat Available
                      </span>
                    </div>
                    <div className="font-semibold text-xs text-foreground">{tck.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{tck.description}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Customer: <strong>{tck.customer?.user?.name || "Customer"}</strong> • Created {formatDateTime(tck.createdAt)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenTicketChat(tck)}
                      className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer hover:shadow-brand-500/20"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Open Live Chat</span>
                    </button>

                    {tck.status !== "RESOLVED" ? (
                      <button
                        onClick={() => handleUpdateTicketStatus(tck.id, "RESOLVED")}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600/15 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 text-xs font-semibold shadow-xs transition flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark Resolved</span>
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <CheckCircle2 className="w-4 h-4" /> Resolved
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CUSTOMER LOOKUP */}
        {activeTab === "customers" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">Customer Directory & 360° Lookup</h2>
                <p className="text-xs text-muted-foreground">
                  Search customer accounts, loyalty tiers, lifetime order values, and support tickets.
                </p>
              </div>
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, email, VIP tier, or order #..."
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-card border border-border text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customerDirectory
                .filter(
                  (c) =>
                    !customerSearchQuery ||
                    c.user?.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
                    c.user?.email.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
                    c.vipTier.toLowerCase().includes(customerSearchQuery.toLowerCase())
                )
                .map((cust) => (
                  <div
                    key={cust.id}
                    className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:border-emerald-500/40 transition space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            cust.user?.avatar ||
                            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100"
                          }
                          alt={cust.user?.name}
                          className="w-10 h-10 rounded-xl object-cover ring-2 ring-emerald-500/20"
                        />
                        <div>
                          <div className="font-bold text-xs text-foreground">{cust.user?.name}</div>
                          <div className="text-[11px] text-muted-foreground">{cust.user?.email}</div>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          cust.vipTier === "PLATINUM"
                            ? "bg-purple-500/15 text-purple-400"
                            : cust.vipTier === "GOLD"
                            ? "bg-amber-500/15 text-amber-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {cust.vipTier} VIP
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">LIFETIME SPEND</span>
                        <strong className="text-foreground">{formatCurrency(cust.totalSpent)}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">TOTAL ORDERS</span>
                        <strong className="text-foreground">{cust.orders?.length || 0} purchases</strong>
                      </div>
                    </div>

                    {cust.orders?.[0] && (
                      <div className="text-[11px] p-2 rounded-lg bg-muted/40 text-muted-foreground truncate">
                        Last Order: <strong>{cust.orders[0].orderNumber}</strong> ({formatCurrency(cust.orders[0].totalAmount)})
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 4: KNOWLEDGE BASE SEARCH */}
        {activeTab === "knowledge" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">Internal Knowledge Base Assistant</h2>
                <p className="text-xs text-muted-foreground">
                  Instant reference for returns, refunds, warranty, and customer policy rules.
                </p>
              </div>
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search articles & guidelines..."
                  value={kbSearch}
                  onChange={(e) => setKbSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-card border border-border text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {kbArticles
                .filter(
                  (a) =>
                    !kbSearch ||
                    a.title.toLowerCase().includes(kbSearch.toLowerCase()) ||
                    a.content.toLowerCase().includes(kbSearch.toLowerCase())
                )
                .map((art) => (
                  <div key={art.id} className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-foreground">{art.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-semibold uppercase">
                        {art.category}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {art.content?.replace(/#{1,6}\s*/g, "").replace(/\*+/g, "")}
                    </p>
                    <div className="pt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Updated {formatDate(art.updatedAt)}</span>
                      <button
                        onClick={() => {
                          setReplyText((prev) => `${prev} As per our ${art.title} policy: ${art.content.slice(0, 100)}...`);
                          setActiveTab("inbox");
                        }}
                        className="text-emerald-400 hover:underline font-semibold cursor-pointer"
                      >
                        Insert in Reply →
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 5: PERFORMANCE METRICS */}
        {activeTab === "metrics" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">Alex Rivera — Performance Scorecard</h2>
              <p className="text-xs text-muted-foreground">
                Real-time tracking of resolution rates, SLA adherence, and customer satisfaction ratings.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
                <div className="text-xs text-muted-foreground font-semibold">Total Handled Today</div>
                <div className="text-2xl font-bold text-foreground mt-1">28</div>
                <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
                  <TrendingUp className="w-3.5 h-3.5" /> +14% vs team avg
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
                <div className="text-xs text-muted-foreground font-semibold">Avg Response Time</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1">38 sec</div>
                <div className="text-[11px] text-muted-foreground mt-1">SLA Target: &lt; 60 sec</div>
              </div>

              <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
                <div className="text-xs text-muted-foreground font-semibold">Customer CSAT</div>
                <div className="text-2xl font-bold text-amber-400 mt-1">4.9 / 5.0</div>
                <div className="text-[11px] text-muted-foreground mt-1">Based on 42 reviews</div>
              </div>

              <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
                <div className="text-xs text-muted-foreground font-semibold">AI Copilot Adoption</div>
                <div className="text-2xl font-bold text-brand-400 mt-1">94.1%</div>
                <div className="text-[11px] text-muted-foreground mt-1">Suggested replies accepted</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      {showCreateTicketModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base text-foreground">Create Support Escalation Ticket</h3>
              <button
                onClick={() => setShowCreateTicketModal(false)}
                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Ticket Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Expedited return approval for damaged smartwatch"
                  value={newTicketData.title}
                  onChange={(e) => setNewTicketData({ ...newTicketData, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-muted/60 border border-border text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Priority</label>
                <select
                  value={newTicketData.priority}
                  onChange={(e) => setNewTicketData({ ...newTicketData, priority: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-muted/60 border border-border text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent (Immediate SLA)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Description / Notes</label>
                <textarea
                  rows={3}
                  placeholder="Detailed notes for escalation..."
                  value={newTicketData.description}
                  onChange={(e) => setNewTicketData({ ...newTicketData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-muted/60 border border-border text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateTicketModal(false)}
                  className="px-4 py-2 rounded-xl bg-muted hover:bg-accent text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Create Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
