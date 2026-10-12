import React from "react";
import { Sparkles, MessageSquare, Check, AlertTriangle, ShieldCheck } from "lucide-react";

export interface CopilotData {
  summary: string;
  sentiment: string;
  sentimentScore: number;
  customerProfile: {
    name: string;
    email: string;
    tier: string;
    totalOrders: number;
    lifetimeSpent: number;
  };
  suggestedReply: string;
}

interface AgentCopilotSidebarProps {
  copilot: CopilotData | null;
  onApplySuggestedReply: (reply: string) => void;
}

export const AgentCopilotSidebar: React.FC<AgentCopilotSidebarProps> = ({
  copilot,
  onApplySuggestedReply,
}) => {
  if (!copilot) {
    return (
      <div className="w-80 lg:w-88 border-l border-border bg-card p-6 flex flex-col items-center justify-center text-center text-muted-foreground shrink-0">
        <Sparkles className="w-10 h-10 mb-2 text-emerald-400/40" />
        <p className="text-xs font-semibold">Select a conversation</p>
        <p className="text-[11px] mt-1">AI Copilot will analyze customer sentiment, orders, and suggest responses.</p>
      </div>
    );
  }

  const sentimentColor =
    copilot.sentiment === "FRUSTRATED" || copilot.sentimentScore < 0.3
      ? "text-red-400 bg-red-500/10 border-red-500/20"
      : copilot.sentimentScore > 0.6
      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
      : "text-amber-400 bg-amber-500/10 border-amber-500/20";

  return (
    <div className="w-80 lg:w-88 border-l border-border bg-card flex flex-col h-full overflow-y-auto shrink-0 divide-y divide-border/60">
      {/* Copilot Header */}
      <div className="p-4 bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs flex items-center gap-1.5 text-foreground">
              <span>NovaMart AI Copilot</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                ACTIVE
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground">Private Agent Assistant</div>
          </div>
        </div>
      </div>

      {/* Customer 360 Card */}
      <div className="p-4 space-y-2">
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Customer Profile</div>
        <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-foreground">{copilot.customerProfile.name}</span>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {copilot.customerProfile.tier}
            </span>
          </div>
          <div className="text-[11px] text-muted-foreground">{copilot.customerProfile.email}</div>
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1 border-t border-border/40">
            <span>Orders: <strong className="text-foreground">{copilot.customerProfile.totalOrders}</strong></span>
            <span>LTV: <strong className="text-foreground">${copilot.customerProfile.lifetimeSpent.toFixed(2)}</strong></span>
          </div>
        </div>
      </div>

      {/* Sentiment Risk Analysis */}
      <div className="p-4 space-y-2">
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Real-time Sentiment</div>
        <div className={`p-3 rounded-xl border flex items-center justify-between ${sentimentColor}`}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            <span className="font-bold text-xs">{copilot.sentiment || "NEUTRAL"}</span>
          </div>
          <span className="font-mono text-xs font-bold">{Math.round(copilot.sentimentScore * 100)}%</span>
        </div>
      </div>

      {/* AI Summary */}
      <div className="p-4 space-y-2">
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Conversation Summary</div>
        <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-xl border border-border leading-relaxed">
          {copilot.summary || "Customer is requesting assistance with an existing order."}
        </p>
      </div>

      {/* Suggested 1-Click Response */}
      {copilot.suggestedReply && (
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <MessageSquare className="w-3 h-3" /> Suggested Reply
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed font-sans">
            {copilot.suggestedReply}
          </div>
          <button
            onClick={() => onApplySuggestedReply(copilot.suggestedReply)}
            className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Accept & Insert into Composer</span>
          </button>
        </div>
      )}

      {/* Recommended Next Actions */}
      <div className="p-4 space-y-2">
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Recommended Actions</div>
        <ul className="text-xs space-y-1.5 text-muted-foreground bg-muted/20 p-3 rounded-xl border border-border">
          <li className="flex items-start gap-1.5">
            <span className="text-emerald-400 font-bold">1.</span>
            <span>Verify customer identity and order confirmation</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-emerald-400 font-bold">2.</span>
            <span>Confirm return or exchange eligibility</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-emerald-400 font-bold">3.</span>
            <span>Issue prepaid label and trigger email dispatch</span>
          </li>
        </ul>
      </div>

      {/* Policy Warning */}
      <div className="p-4">
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-xs">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Policy Note</span>
          </div>
          <p className="text-[11px] text-amber-200/80 leading-relaxed">
            NovaMart standard return policy allows 30 days for delivered items. VIP customers receive 45-day extended returns and waived restocking fees.
          </p>
        </div>
      </div>
    </div>
  );
};
