import { UserRole } from "@/types";

export interface DemoPerspective {
  email: string;
  name: string;
  role: UserRole;
  workspaceName: string;
  defaultRoute: string;
  tier: string;
  badgeColor: string;
  description: string;
  scenarioTitle: string;
  scenarioDescription: string;
  avatar: string;
}

export const DEMO_USERS: Record<string, DemoPerspective> = {
  SARAH_JOHNSON: {
    email: "sarah.j@example.com",
    name: "Sarah Johnson",
    role: "CUSTOMER" as UserRole,
    workspaceName: "Customer Workspace",
    defaultRoute: "/customer",
    tier: "Gold VIP",
    badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    description: "Gold VIP Customer • Active return request for ORD-9821",
    scenarioTitle: "Return Request Scenario",
    scenarioDescription: "Delivered NovaFit Smartwatch & NovaPod Earbuds ($479.98). Return eligible.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
  },
  DAVID_SMITH: {
    email: "david.smith@example.com",
    name: "David Smith",
    role: "CUSTOMER" as UserRole,
    workspaceName: "Customer Workspace",
    defaultRoute: "/customer",
    tier: "Platinum VIP",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    description: "Platinum VIP Customer • Delivered orders & order tracking (ORD-8412)",
    scenarioTitle: "Order Tracking Scenario",
    scenarioDescription: "Delivered Smart Home Hub ($249.99) & In-transit Merino Sweater ($99.99).",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
  },
  JAMES_WILSON: {
    email: "james.w@example.com",
    name: "James Wilson",
    role: "CUSTOMER" as UserRole,
    workspaceName: "Customer Workspace",
    defaultRoute: "/customer",
    tier: "Standard",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    description: "Standard Customer • Billing dispute & duplicate charge (ORD-7734)",
    scenarioTitle: "Duplicate Charge Escalation",
    scenarioDescription: "Duplicate $189.99 charge detected on Ergonomic Desk Chair. Auto-escalation to human agent.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
  },
  EMILY_DAVIS: {
    email: "emily.d@example.com",
    name: "Emily Davis",
    role: "CUSTOMER" as UserRole,
    workspaceName: "Customer Workspace",
    defaultRoute: "/customer",
    tier: "Silver VIP",
    badgeColor: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    description: "Silver VIP Customer • Warranty & Exchange for SoundPulse Headphones (ORD-6129)",
    scenarioTitle: "Warranty & Replacement Scenario",
    scenarioDescription: "Delivered SoundPulse ANC Headphones ($249.99). Hinge hardware issue under 1-year warranty.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
  },
  AGENT_ALEX: {
    email: "alex.r@novamart.com",
    name: "Alex Rivera",
    role: "SUPPORT_AGENT" as UserRole,
    workspaceName: "Agent Workspace",
    defaultRoute: "/agent",
    tier: "Tier 2 Specialist",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    description: "Tier 2 Support Specialist • Real-time inbox & private AI Copilot",
    scenarioTitle: "Human Agent & Copilot",
    scenarioDescription: "Handles customer escalations with AI intent meter, 2-sentence summary & 1-click suggested replies.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
  },
  AGENT_MAYA: {
    email: "maya.p@novamart.com",
    name: "Maya Patel",
    role: "SUPPORT_AGENT" as UserRole,
    workspaceName: "Agent Workspace",
    defaultRoute: "/agent",
    tier: "Warranty Specialist",
    badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    description: "Warranty & Fulfillment Lead • Fast RMA authorizations & replacement dispatches",
    scenarioTitle: "Warranty & Exchanges Desk",
    scenarioDescription: "Validates 1-year product warranties, issues instant replacements, and manages RMA queues.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
  },
  ADMIN_ELEANOR: {
    email: "eleanor.v@novamart.com",
    name: "Eleanor Vance",
    role: "ADMIN" as UserRole,
    workspaceName: "Admin Workspace",
    defaultRoute: "/admin",
    tier: "Operations Admin",
    badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    description: "Customer Ops Lead • Executive analytics, full audit explorer & timeline",
    scenarioTitle: "Executive Oversight",
    scenarioDescription: "Complete visibility into AI resolution KPIs, conversation audits, KB manager & mock emails.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
  },
  ADMIN_MARCUS: {
    email: "marcus.v@novamart.com",
    name: "Marcus Vance",
    role: "ADMIN" as UserRole,
    workspaceName: "Admin Workspace",
    defaultRoute: "/admin",
    tier: "Trust & Safety Director",
    badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    description: "Director of Trust & Safety • AI audit compliance, fraud prevention & system logs",
    scenarioTitle: "Security & Governance Center",
    scenarioDescription: "Full oversight on AI safety policies, high-risk billing escalations, and executive system audits.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
  },
};
