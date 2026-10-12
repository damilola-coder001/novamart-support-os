import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return formatDate(d);
}

export function getStatusBadgeVariant(status: string): {
  label: string;
  bg: string;
  text: string;
  border: string;
} {
  switch (status.toUpperCase()) {
    case "AI_HANDLING":
      return { label: "AI Handling", bg: "bg-indigo-500/10", text: "text-indigo-500", border: "border-indigo-500/20" };
    case "NEEDS_HUMAN":
      return { label: "Needs Human", bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20" };
    case "AGENT_ACTIVE":
      return { label: "Agent Active", bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20" };
    case "RESOLVED":
      return { label: "Resolved", bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20" };
    case "CLOSED":
      return { label: "Closed", bg: "bg-slate-500/10", text: "text-slate-500", border: "border-slate-500/20" };
    case "OPEN":
      return { label: "Open", bg: "bg-rose-500/10", text: "text-rose-500", border: "border-rose-500/20" };
    case "IN_PROGRESS":
      return { label: "In Progress", bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20" };
    case "DELIVERED":
      return { label: "Delivered", bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20" };
    case "SHIPPED":
      return { label: "Shipped", bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20" };
    case "PROCESSING":
      return { label: "Processing", bg: "bg-purple-500/10", text: "text-purple-500", border: "border-purple-500/20" };
    case "DELAYED":
      return { label: "Delayed", bg: "bg-rose-500/10", text: "text-rose-500", border: "border-rose-500/20" };
    case "CANCELLED":
      return { label: "Cancelled", bg: "bg-slate-500/10", text: "text-slate-500", border: "border-slate-500/20" };
    case "APPROVED":
      return { label: "Approved", bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20" };
    case "PENDING":
      return { label: "Pending", bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20" };
    default:
      return { label: status, bg: "bg-slate-500/10", text: "text-slate-500", border: "border-slate-500/20" };
  }
}

export function getPriorityBadgeVariant(priority: string): {
  label: string;
  bg: string;
  text: string;
  border: string;
} {
  switch (priority.toUpperCase()) {
    case "URGENT":
      return { label: "Urgent", bg: "bg-red-500/15", text: "text-red-500 font-semibold", border: "border-red-500/30" };
    case "HIGH":
      return { label: "High", bg: "bg-amber-500/15", text: "text-amber-500 font-medium", border: "border-amber-500/30" };
    case "MEDIUM":
      return { label: "Medium", bg: "bg-blue-500/15", text: "text-blue-500", border: "border-blue-500/30" };
    case "LOW":
      return { label: "Low", bg: "bg-slate-500/15", text: "text-slate-500", border: "border-slate-500/30" };
    default:
      return { label: priority, bg: "bg-slate-500/15", text: "text-slate-500", border: "border-slate-500/30" };
  }
}
