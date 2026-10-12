import React from "react";
import { RotateCcw, CheckCircle2, Clock, Truck, FileText, ExternalLink } from "lucide-react";

export interface ReturnRequest {
  id: string;
  returnNumber: string;
  orderNumber: string;
  status: "REQUESTED" | "APPROVED" | "LABEL_PRINTED" | "IN_TRANSIT" | "RECEIVED" | "REFUNDED" | "REJECTED";
  reason: string;
  refundAmount: number;
  trackingNumber?: string;
  createdAt: string;
  updatedAt?: string;
}

interface CustomerReturnsListProps {
  returns: ReturnRequest[];
  onViewLabel: (ret: ReturnRequest) => void;
}

export const CustomerReturnsList: React.FC<CustomerReturnsListProps> = ({ returns, onViewLabel }) => {
  const getReturnStatusBadge = (status: ReturnRequest["status"]) => {
    switch (status) {
      case "REFUNDED":
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> {status === "REFUNDED" ? "Refund Processed" : "Return Approved"}
          </span>
        );
      case "IN_TRANSIT":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Truck className="w-3.5 h-3.5" /> Label In Transit
          </span>
        );
      case "REQUESTED":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" /> Under Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-500 border border-slate-500/20">
            {status}
          </span>
        );
    }
  };

  if (returns.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground bg-card rounded-2xl border border-border">
        <RotateCcw className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
        <p className="font-semibold text-foreground">No return requests</p>
        <p className="text-xs mt-1">When you request a return, prepaid labels and refund tracking will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {returns.map((ret) => (
        <div
          key={ret.id}
          className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:border-brand-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-3">
              <span className="font-bold text-foreground text-base tracking-tight">{ret.returnNumber}</span>
              {getReturnStatusBadge(ret.status)}
              <span className="text-xs text-muted-foreground font-medium">Order: {ret.orderNumber}</span>
            </div>
            <p className="text-xs text-muted-foreground">Reason: {ret.reason}</p>
            <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground pt-1">
              <span>
                Refund: <strong className="text-emerald-500">${ret.refundAmount.toFixed(2)}</strong>
              </span>
              {ret.trackingNumber && (
                <span className="flex items-center gap-1">
                  FedEx: <strong className="font-mono text-foreground">{ret.trackingNumber}</strong>
                </span>
              )}
              <span>
                Created:{" "}
                {new Date(ret.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center">
            {ret.trackingNumber && (
              <button
                onClick={() => onViewLabel(ret)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" /> Shipping Label
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
