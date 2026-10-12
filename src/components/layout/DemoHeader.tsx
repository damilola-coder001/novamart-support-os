"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/components/providers/SessionProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { DEMO_USERS, DemoPerspective } from "@/lib/auth/demo-users";
import {
  Sparkles,
  Sun,
  Moon,
  Bell,
  CheckCircle2,
  AlertTriangle,
  User,
  Shield,
  Headphones,
  ChevronDown,
  ExternalLink,
  Crown,
  Layers,
  ArrowRight,
  Package,
  RotateCcw,
  MessageSquare,
  BarChart3,
  Sliders,
  Clock,
  Mail,
} from "lucide-react";
import { NotificationDetailModal } from "@/components/customer/NotificationDetailModal";

export function DemoHeader() {
  const { user, switchUser, currentPerspective } = useSession();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(2);
  const [selectedNotif, setSelectedNotif] = useState<any | null>(null);

  const fetchNotifs = async () => {
    try {
      if (user?.role === "CUSTOMER") {
        const res = await fetch("/api/customer/notifications");
        const data = await res.json();
        if (data.success && data.notifications && data.notifications.length > 0) {
          setNotifications(data.notifications);
          setUnreadCount(data.notifications.filter((n: any) => n.unread).length || 2);
          return;
        }
      }
      const res = await fetch("/api/admin/activity?limit=6");
      const data = await res.json();
      if (data.success) {
        setNotifications(data.logs || []);
        setUnreadCount(2);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, [user?.email]);

  // Context-aware navigation tabs
  const getNavLinks = () => {
    if (user?.role === "ADMIN") {
      return [
        { href: "/admin", label: "Admin Command Center", icon: Shield, badge: "Live Ops" },
      ];
    }
    if (user?.role === "SUPPORT_AGENT") {
      // Alex Rivera has strictly isolated access to Agent Workspace only
      return [
        { href: "/agent", label: "Agent Workspace", icon: Headphones, badge: "AI Copilot" },
      ];
    }
    return [
      { href: "/customer", label: "Customer Portal", icon: User, badge: currentPerspective?.tier || "Customer" },
    ];
  };

  const navLinks = getNavLinks();

  const getWorkspaceTitle = () => {
    if (!currentPerspective) return "Customer Workspace";
    return `${currentPerspective.name} • ${currentPerspective.tier} • ${currentPerspective.workspaceName}`;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/90 backdrop-blur-md">
      {/* Top Perspective Switcher Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/90 to-brand-950/90 border-b border-indigo-500/20 px-3 sm:px-6 py-2 text-xs text-indigo-200 flex flex-wrap items-center justify-between gap-2 shadow-xs">
        {/* Left: Active Workspace Indicator */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 font-bold text-white px-2.5 py-0.5 rounded-md bg-brand-600 shadow-xs shadow-brand-500/30 text-[11px] tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            ACTIVE WORKSPACE
          </span>
          <div className="flex items-center gap-1.5 text-white font-medium text-xs">
            <span>{getWorkspaceTitle()}</span>
          </div>
        </div>

        {/* Right: Switch Perspective Button & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 transition text-white text-xs font-semibold shadow-xs cursor-pointer"
          >
            <div className="w-4 h-4 rounded-full bg-brand-400/30 text-amber-300 flex items-center justify-center text-[10px] font-bold">
              {user?.name ? user.name.slice(0, 1) : "S"}
            </div>
            <span>Switch Workspace: <strong className="text-amber-200">{user?.name || "Sarah Johnson"}</strong></span>
            <ChevronDown className={`w-3.5 h-3.5 text-indigo-300 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-84 sm:w-96 rounded-2xl border border-border bg-popover shadow-2xl p-2.5 z-50 text-foreground animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-border/80 mb-2">
                <div className="text-[11px] font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center justify-between">
                  <span>Select Demo Perspective</span>
                  <span className="text-[10px] text-brand-600 dark:text-brand-400 font-bold">Instant Workspace Shift</span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium mt-0.5">
                  Each perspective transitions into an isolated workspace with its own identity, data scope & tools.
                </p>
              </div>

              <div className="space-y-1.5 max-h-[75vh] overflow-y-auto pr-1">
                {/* 1. Sarah Johnson */}
                <button
                  onClick={() => {
                    switchUser(DEMO_USERS.SARAH_JOHNSON.email);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl flex items-start gap-3 transition text-xs cursor-pointer ${
                    user?.email === DEMO_USERS.SARAH_JOHNSON.email
                      ? "bg-amber-500/15 border border-amber-500/40 shadow-xs"
                      : "hover:bg-accent border border-transparent"
                  }`}
                >
                  <img
                    src={DEMO_USERS.SARAH_JOHNSON.avatar}
                    alt="Sarah"
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-amber-500/40 shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 dark:text-white">Sarah Johnson</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-bold">
                        Customer (Gold VIP)
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300 mt-0.5">
                      Return Request (ORD-9821)
                    </div>
                    <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium mt-0.5 line-clamp-1">
                      {DEMO_USERS.SARAH_JOHNSON.scenarioDescription}
                    </div>
                  </div>
                </button>

                {/* 2. David Smith */}
                <button
                  onClick={() => {
                    switchUser(DEMO_USERS.DAVID_SMITH.email);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl flex items-start gap-3 transition text-xs cursor-pointer ${
                    user?.email === DEMO_USERS.DAVID_SMITH.email
                      ? "bg-purple-500/15 border border-purple-500/40 shadow-xs"
                      : "hover:bg-accent border border-transparent"
                  }`}
                >
                  <img
                    src={DEMO_USERS.DAVID_SMITH.avatar}
                    alt="David"
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-purple-500/40 shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 dark:text-white">David Smith</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-500/30 font-bold">
                        Customer (Platinum VIP)
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-purple-700 dark:text-purple-300 mt-0.5">
                      Order Status & Tracking (ORD-8412)
                    </div>
                    <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium mt-0.5 line-clamp-1">
                      {DEMO_USERS.DAVID_SMITH.scenarioDescription}
                    </div>
                  </div>
                </button>

                {/* 3. James Wilson */}
                <button
                  onClick={() => {
                    switchUser(DEMO_USERS.JAMES_WILSON.email);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl flex items-start gap-3 transition text-xs cursor-pointer ${
                    user?.email === DEMO_USERS.JAMES_WILSON.email
                      ? "bg-blue-500/15 border border-blue-500/40 shadow-xs"
                      : "hover:bg-accent border border-transparent"
                  }`}
                >
                  <img
                    src={DEMO_USERS.JAMES_WILSON.avatar}
                    alt="James"
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/40 shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 dark:text-white">James Wilson</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/30 font-bold">
                        Customer (Standard)
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-blue-700 dark:text-blue-300 mt-0.5">
                      Duplicate Charge & Escalation (ORD-7734)
                    </div>
                    <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium mt-0.5 line-clamp-1">
                      {DEMO_USERS.JAMES_WILSON.scenarioDescription}
                    </div>
                  </div>
                </button>

                {/* 4. Emily Davis */}
                <button
                  onClick={() => {
                    switchUser(DEMO_USERS.EMILY_DAVIS.email);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl flex items-start gap-3 transition text-xs cursor-pointer ${
                    user?.email === DEMO_USERS.EMILY_DAVIS.email
                      ? "bg-teal-500/15 border border-teal-500/40 shadow-xs"
                      : "hover:bg-accent border border-transparent"
                  }`}
                >
                  <img
                    src={DEMO_USERS.EMILY_DAVIS.avatar}
                    alt="Emily"
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-teal-500/40 shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 dark:text-white">Emily Davis</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-800 dark:text-teal-300 border border-teal-500/30 font-bold">
                        Customer (Silver VIP)
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-teal-700 dark:text-teal-300 mt-0.5">
                      Warranty & Replacement (ORD-6129)
                    </div>
                    <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium mt-0.5 line-clamp-1">
                      {DEMO_USERS.EMILY_DAVIS.scenarioDescription}
                    </div>
                  </div>
                </button>

                <div className="my-1.5 border-t border-border/80" />

                {/* 5. Alex Rivera (Agent Workspace) */}
                <button
                  onClick={() => {
                    switchUser(DEMO_USERS.AGENT_ALEX.email);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl flex items-start gap-3 transition text-xs cursor-pointer ${
                    user?.email === DEMO_USERS.AGENT_ALEX.email
                      ? "bg-emerald-500/15 border border-emerald-500/40 shadow-xs"
                      : "hover:bg-accent border border-transparent"
                  }`}
                >
                  <img
                    src={DEMO_USERS.AGENT_ALEX.avatar}
                    alt="Alex"
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-500/40 shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 dark:text-white">Alex Rivera</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 font-bold">
                        Agent Workspace
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                      Support Inbox & Private AI Copilot
                    </div>
                    <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium mt-0.5 line-clamp-1">
                      {DEMO_USERS.AGENT_ALEX.scenarioDescription}
                    </div>
                  </div>
                </button>

                {/* 6. Maya Patel (Agent Workspace) */}
                <button
                  onClick={() => {
                    switchUser(DEMO_USERS.AGENT_MAYA.email);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl flex items-start gap-3 transition text-xs cursor-pointer ${
                    user?.email === DEMO_USERS.AGENT_MAYA.email
                      ? "bg-cyan-500/15 border border-cyan-500/40 shadow-xs"
                      : "hover:bg-accent border border-transparent"
                  }`}
                >
                  <img
                    src={DEMO_USERS.AGENT_MAYA.avatar}
                    alt="Maya"
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-cyan-500/40 shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 dark:text-white">Maya Patel</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border border-cyan-500/30 font-bold">
                        Agent Workspace
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-cyan-700 dark:text-cyan-400 mt-0.5">
                      Warranty & Exchanges Desk
                    </div>
                    <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium mt-0.5 line-clamp-1">
                      {DEMO_USERS.AGENT_MAYA.scenarioDescription}
                    </div>
                  </div>
                </button>

                <div className="my-1.5 border-t border-border/80" />

                {/* 7. Eleanor Vance (Admin Workspace) */}
                <button
                  onClick={() => {
                    switchUser(DEMO_USERS.ADMIN_ELEANOR.email);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl flex items-start gap-3 transition text-xs cursor-pointer ${
                    user?.email === DEMO_USERS.ADMIN_ELEANOR.email
                      ? "bg-rose-500/15 border border-rose-500/40 shadow-xs"
                      : "hover:bg-accent border border-transparent"
                  }`}
                >
                  <img
                    src={DEMO_USERS.ADMIN_ELEANOR.avatar}
                    alt="Eleanor"
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-rose-500/40 shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 dark:text-white">Eleanor Vance</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30 font-bold">
                        Admin Workspace
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-rose-700 dark:text-rose-400 mt-0.5">
                      Executive Analytics & Audit Explorer
                    </div>
                    <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium mt-0.5 line-clamp-1">
                      {DEMO_USERS.ADMIN_ELEANOR.scenarioDescription}
                    </div>
                  </div>
                </button>

                {/* 8. Marcus Vance (Admin Workspace) */}
                <button
                  onClick={() => {
                    switchUser(DEMO_USERS.ADMIN_MARCUS.email);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl flex items-start gap-3 transition text-xs cursor-pointer ${
                    user?.email === DEMO_USERS.ADMIN_MARCUS.email
                      ? "bg-indigo-500/15 border border-indigo-500/40 shadow-xs"
                      : "hover:bg-accent border border-transparent"
                  }`}
                >
                  <img
                    src={DEMO_USERS.ADMIN_MARCUS.avatar}
                    alt="Marcus"
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/40 shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 dark:text-white">Marcus Vance</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border border-indigo-500/30 font-bold">
                        Admin Workspace
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 mt-0.5">
                      Security & Governance Center
                    </div>
                    <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium mt-0.5 line-clamp-1">
                      {DEMO_USERS.ADMIN_MARCUS.scenarioDescription}
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Header Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-brand-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="font-bold text-base tracking-tight flex items-center gap-1.5">
              <span>NovaMart</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-500 border border-brand-500/20">
                Support OS
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground -mt-0.5">AI Customer Support Platform</div>
          </div>
        </Link>

        {/* Center Portal Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border">
          {navLinks.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? "bg-background text-foreground shadow-xs font-semibold border border-border/80"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-brand-500" : "text-muted-foreground"}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                      isActive ? "bg-brand-500/15 text-brand-500" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Tools: Notification Bell, Theme Toggle, User Profile */}
        <div className="flex items-center gap-2.5">
          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setNotifsOpen(!notifsOpen);
                setUnreadCount(0);
              }}
              className="relative p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition border border-transparent hover:border-border cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500 ring-2 ring-background animate-pulse" />
              )}
            </button>

            {notifsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-popover shadow-2xl p-3 z-50 text-foreground animate-in fade-in">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-border text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-brand-500" />
                    <span>{user?.role === "CUSTOMER" ? "Customer Notifications" : "Workspace Activity Alerts"}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-400 border border-brand-500/30 font-bold">
                    Live
                  </span>
                </div>
                <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      No recent notifications.
                    </div>
                  ) : (
                    notifications.slice(0, 6).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          setSelectedNotif(n);
                          setNotifsOpen(false);
                        }}
                        className="text-xs p-2.5 rounded-xl bg-muted/40 hover:bg-brand-500/15 hover:border-brand-500/30 border border-transparent transition cursor-pointer group space-y-1"
                      >
                        <div className="font-semibold flex items-center justify-between gap-2">
                          <span className="truncate text-foreground group-hover:text-brand-400 transition font-bold text-xs">
                            {n.title || n.actorName || "Notification"}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {new Date(n.date || n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground line-clamp-1">
                          {n.subtitle || n.message || n.action}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {user?.role === "ADMIN" && (
                  <div className="pt-2 mt-2 border-t border-border text-center">
                    <Link
                      href="/admin"
                      onClick={() => setNotifsOpen(false)}
                      className="text-[11px] text-brand-500 hover:underline font-medium"
                    >
                      View Full Activity Timeline →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition border border-transparent hover:border-border cursor-pointer"
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Active User Avatar Chip */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-border">
            <img
              src={currentPerspective?.avatar || user?.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80"}
              alt={user?.name || "User"}
              className="w-8 h-8 rounded-full ring-2 ring-brand-500/40 object-cover"
            />
            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold leading-none">{user?.name}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                {currentPerspective?.workspaceName || "Customer Workspace"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Notification Detail Modal */}
      {selectedNotif && (
        <NotificationDetailModal
          notification={selectedNotif}
          onClose={() => setSelectedNotif(null)}
          onNavigate={(tab) => {
            if (pathname !== "/customer") {
              window.history.pushState({}, "", "/customer");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }
          }}
        />
      )}
    </header>
  );
}
