"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "@/components/providers/SessionProvider";
import { DEMO_USERS } from "@/lib/auth/demo-users";
import {
  Bot,
  Headphones,
  Shield,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  Zap,
  Mail,
  Activity,
  Layers,
  BarChart3,
  FileText,
  UserCheck,
  RefreshCw,
} from "lucide-react";

export default function HomePage() {
  const { switchUser } = useSession();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-brand-600/10 dark:bg-brand-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-5xl w-full mx-auto space-y-12 relative z-10">
        {/* Hero Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-700 dark:text-brand-300 text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 animate-pulse" />
            <span>Next-Generation E-Commerce Support Automation</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            AI Support Agent & <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 dark:from-brand-400 dark:via-indigo-400 dark:to-purple-400">
              Private Agent Copilot
            </span>
          </h1>

          <p className="text-base md:text-lg text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            A production-style prototype for <strong className="text-slate-900 dark:text-white font-bold">NovaMart</strong> showing how autonomous AI resolves common customer inquiries, enforces strict data authorization, executes controlled tools, and seamlessly transitions to a private copilot when human agents take over.
          </p>
        </div>

        {/* 3 Core Experience Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Customer Experience */}
          <div className="group relative rounded-3xl border border-border bg-card hover:bg-card/90 transition duration-300 p-6 flex flex-col justify-between shadow-xl hover:shadow-2xl hover:border-brand-500/50">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-600 dark:text-brand-400 group-hover:scale-110 transition shadow-xs">
                <Bot className="w-6 h-6" />
              </div>

              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-brand-700 dark:text-brand-400">Perspective 01</div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">Customer Portal</h2>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                Log in as a customer (Sarah, David, or James) to chat with the AI assistant. Ask for order status, request return labels, report duplicate charges, upload photos, and receive automated progress emails.
              </p>

              <div className="space-y-2.5 pt-2 text-xs text-slate-800 dark:text-slate-200 font-bold">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Real-time Intent & Tool calling</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Verified 30-day return eligibility</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Interactive CSAT rating prompt</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Link
                href="/customer"
                onClick={() => switchUser(DEMO_USERS.SARAH_JOHNSON.email)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition shadow-lg shadow-brand-500/25 cursor-pointer"
              >
                <span>Launch Customer Chat</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* 2. Support Agent Workspace */}
          <div className="group relative rounded-3xl border border-border bg-card hover:bg-card/90 transition duration-300 p-6 flex flex-col justify-between shadow-xl hover:shadow-2xl hover:border-indigo-500/50">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition shadow-xs">
                <Headphones className="w-6 h-6" />
              </div>

              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Perspective 02</div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">Agent Workspace</h2>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                Experience the real-time support inbox. Take over escalated conversations and leverage the <strong className="text-slate-900 dark:text-white font-bold">AI Support Copilot</strong> for suggested replies (Accept/Edit/Ignore), summaries, and warnings.
              </p>

              <div className="space-y-2.5 pt-2 text-xs text-slate-800 dark:text-slate-200 font-bold">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Real-time inbox with filter tabs</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>AI Copilot Suggested Responses</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Full Customer Context Sidebar</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Link
                href="/agent"
                onClick={() => switchUser(DEMO_USERS.AGENT_ALEX.email)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-500/25 cursor-pointer"
              >
                <span>Launch Agent Inbox</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* 3. Admin Command Center */}
          <div className="group relative rounded-3xl border border-border bg-card hover:bg-card/90 transition duration-300 p-6 flex flex-col justify-between shadow-xl hover:shadow-2xl hover:border-purple-500/50">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition shadow-xs">
                <Shield className="w-6 h-6" />
              </div>

              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-400">Perspective 03</div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">Admin Center</h2>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                Complete operational visibility. Monitor resolution analytics, review the complete chronological activity timeline, manage the knowledge base, inspect mock emails, and configure AI settings.
              </p>

              <div className="space-y-2.5 pt-2 text-xs text-slate-800 dark:text-slate-200 font-bold">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>Resolution & CSAT Analytics</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>Full Event Lifecycle Timeline</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>Knowledge Base CRUD & Settings</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Link
                href="/admin"
                onClick={() => switchUser(DEMO_USERS.ADMIN_ELEANOR.email)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-lg shadow-purple-500/25 cursor-pointer"
              >
                <span>Launch Admin Center</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="rounded-3xl border border-border bg-card p-6 md:p-8 space-y-6 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Platform Capabilities & Security Guarantees</h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5">Built to demonstrate a production-ready integration with any modern e-commerce storefront.</p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/30 font-bold shrink-0">
              <Lock className="w-3.5 h-3.5" />
              <span>Strict Server-Side Authorization</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1.5 shadow-xs">
              <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <div className="font-extrabold text-slate-900 dark:text-white">11 AI Intent Classifiers</div>
              <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">Tracks confidence, risk, and triggers automated escalations.</div>
            </div>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1.5 shadow-xs">
              <Layers className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <div className="font-extrabold text-slate-900 dark:text-white">Controlled Tools</div>
              <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">LLM never accesses raw DB; isolated by customer ownership.</div>
            </div>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1.5 shadow-xs">
              <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <div className="font-extrabold text-slate-900 dark:text-white">Mock Email Automation</div>
              <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">Generates HTML customer emails with live preview viewer.</div>
            </div>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1.5 shadow-xs">
              <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <div className="font-extrabold text-slate-900 dark:text-white">End-to-End Auditing</div>
              <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">Chronological timeline tracking every event from start to finish.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
