"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/components/providers/SessionProvider";
import {
  Shield,
  BarChart3,
  Bot,
  Activity,
  BookOpen,
  Mail,
  Users,
  Settings,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  ExternalLink,
  Plus,
  Edit2,
  Trash2,
  Eye,
  X,
  Lock,
  Zap,
  Ticket,
  Headphones,
  UserCheck,
  Check,
  Package,
  RotateCcw,
  Send,
  MessageSquare,
  Radio,
} from "lucide-react";
import { formatCurrency, formatDate, formatDateTime, formatRelativeTime } from "@/lib/utils";

type AdminTab =
  | "analytics"
  | "conversations"
  | "tickets"
  | "customers"
  | "agents"
  | "timeline"
  | "knowledge"
  | "emails"
  | "settings";

export default function AdminCommandCenterPage() {
  const { user } = useSession();
  const [activeTab, setActiveTab] = useState<AdminTab>("analytics");

  if (user?.role === "SUPPORT_AGENT") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background text-foreground min-h-[60vh]">
        <div className="max-w-md w-full p-8 rounded-3xl bg-card border border-border shadow-2xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground">Access Restricted</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You are signed in as <strong>{user.name}</strong> (Tier 2 Support Specialist). Support Agents do not have access to the Admin Command Center.
            </p>
          </div>
          <button
            onClick={() => {
              window.history.pushState({}, "", "/agent");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
            className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition shadow-xs cursor-pointer"
          >
            Go to Agent Workspace
          </button>
        </div>
      </div>
    );
  }

  // Analytics Data
  const [metrics, setMetrics] = useState<any | null>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [toolStats, setToolStats] = useState<any[]>([]);

  // Timeline Logs Data
  const [logs, setLogs] = useState<any[]>([]);
  const [actorFilter, setActorFilter] = useState("ALL");

  // Knowledge Base Data
  const [articles, setArticles] = useState<any[]>([]);
  const [kbSearch, setKbSearch] = useState("");
  const [editingArticle, setEditingArticle] = useState<any | null>(null);

  // Email Events Data
  const [emails, setEmails] = useState<any[]>([]);
  const [previewEmail, setPreviewEmail] = useState<any | null>(null);

  // All Conversations Data
  const [allConversations, setAllConversations] = useState<any[]>([]);
  const [inspectConv, setInspectConv] = useState<any | null>(null);

  // Tickets Data
  const [tickets, setTickets] = useState<any[]>([]);

  // Customers & Agents Data
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");

  // Settings State
  const [settings, setSettings] = useState({
    aiModel: "anthropic/claude-3.5-sonnet",
    apiKey: "",
    autoEscalateThreshold: 0.7,
    fallbackEnabled: true,
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Contact Human Agent / Staff Dispatch State
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchData, setDispatchData] = useState({
    agentName: "Alex Rivera",
    title: "Priority Queue Directive",
    priority: "HIGH",
    message: "",
  });
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);

  const handleSendDispatch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!dispatchData.message.trim()) return;
    setIsDispatching(true);
    try {
      const res = await fetch("/api/admin/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dispatchData),
      });
      const data = await res.json();
      if (data.success) {
        setDispatchSuccess(`Staff alert dispatched to ${dispatchData.agentName} in real-time!`);
        setDispatchData({
          agentName: "Alex Rivera",
          title: "Priority Queue Directive",
          priority: "HIGH",
          message: "",
        });
        setTimeout(() => {
          setShowDispatchModal(false);
          setDispatchSuccess(null);
        }, 2000);
        fetchTimeline();
      }
    } catch (e) {
      console.error("Dispatch error:", e);
    } finally {
      setIsDispatching(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchTimeline();
    fetchKnowledge();
    fetchEmails();
    fetchAllConversations();
    fetchTickets();
    fetchCustomers();
    fetchSettings();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/admin/analytics");
      const data = await res.json();
      if (data.success) {
        setMetrics(data.metrics);
        setCategoryBreakdown(data.categoryBreakdown || []);
        setTrendData(data.trendData || []);
        setToolStats(data.toolStats || []);
      }
    } catch (e) {
      console.error("Analytics fetch error:", e);
    }
  };

  const fetchTimeline = async () => {
    try {
      const url = new URL("/api/admin/activity", window.location.origin);
      if (actorFilter !== "ALL") url.searchParams.set("actorType", actorFilter);
      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) setLogs(data.logs || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchKnowledge = async () => {
    try {
      const res = await fetch("/api/admin/knowledge");
      const data = await res.json();
      if (data.success) setArticles(data.articles || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEmails = async () => {
    try {
      const res = await fetch("/api/admin/emails");
      const data = await res.json();
      if (data.success) setEmails(data.emailEvents || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAllConversations = async () => {
    try {
      const res = await fetch("/api/agent/conversations?filter=ALL");
      const data = await res.json();
      if (data.success) setAllConversations(data.conversations || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/agent/tickets");
      const data = await res.json();
      if (data.success) setTickets(data.tickets || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/agent/customers");
      const data = await res.json();
      if (data.success) setCustomers(data.customers || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.success) setSettings(data.settings);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Admin Header Banner */}
      <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-md p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold shadow-md">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Admin Command Center</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 font-semibold">
                Eleanor Vance • Ops Lead
              </span>
              <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
                Admin Workspace
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Complete executive oversight across autonomous AI workflows, customer lifecycles, escalations, audit logs, and system settings.
            </p>
          </div>
        </div>

        {/* Quick Operations Actions & Stat Pill */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDispatchModal(true)}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer shadow-rose-500/20"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Contact Human Agent</span>
          </button>

          <div className="px-3.5 py-1.5 rounded-xl bg-muted/60 border border-border text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-foreground">AI Engine: Healthy</span>
          </div>
        </div>
      </div>

      {/* Admin Workspace Tabs Navigation */}
      <div className="flex items-center gap-1.5 border-b border-border overflow-x-auto pb-2 text-xs font-semibold scrollbar-none">
        {[
          { id: "analytics", label: "KPI Analytics", icon: BarChart3 },
          { id: "conversations", label: "All Conversations", icon: Bot, badge: allConversations.length },
          { id: "tickets", label: "Tickets Command", icon: Ticket, badge: tickets.length },
          { id: "customers", label: "Customers", icon: Users, badge: customers.length },
          { id: "timeline", label: "Activity Timeline", icon: Activity, badge: logs.length },
          { id: "knowledge", label: "Knowledge Base", icon: BookOpen, badge: articles.length },
          { id: "emails", label: "Mock Emails", icon: Mail, badge: emails.length },
          { id: "settings", label: "System & AI Settings", icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-rose-600 text-white font-bold shadow-md shadow-rose-500/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? "bg-rose-700 text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT AREA */}

      {/* TAB 1: KPI ANALYTICS */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
              <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">AI Resolution Rate</div>
              <div className="text-3xl font-bold text-emerald-400 mt-2">
                {metrics?.autonomousResolutionRate || "84.2%"}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1 font-medium">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>+6.4% improvement this week</span>
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
              <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Human Escalation</div>
              <div className="text-3xl font-bold text-amber-400 mt-2">
                {metrics?.escalationRate || "15.8%"}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Routed to Tier 2 specialist queue
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
              <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Avg Customer CSAT</div>
              <div className="text-3xl font-bold text-amber-300 mt-2">
                {metrics?.averageCsat || "4.85"} <span className="text-base text-muted-foreground">/ 5.0 ★</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Across 128 verified ratings</p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border shadow-xs">
              <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">First Response Time</div>
              <div className="text-3xl font-bold text-brand-400 mt-2">
                {metrics?.averageFirstResponseTime || "1.2s"}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Instant autonomous AI inference</p>
            </div>
          </div>

          {/* Issue Breakdown & Tool Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-foreground flex items-center justify-between">
                <span>Inquiry Category Distribution</span>
                <span className="text-xs text-muted-foreground">Last 30 Days</span>
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Returns & Exchanges", percentage: 42, color: "bg-blue-500" },
                  { label: "Order Tracking & Delivery", percentage: 34, color: "bg-purple-500" },
                  { label: "Billing & Duplicate Charges", percentage: 16, color: "bg-rose-500" },
                  { label: "Product & Store FAQs", percentage: 8, color: "bg-emerald-500" },
                ].map((c) => (
                  <div key={c.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">{c.label}</span>
                      <span className="text-muted-foreground">{c.percentage}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${c.color}`} style={{ width: `${c.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Autonomous AI Tools Executed */}
            <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-foreground flex items-center justify-between">
                <span>AI Tool Execution Performance</span>
                <span className="text-xs text-emerald-400 font-semibold">99.4% Success</span>
              </h3>
              <div className="space-y-3">
                {[
                  { tool: "getMyOrders", desc: "Customer Order Tracking & Status", count: 342 },
                  { tool: "validateReturnEligibility", desc: "30-Day Policy Return Engine", count: 189 },
                  { tool: "createReturnRequest", desc: "Prepaid FedEx RMA Generator", count: 142 },
                  { tool: "createSupportTicket", desc: "Urgent Escalation Hand-off", count: 58 },
                ].map((t) => (
                  <div
                    key={t.tool}
                    className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-mono font-bold text-brand-400">{t.tool}</div>
                      <div className="text-[11px] text-muted-foreground">{t.desc}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-foreground">{t.count} calls</span>
                      <div className="text-[10px] text-emerald-400 font-semibold">100% Valid</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALL CONVERSATIONS */}
      {activeTab === "conversations" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">All Customer Conversations ({allConversations.length})</h2>
              <p className="text-xs text-muted-foreground">
                Inspect AI intent classification, message history, autonomous tool calls, and metadata.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {allConversations.map((conv) => (
              <div
                key={conv.id}
                className="p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-rose-500/40 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">{conv.conversationNumber || conv.id}</span>
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        conv.status === "NEEDS_HUMAN"
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse"
                          : conv.status === "AGENT_ACTIVE"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-blue-500/15 text-blue-400"
                      }`}
                    >
                      {conv.status}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-semibold">
                      {conv.customer?.vipTier || "STANDARD"} VIP
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-foreground mt-1">
                    Customer: {conv.customer?.user?.name || "Customer"} ({conv.customer?.user?.email})
                  </div>
                  {conv.summary && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{conv.summary}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setInspectConv(conv)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Audit Details</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TICKETS COMMAND */}
      {activeTab === "tickets" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Global Support Tickets ({tickets.length})</h2>
            <p className="text-xs text-muted-foreground">
              Complete oversight across high-priority tickets, escalations, and resolution status.
            </p>
          </div>

          <div className="space-y-3">
            {tickets.map((tck) => (
              <div
                key={tck.id}
                className="p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">{tck.ticketNumber}</span>
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
                  </div>
                  <div className="font-bold text-xs text-foreground">{tck.title}</div>
                  <div className="text-xs text-muted-foreground">{tck.description}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Customer: {tck.customer?.user?.name} • Created {formatDateTime(tck.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CUSTOMERS DIRECTORY */}
      {activeTab === "customers" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">Customer Accounts ({customers.length})</h2>
              <p className="text-xs text-muted-foreground">
                All simulated customer identities with loyalty tiers, orders, and spending.
              </p>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search customers..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-card border border-border text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customers
              .filter(
                (c) =>
                  !customerSearch ||
                  c.user?.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                  c.user?.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
                  c.vipTier.toLowerCase().includes(customerSearch.toLowerCase())
              )
              .map((c) => (
                <div key={c.id} className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={c.user?.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100"}
                        alt={c.user?.name}
                        className="w-10 h-10 rounded-xl object-cover ring-2 ring-rose-500/20"
                      />
                      <div>
                        <div className="font-bold text-xs text-foreground">{c.user?.name}</div>
                        <div className="text-[11px] text-muted-foreground">{c.user?.email}</div>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-muted text-muted-foreground">
                      {c.vipTier} VIP
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">LIFETIME SPEND</span>
                      <strong className="text-foreground">{formatCurrency(c.totalSpent)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">ORDERS</span>
                      <strong className="text-foreground">{c.orders?.length || 0}</strong>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 5: ACTIVITY & AUDIT TIMELINE */}
      {activeTab === "timeline" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">Complete System Activity Timeline</h2>
              <p className="text-xs text-muted-foreground">
                Follow the issue lifecycle: Customer msg → AI classification → Tool execution → Escalation → Agent takeover → Email alert.
              </p>
            </div>
            <div className="flex gap-1.5">
              {["ALL", "AI", "CUSTOMER", "AGENT", "ADMIN"].map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setActorFilter(f);
                    fetchTimeline();
                  }}
                  className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                    actorFilter === f ? "bg-rose-600 text-white" : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-4">
            {logs.map((l, i) => (
              <div key={l.id || i} className="flex items-start gap-4 text-xs pb-3 border-b border-border/40 last:border-0 last:pb-0">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-[10px] ${
                    l.actorType === "AI"
                      ? "bg-brand-600"
                      : l.actorType === "AGENT"
                      ? "bg-emerald-600"
                      : l.actorType === "CUSTOMER"
                      ? "bg-blue-600"
                      : "bg-purple-600"
                  }`}
                >
                  {l.actorType === "AI" ? "AI" : l.actorType === "AGENT" ? "AR" : l.actorType === "CUSTOMER" ? "C" : "EV"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">{l.actorName || l.actorType}</span>
                    <span className="text-[10px] text-muted-foreground">{formatDateTime(l.createdAt)}</span>
                  </div>
                  <div className="text-muted-foreground mt-0.5">{l.action}</div>
                  {l.details && (
                    <div className="text-[11px] font-mono text-brand-300 mt-1 bg-muted/30 p-1.5 rounded-md truncate">
                      {typeof l.details === "string" ? l.details : JSON.stringify(l.details)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: KNOWLEDGE BASE */}
      {activeTab === "knowledge" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">Knowledge Base Articles ({articles.length})</h2>
              <p className="text-xs text-muted-foreground">
                Manage automated AI grounded context and customer-facing support policies.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {articles.map((art) => (
              <div key={art.id} className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">{art.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground uppercase font-semibold">
                    {art.category}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {art.content?.replace(/#{1,6}\s*/g, "").replace(/\*+/g, "")}
                </p>
                <div className="pt-2 text-[11px] text-muted-foreground flex items-center justify-between">
                  <span>Tags: {art.tags || "returns, general"}</span>
                  <span className="text-emerald-400 font-semibold">Published</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: MOCK EMAILS */}
      {activeTab === "emails" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Automated Email Outbox ({emails.length})</h2>
            <p className="text-xs text-muted-foreground">
              Verify automated HTML transactional emails dispatched for order tracking, return labels & escalations.
            </p>
          </div>

          <div className="space-y-3">
            {emails.map((em) => (
              <div
                key={em.id}
                className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-foreground">{em.subject}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-semibold">
                      {em.template}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    To: <strong>{em.recipientEmail}</strong> • Sent {formatDateTime(em.createdAt)}
                  </div>
                </div>

                <button
                  onClick={() => setPreviewEmail(em)}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Email</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: SYSTEM SETTINGS */}
      {activeTab === "settings" && (
        <div className="p-6 rounded-2xl bg-card border border-border shadow-xs max-w-2xl space-y-4">
          <h2 className="text-lg font-bold text-foreground">AI Support Automation Settings</h2>
          <p className="text-xs text-muted-foreground">
            Configure LLM inference model, auto-escalation thresholds, and guardrails.
          </p>

          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">AI Model Engine</label>
              <select
                value={settings.aiModel}
                onChange={(e) => setSettings({ ...settings, aiModel: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-muted/60 border border-border text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              >
                <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet (Recommended)</option>
                <option value="openai/gpt-4o">GPT-4o (Multimodal)</option>
                <option value="google/gemini-pro-1.5">Gemini 1.5 Pro</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Auto-Escalation Confidence Threshold ({settings.autoEscalateThreshold})
              </label>
              <input
                type="range"
                min="0.5"
                max="0.95"
                step="0.05"
                value={settings.autoEscalateThreshold}
                onChange={(e) =>
                  setSettings({ ...settings, autoEscalateThreshold: parseFloat(e.target.value) })
                }
                className="w-full accent-rose-600"
              />
              <span className="text-[11px] text-muted-foreground">
                Inquiries with AI confidence below this threshold automatically trigger human agent hand-off.
              </span>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between">
              <button
                onClick={handleSaveSettings}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md cursor-pointer transition flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Configuration</span>
              </button>

              {settingsSaved && (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Settings Saved!
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Email Preview Modal */}
      {previewEmail && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="font-bold text-sm text-foreground">{previewEmail.subject}</h3>
                <p className="text-[11px] text-muted-foreground">To: {previewEmail.recipientEmail}</p>
              </div>
              <button
                onClick={() => setPreviewEmail(null)}
                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              className="p-4 rounded-2xl bg-white text-slate-900 border border-slate-200 text-xs overflow-y-auto max-h-96"
              dangerouslySetInnerHTML={{ __html: previewEmail.bodyHtml }}
            />

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPreviewEmail(null)}
                className="px-4 py-2 rounded-xl bg-muted hover:bg-accent text-xs font-semibold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conversation Audit Inspector Modal */}
      {inspectConv && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-border shrink-0">
              <div>
                <h3 className="font-bold text-sm text-foreground">
                  Audit: {inspectConv.conversationNumber || inspectConv.id}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Customer: {inspectConv.customer?.user?.name} ({inspectConv.customer?.user?.email})
                </p>
              </div>
              <button
                onClick={() => setInspectConv(null)}
                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 p-2">
              {inspectConv.messages?.map((m: any) => (
                <div key={m.id} className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-foreground">
                    <span>{m.senderName || m.senderType}</span>
                    <span className="text-[10px] text-muted-foreground">{formatDateTime(m.createdAt)}</span>
                  </div>
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {m.content?.replace(/#{1,6}\s*/g, "").replace(/\*+/g, "")}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-border shrink-0">
              <button
                onClick={() => setInspectConv(null)}
                className="px-4 py-2 rounded-xl bg-muted hover:bg-accent text-xs font-semibold cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Dispatch / Contact Human Agent Modal */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Contact Support Staff</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Send high-priority directive or operational alert directly to human agents.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDispatchModal(false);
                  setDispatchSuccess(null);
                }}
                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {dispatchSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-center space-y-1 py-6">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
                <div className="font-bold text-sm">Alert Sent Successfully!</div>
                <p className="text-[11px] text-emerald-300/80">{dispatchSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleSendDispatch} className="space-y-4">
                {/* Agent Selector */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">Target Support Agent</label>
                  <select
                    value={dispatchData.agentName}
                    onChange={(e) => setDispatchData({ ...dispatchData, agentName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  >
                    <option value="Alex Rivera">Alex Rivera (Tier 2 Support Specialist - Online)</option>
                    <option value="All Support Agents">All Support Agents (Broadcast Alert)</option>
                  </select>
                </div>

                {/* Directive Title */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">Directive Subject</label>
                  <input
                    type="text"
                    value={dispatchData.title}
                    onChange={(e) => setDispatchData({ ...dispatchData, title: e.target.value })}
                    placeholder="e.g. VIP Escalation Queue Check"
                    className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>

                {/* Priority */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">Alert Priority</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "NORMAL", label: "Normal", color: "border-border text-foreground" },
                      { id: "HIGH", label: "High Priority", color: "border-amber-500/40 text-amber-400 bg-amber-500/10" },
                      { id: "URGENT", label: "Urgent Escalation", color: "border-red-500/40 text-red-400 bg-red-500/10" },
                    ].map((p) => (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => setDispatchData({ ...dispatchData, priority: p.id })}
                        className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold transition cursor-pointer text-center ${
                          dispatchData.priority === p.id
                            ? `${p.color} ring-2 ring-rose-500 font-extrabold`
                            : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Quick Presets</label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "High ticket volume in return requests, please prioritize RET queue.",
                      "VIP customer escalation ticket opened, please review immediately.",
                      "Scheduled maintenance in 15 mins, resolve open chats.",
                    ].map((preset, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => setDispatchData({ ...dispatchData, message: preset })}
                        className="text-[10px] px-2.5 py-1 rounded-lg bg-muted hover:bg-accent border border-border text-muted-foreground hover:text-foreground transition text-left cursor-pointer"
                      >
                        "{preset.slice(0, 35)}..."
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Textarea */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">Dispatch Message</label>
                  <textarea
                    rows={3}
                    value={dispatchData.message}
                    onChange={(e) => setDispatchData({ ...dispatchData, message: e.target.value })}
                    placeholder="Enter instructions, queue directives, or details for the human agent..."
                    className="w-full p-3 rounded-xl bg-background border border-border text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowDispatchModal(false)}
                    className="px-4 py-2 rounded-xl bg-muted hover:bg-accent text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isDispatching || !dispatchData.message.trim()}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isDispatching ? "Dispatching..." : "Send Directive to Agent"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
