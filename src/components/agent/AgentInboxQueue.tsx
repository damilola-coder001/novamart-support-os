import React from "react";
import { Search, AlertTriangle, CheckCircle2, UserCheck, Bot, Clock } from "lucide-react";

export interface AgentConversation {
  id: string;
  conversationNumber: string;
  status: "AI_HANDLING" | "NEEDS_HUMAN" | "AGENT_ACTIVE" | "RESOLVED";
  category: string;
  priority: string;
  summary?: string;
  updatedAt: string;
  customer?: {
    id: string;
    loyaltyTier?: string;
    user: {
      name: string;
      email: string;
      avatar?: string;
    };
  };
  messages?: Array<{
    id: string;
    senderType: string;
    content: string;
    createdAt: string;
  }>;
}

interface AgentInboxQueueProps {
  conversations: AgentConversation[];
  selectedConvId: string | null;
  onSelectConversation: (id: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const AgentInboxQueue: React.FC<AgentInboxQueueProps> = ({
  conversations,
  selectedConvId,
  onSelectConversation,
  statusFilter,
  setStatusFilter,
  searchQuery,
  setSearchQuery,
}) => {
  const needsHumanCount = conversations.filter((c) => c.status === "NEEDS_HUMAN").length;
  const agentActiveCount = conversations.filter((c) => c.status === "AGENT_ACTIVE").length;

  const filtered = conversations.filter((c) => {
    if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const customerName = c.customer?.user?.name?.toLowerCase() || "";
      const convNum = c.conversationNumber?.toLowerCase() || "";
      const summary = c.summary?.toLowerCase() || "";
      return customerName.includes(q) || convNum.includes(q) || summary.includes(q);
    }
    return true;
  });

  const getStatusBadge = (status: AgentConversation["status"]) => {
    switch (status) {
      case "NEEDS_HUMAN":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse">
            <AlertTriangle className="w-3 h-3" /> Needs Agent
          </span>
        );
      case "AGENT_ACTIVE":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <UserCheck className="w-3 h-3" /> Agent Active
          </span>
        );
      case "AI_HANDLING":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Bot className="w-3 h-3" /> AI Handled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-400 border border-slate-500/30">
            <CheckCircle2 className="w-3 h-3" /> Resolved
          </span>
        );
    }
  };

  return (
    <div className="w-80 lg:w-96 border-r border-border bg-card flex flex-col h-full shrink-0">
      {/* Search Header */}
      <div className="p-3.5 border-b border-border space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search customers, orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted/60 border border-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-brand-500 transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer shrink-0 ${
              statusFilter === "ALL"
                ? "bg-brand-600 text-white shadow-xs"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({conversations.length})
          </button>
          <button
            onClick={() => setStatusFilter("NEEDS_HUMAN")}
            className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer shrink-0 flex items-center gap-1 ${
              statusFilter === "NEEDS_HUMAN"
                ? "bg-amber-500 text-white shadow-xs"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Escalated {needsHumanCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />}
          </button>
          <button
            onClick={() => setStatusFilter("AGENT_ACTIVE")}
            className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer shrink-0 ${
              statusFilter === "AGENT_ACTIVE"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            My Active ({agentActiveCount})
          </button>
        </div>
      </div>

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/60">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No conversations match your filter.
          </div>
        ) : (
          filtered.map((conv) => {
            const isSelected = conv.id === selectedConvId;
            const lastMessage =
              conv.messages && conv.messages.length > 0
                ? conv.messages[conv.messages.length - 1]
                : null;

            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`p-3.5 transition cursor-pointer flex flex-col gap-1.5 ${
                  isSelected
                    ? "bg-accent border-l-4 border-l-brand-500 shadow-xs"
                    : "hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-bold text-xs text-foreground truncate">
                      {conv.customer?.user?.name || "Customer"}
                    </span>
                    {conv.customer?.loyaltyTier && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {conv.customer.loyaltyTier}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(conv.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] text-muted-foreground">{conv.conversationNumber}</span>
                  {getStatusBadge(conv.status)}
                </div>

                <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                  {lastMessage?.content || conv.summary || "Conversation active"}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
