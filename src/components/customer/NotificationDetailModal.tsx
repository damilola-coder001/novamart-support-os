"use client";

import React from "react";
import {
  X,
  Bell,
  Package,
  RotateCcw,
  MessageSquare,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Shield,
  Bot,
  Truck,
  DollarSign,
  FileText,
  User,
} from "lucide-react";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/utils";

interface NotificationDetailModalProps {
  notification: any | null;
  onClose: () => void;
  onNavigate?: (tab: string) => void;
}

export function NotificationDetailModal({
  notification,
  onClose,
  onNavigate,
}: NotificationDetailModalProps) {
  if (!notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case "ORDER":
        return <Package className="w-5 h-5 text-indigo-400" />;
      case "RETURN":
        return <RotateCcw className="w-5 h-5 text-amber-400" />;
      case "TICKET":
        return <MessageSquare className="w-5 h-5 text-emerald-400" />;
      case "EMAIL":
        return <Mail className="w-5 h-5 text-blue-400" />;
      default:
        if (notification.actorType === "AI") return <Bot className="w-5 h-5 text-brand-400" />;
        if (notification.actorType === "ADMIN") return <Shield className="w-5 h-5 text-rose-400" />;
        return <Bell className="w-5 h-5 text-indigo-400" />;
    }
  };

  const getBadgeColor = () => {
    switch (notification.type) {
      case "ORDER":
        return "bg-indigo-500/15 text-indigo-400 border-indigo-500/30";
      case "RETURN":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "TICKET":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "EMAIL":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      default:
        return "bg-brand-500/15 text-brand-400 border-brand-500/30";
    }
  };

  const formattedDate = notification.date || notification.createdAt;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-card border border-border rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-border/80 flex items-start justify-between gap-4 bg-muted/20">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-center shrink-0 mt-0.5">
              {getIcon()}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${getBadgeColor()}`}>
                  {notification.type || notification.entityType || "Notification"}
                </span>
                {notification.status && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">
                    {notification.status}
                  </span>
                )}
                {notification.priority && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold">
                    {notification.priority}
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-foreground leading-snug">
                {notification.title || notification.action || "Notification Details"}
              </h3>
              {formattedDate && (
                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground/70" />
                  <span>{formatDateTime(formattedDate)}</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-foreground">
          {/* Main Message */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 leading-relaxed text-muted-foreground space-y-2">
            <div className="font-semibold text-foreground text-xs">Summary & Details:</div>
            <p className="text-xs text-foreground/90 whitespace-pre-wrap">
              {notification.message ||
                notification.fullBody ||
                (notification.details ? (typeof notification.details === "string" ? notification.details : JSON.stringify(notification.details, null, 2)) : "No additional description available.")}
            </p>
          </div>

          {/* Key Metadata Grid */}
          <div className="grid grid-cols-2 gap-3">
            {notification.orderNumber && (
              <div className="p-3 rounded-xl bg-card border border-border shadow-xs space-y-0.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Order Number</span>
                <div className="font-bold text-foreground">{notification.orderNumber}</div>
              </div>
            )}
            {notification.trackingNumber && (
              <div className="p-3 rounded-xl bg-card border border-border shadow-xs space-y-0.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Tracking Code</span>
                <div className="font-bold text-foreground font-mono">{notification.trackingNumber}</div>
              </div>
            )}
            {notification.returnNumber && (
              <div className="p-3 rounded-xl bg-card border border-border shadow-xs space-y-0.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Return RMA #</span>
                <div className="font-bold text-foreground">{notification.returnNumber}</div>
              </div>
            )}
            {notification.refundAmount !== undefined && (
              <div className="p-3 rounded-xl bg-card border border-border shadow-xs space-y-0.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Refund Amount</span>
                <div className="font-bold text-emerald-400 font-mono">${Number(notification.refundAmount).toFixed(2)}</div>
              </div>
            )}
            {notification.ticketNumber && (
              <div className="p-3 rounded-xl bg-card border border-border shadow-xs space-y-0.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Support Ticket</span>
                <div className="font-bold text-foreground">{notification.ticketNumber}</div>
              </div>
            )}
            {notification.recipient && (
              <div className="p-3 rounded-xl bg-card border border-border shadow-xs space-y-0.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Recipient</span>
                <div className="font-bold text-foreground truncate">{notification.recipient}</div>
              </div>
            )}
            {notification.actorName && (
              <div className="p-3 rounded-xl bg-card border border-border shadow-xs space-y-0.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Logged By</span>
                <div className="font-bold text-foreground">{notification.actorName}</div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-border/80 bg-muted/20 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-muted-foreground">
            NovaMart Instant Notification System
          </div>
          <div className="flex items-center gap-2">
            {notification.actionLabel && onNavigate && (
              <button
                onClick={() => {
                  if (notification.type === "TICKET") onNavigate("chat");
                  else if (notification.type === "ORDER") onNavigate("orders");
                  else if (notification.type === "RETURN") onNavigate("returns");
                  else onNavigate("overview");
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>{notification.actionLabel}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-muted hover:bg-accent text-foreground font-semibold text-xs transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
