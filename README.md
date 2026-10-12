# NovaMart Support OS — AI Customer Support Automation Platform

A production-style prototype of an **AI-powered customer support automation platform** built for **NovaMart**, demonstrating autonomous issue resolution, strict customer data authorization, controlled tool execution, automatic escalation, private AI Support Copilot, knowledge base management, and executive oversight.

> **Important Boundary:** This is **NOT an e-commerce store** (no shopping cart, checkout, or storefront). It simulates the store's customer, order, product, payment, return, and support data to demonstrate a platform ready for integration with existing e-commerce systems.

---

## 🌟 Core Architecture & Capabilities

```
┌────────────────────────────────────────────────────────────────────────┐
│                          NovaMart Support OS                           │
├──────────────────┬──────────────────────┬──────────────────────────────┤
│  Customer Portal │  Agent Workspace     │  Admin Command Center        │
│  - Orders/Returns│  - Realtime Inbox    │  - Analytics & Resolution %  │
│  - AI Chat & CSAT│  - AI Copilot Panel  │  - Knowledge Base CRUD       │
│  - Email Prefs   │  - Ticket Management │  - Mock Email Viewer         │
│  - File Uploads  │  - Customer Details  │  - Full Activity Timeline    │
├──────────────────┴──────────────────────┴──────────────────────────────┤
│                         Next.js App Router (TS)                        │
│   API Routes: /api/chat, /api/tickets, /api/orders, /api/admin, etc.   │
├────────────────────────────────────────────────────────────────────────┤
│                       AI & Automation Engine                           │
│  - OpenRouter Client + Intelligent Local Fallback Engine               │
│  - Intent Classifier (11 intents + confidence & risk)                  │
│  - Controlled Tools (Auth verified: getOrders, checkReturn, etc.)      │
│  - AI Human Copilot (Suggested replies, summaries, policy warnings)   │
├────────────────────────────────────────────────────────────────────────┤
│                      Database & Data Services                          │
│  - Relational Persistent Engine (Users, Orders, Tickets, Logs, etc.)   │
│  - Seeded realistic store dataset (20 customers, 50 orders, etc.)      │
│  - Activity Logger & Mock Email Event Service                          │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. Three Primary User Roles
- **Customer (`/customer`)**: Authenticated customer experience. Access orders, view delivery tracking, request return labels with 30-day policy checks, report duplicate charges, upload photos, control email notification preferences, and submit CSAT ratings.
- **Support Agent (`/agent`)**: Real-time conversation inbox. Take over escalated chats, view customer sidebar context, and leverage the **AI Support Copilot** (Intent & Confidence gauge, bulleted summaries, recommended next actions, and Accept/Edit/Ignore suggested replies).
- **Admin (`/admin`)**: Executive analytics (Resolution rate, response times, CSAT), All Conversations Audit Explorer, Complete Chronological Activity Timeline, Knowledge Base manager, and Mock Email Mailbox.

### 2. Controlled AI Backend Tools (Server-Side Authorization)
The LLM never directly touches the database. All operations flow through authorization-enforcing functions:
- `getMyOrders(customerId)`: Returns customer's recent orders.
- `getOrderDetails(customerId, orderId)`: Strict ownership verification before returning tracking or payment details.
- `checkReturnEligibility(customerId, orderId)`: Validates delivery date and 30-day window.
- `createReturnRequest(customerId, orderId, reason)`: Approves return and generates a prepaid FedEx label.
- `getRefundStatus(customerId, orderId)`: Retrieves refund timelines and flags disputed charges.
- `getKnowledgeArticle(query)`: Retrieves verified store policy articles.
- `createSupportTicket(customerId, conversationId, category, priority, summary)`: Escalates and alerts agents.
- `updateEmailPreference(customerId, optIn)`: Records customer email notification opt-in/opt-out.

### 3. AI Intent Classification (11 Categories)
Classifies every customer inquiry, calculates confidence, evaluates risk, and recommends actions:
1. `ORDER_STATUS` (97% Confidence, Low Risk) → Tool lookup
2. `DELIVERY_DELAY` (91% Confidence, Medium Risk) → Carrier trace lookup
3. `RETURN_REQUEST` (94% Confidence, Low Risk) → 30-day eligibility check & label creation
4. `REFUND_STATUS` (93% Confidence, Medium Risk) → Financial timeline lookup
5. `PAYMENT_PROBLEM` (96% Confidence, Critical Risk) → Auto-escalate & open URGENT ticket
6. `PRODUCT_QUESTION` (88% Confidence, Low Risk) → Product catalog & specs lookup
7. `ACCOUNT_PROBLEM` (89% Confidence, Low Risk) → Account settings resolution
8. `GENERAL_FAQ` (95% Confidence, Low Risk) → Knowledge base policy lookup
9. `COMPLAINT` (92% Confidence, High Risk) → Route to human supervisor
10. `HUMAN_AGENT` (98% Confidence, Low Risk) → Immediate human handoff
11. `UNKNOWN` (65% Confidence, Low Risk) → Clarification request

---

## 🚀 Quick Start & Running Locally

### 1. Prerequisites
- Node.js v18+ (tested on Node v24)
- npm or yarn

### 2. Installation
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file (copied from `.env.example`):
```env
DATABASE_URL="file:./dev.db"
OPENROUTER_API_KEY=""
OPENROUTER_MODEL="minimax/minimax-m3:free,z-ai/glm-5.2:free,openrouter/free"
NEXT_PUBLIC_APP_NAME="NovaMart Support OS"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
AUTH_SECRET="generate-a-long-random-string-for-production"
```

> **Zero-Config AI Mode**: If `OPENROUTER_API_KEY` is left blank, the platform's **Intelligent Local Rule Engine** handles all tool execution, intent classification, return requests, and copilot generation seamlessly without external API requirements!

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Reset Demo Data (optional)
Seed dates are relative ("2 days ago", …), so after ~30 days the return-eligibility
scenarios drift. Reset any time — the store reseeds automatically on next start:
```bash
npm run db:seed
```

---

## ▲ Deploying to Vercel

The project builds with a plain `next build` (no custom server, no external DB required).

1. Push this folder to a Git repo (`.env` is gitignored — never commit keys).
2. In Vercel: **Add New → Project → Import** the repo. Framework preset: Next.js.
   Build command `next build` / output `.next` are auto-detected — no `vercel.json` needed.
3. Set these **Environment Variables** in the project settings:
   | Variable | Required | Notes |
   | :--- | :---: | :--- |
   | `OPENROUTER_API_KEY` | No | Leave empty for the built-in local rule engine (zero-config demo). |
   | `OPENROUTER_MODEL` | No | Comma-separated primary + fallbacks. Defaults to a free-tier chain. |
   | `AUTH_SECRET` | **Yes** | Any long random string (used for session signing). |
   | `NEXT_PUBLIC_APP_URL` | **Yes** | Your `https://<project>.vercel.app` URL. |
   | `NEXT_PUBLIC_APP_NAME` | No | Defaults to `NovaMart Support OS`. |
4. Deploy. Verify with the health endpoints:
   `https://<project>.vercel.app/api/health` → `{"status":"ok",…}` and
   `/api/health/ready` → `{"ready":true,…}`.

> **Demo-data note:** persistence is a JSON store. On Vercel's serverless filesystem
> writes live in `/tmp` and only last for the lifetime of an instance — every cold
> start reseeds pristine demo data automatically. Perfect for a prototype; point
> `src/lib/prisma.ts` at Postgres (via Prisma) when you need durable multi-user data.
> Locally the store persists in `prisma/dev_db.json` (gitignored).

---

## 👥 Seeded Demo Accounts (1-Click Switcher)

Use the top **Role Switcher dropdown** in the header to switch perspectives instantly:

| Name | Role | Email | Scenario Highlight |
| :--- | :--- | :--- | :--- |
| **Sarah Johnson** | Customer (Gold VIP) | `sarah.j@example.com` | Return request for Earbuds lid latch on order `ORD-9821`. |
| **David Smith** | Customer (Platinum VIP) | `david.smith@example.com` | Order status and delivery tracking for order `ORD-8412`. |
| **James Wilson** | Customer (Standard) | `james.w@example.com` | Duplicate billing charge on order `ORD-7734` (Auto-escalation). |
| **Alex Rivera** | Support Agent | `alex.r@novamart.com` | Tier 2 Specialist inbox and AI Copilot workspace. |
| **Eleanor Vance** | Administrator | `eleanor.v@novamart.com` | Executive analytics, complete audit timeline, and settings. |

---

## 🧪 Testing Key Scenarios

### Scenario 1: Order Tracking
1. Log in as **David Smith** (`/customer`).
2. Ask: *"Where is my order?"*
3. AI checks his authenticated account, calls `getMyOrders()`, retrieves order `ORD-8412` delivered by FedEx, and responds with exact tracking.

### Scenario 2: 30-Day Return & Prepaid Label
1. Log in as **Sarah Johnson** (`/customer`).
2. Ask: *"I want to return the earbuds from order ORD-9821."*
3. AI verifies 30-day eligibility (`checkReturnEligibility()`), approves return request `RET-1001`, generates a prepaid FedEx label, and emails the customer.
4. Click **"Returns & Refunds"** tab to view/print the shipping label.

### Scenario 3: Duplicate Charge Auto-Escalation
1. Log in as **James Wilson** (`/customer`).
2. Say: *"I was charged twice for order ORD-7734."*
3. AI classifies intent as `PAYMENT_PROBLEM` (Critical Risk), checks transaction `TXN-JMS-77340B-DUP`, creates Urgent ticket `TCK-8802`, and escalates to human billing specialists.

### Scenario 4: AI Human-Agent Copilot in Action
1. Switch to **Alex Rivera** (`/agent`).
2. Open conversation `CONV-401` or `CONV-402`.
3. Review the **AI Copilot Panel** on the right:
   - Real-time Intent & Confidence meter
   - Executive bulleted summary
   - Important policy warnings
   - 1-click **"Accept Suggestion"** button to insert the AI-crafted reply directly into the response box.

### Scenario 5: Mock Email & Complete Audit Timeline
1. Switch to **Eleanor Vance** (`/admin`).
2. View **"Support Analytics"** for AI resolution rates and category breakdowns.
3. Open **"Complete Activity Timeline"** to view every lifecycle step.
4. Open **"Mock Email Viewer"** and click **"Preview HTML"** to inspect customer emails.
