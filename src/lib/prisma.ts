// NovaMart Support Platform - Relational Persistent Database Engine
// Provides full Prisma-compatible API with persistent JSON storage & built-in realistic seed dataset
import fs from "fs";
import path from "path";

export interface DBState {
  users: any[];
  customers: any[];
  supportAgents: any[];
  products: any[];
  orders: any[];
  orderItems: any[];
  payments: any[];
  returnRequests: any[];
  conversations: any[];
  messages: any[];
  tickets: any[];
  knowledgeArticles: any[];
  notifications: any[];
  emailEvents: any[];
  activityLogs: any[];
  customerFeedbacks: any[];
}

// Serverless platforms (Vercel, etc.) have a read-only filesystem except /tmp,
// and instances are ephemeral: seed data loads fresh per instance and writes
// only persist for the lifetime of the instance. Local dev keeps using the
// persistent prisma/dev_db.json file.
const DB_FILE =
  process.env.VERCEL || process.env.DB_FILE
    ? path.join(process.env.DB_FILE || "/tmp", "novamart-dev-db.json")
    : path.join(process.cwd(), "prisma", "dev_db.json");

// Helper to generate UUIDs
function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getInitialSeedData(): DBState {
  const adminUserId = "usr-admin-01";
  const agent1UserId = "usr-agent-01";
  const agent2UserId = "usr-agent-02";
  const agent3UserId = "usr-agent-03";

  const agent1Id = "agt-01";
  const agent2Id = "agt-02";
  const agent3Id = "agt-03";

  const users: any[] = [
    {
      id: adminUserId,
      email: "eleanor.v@novamart.com",
      name: "Eleanor Vance",
      role: "ADMIN",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      createdAt: new Date("2025-01-01T00:00:00Z"),
      updatedAt: new Date("2025-01-01T00:00:00Z"),
    },
    {
      id: agent1UserId,
      email: "alex.r@novamart.com",
      name: "Alex Rivera",
      role: "SUPPORT_AGENT",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      createdAt: new Date("2025-01-01T00:00:00Z"),
      updatedAt: new Date("2025-01-01T00:00:00Z"),
    },
    {
      id: agent2UserId,
      email: "maya.p@novamart.com",
      name: "Maya Patel",
      role: "SUPPORT_AGENT",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      createdAt: new Date("2025-01-01T00:00:00Z"),
      updatedAt: new Date("2025-01-01T00:00:00Z"),
    },
    {
      id: agent3UserId,
      email: "marcus.v@novamart.com",
      name: "Marcus Vance",
      role: "ADMIN",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      createdAt: new Date("2025-01-01T00:00:00Z"),
      updatedAt: new Date("2025-01-01T00:00:00Z"),
    },
  ];

  const supportAgents: any[] = [
    {
      id: agent1Id,
      userId: agent1UserId,
      department: "Tier 2 Support Specialist",
      isAvailable: true,
      activeConversations: 2,
      maxConcurrent: 5,
      rating: 4.95,
      createdAt: new Date("2025-01-01T00:00:00Z"),
      updatedAt: new Date("2025-01-01T00:00:00Z"),
    },
    {
      id: agent2Id,
      userId: agent2UserId,
      department: "Returns & Order Fulfillment",
      isAvailable: true,
      activeConversations: 1,
      maxConcurrent: 5,
      rating: 4.88,
      createdAt: new Date("2025-01-01T00:00:00Z"),
      updatedAt: new Date("2025-01-01T00:00:00Z"),
    },
    {
      id: agent3Id,
      userId: agent3UserId,
      department: "Billing & Escalation Lead",
      isAvailable: false,
      activeConversations: 0,
      maxConcurrent: 5,
      rating: 4.92,
      createdAt: new Date("2025-01-01T00:00:00Z"),
      updatedAt: new Date("2025-01-01T00:00:00Z"),
    },
  ];

  const customerSeeds = [
    { id: "cust-01", name: "Sarah Johnson", email: "sarah.j@example.com", phone: "+1 (555) 234-5678", address: "742 Evergreen Terrace", city: "Springfield", state: "OR", postalCode: "97477", vipTier: "GOLD", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80" },
    { id: "cust-02", name: "David Smith", email: "david.smith@example.com", phone: "+1 (555) 876-5432", address: "124 Conch Street", city: "Bikini Bottom", state: "CA", postalCode: "90210", vipTier: "PLATINUM", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80" },
    { id: "cust-03", name: "James Wilson", email: "james.w@example.com", phone: "+1 (555) 345-6789", address: "221B Baker Street", city: "Seattle", state: "WA", postalCode: "98101", vipTier: "STANDARD", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80" },
    { id: "cust-04", name: "Emily Davis", email: "emily.d@example.com", phone: "+1 (555) 456-7890", address: "456 Oak Avenue", city: "Austin", state: "TX", postalCode: "78701", vipTier: "SILVER", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80" },
    { id: "cust-05", name: "Michael Brown", email: "michael.b@example.com", phone: "+1 (555) 567-8901", address: "789 Pine Road", city: "Denver", state: "CO", postalCode: "80202", vipTier: "STANDARD", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80" },
    { id: "cust-06", name: "Sophia Martinez", email: "sophia.m@example.com", phone: "+1 (555) 678-9012", address: "321 Elm Boulevard", city: "Miami", state: "FL", postalCode: "33101", vipTier: "GOLD", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80" },
    { id: "cust-07", name: "Lucas Taylor", email: "lucas.t@example.com", phone: "+1 (555) 789-0123", address: "654 Maple Lane", city: "Portland", state: "OR", postalCode: "97201", vipTier: "STANDARD", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80" },
    { id: "cust-08", name: "Olivia Anderson", email: "olivia.a@example.com", phone: "+1 (555) 890-1234", address: "987 Cedar Drive", city: "Chicago", state: "IL", postalCode: "60601", vipTier: "PLATINUM", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" },
    { id: "cust-09", name: "Ethan Thomas", email: "ethan.t@example.com", phone: "+1 (555) 901-2345", address: "147 Birch Court", city: "Boston", state: "MA", postalCode: "02108", vipTier: "SILVER", avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80" },
    { id: "cust-10", name: "Ava Jackson", email: "ava.j@example.com", phone: "+1 (555) 012-3456", address: "258 Walnut Way", city: "San Francisco", state: "CA", postalCode: "94102", vipTier: "GOLD", avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80" },
    { id: "cust-11", name: "Liam White", email: "liam.w@example.com", phone: "+1 (555) 123-7890", address: "369 Spruce Street", city: "Atlanta", state: "GA", postalCode: "30301", vipTier: "STANDARD", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80" },
    { id: "cust-12", name: "Mia Harris", email: "mia.h@example.com", phone: "+1 (555) 234-8901", address: "480 Chestnut Circle", city: "Nashville", state: "TN", postalCode: "37201", vipTier: "STANDARD", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80" },
    { id: "cust-13", name: "Noah Martin", email: "noah.m@example.com", phone: "+1 (555) 345-9012", address: "591 Willow Road", city: "San Diego", state: "CA", postalCode: "92101", vipTier: "SILVER", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" },
    { id: "cust-14", name: "Isabella Thompson", email: "isabella.t@example.com", phone: "+1 (555) 456-0123", address: "702 Ash Avenue", city: "Phoenix", state: "AZ", postalCode: "85001", vipTier: "GOLD", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80" },
    { id: "cust-15", name: "William Garcia", email: "william.g@example.com", phone: "+1 (555) 567-1234", address: "813 Magnolia Path", city: "Dallas", state: "TX", postalCode: "75201", vipTier: "STANDARD", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80" },
    { id: "cust-16", name: "Charlotte Robinson", email: "charlotte.r@example.com", phone: "+1 (555) 678-2345", address: "924 Cypress Way", city: "Minneapolis", state: "MN", postalCode: "55401", vipTier: "PLATINUM", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" },
    { id: "cust-17", name: "Benjamin Clark", email: "benjamin.c@example.com", phone: "+1 (555) 789-3456", address: "135 Poplar Ridge", city: "Raleigh", state: "NC", postalCode: "27601", vipTier: "STANDARD", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80" },
    { id: "cust-18", name: "Amelia Lewis", email: "amelia.l@example.com", phone: "+1 (555) 890-4567", address: "246 Redwood Boulevard", city: "Philadelphia", state: "PA", postalCode: "19102", vipTier: "SILVER", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80" },
    { id: "cust-19", name: "Alexander Walker", email: "alexander.w@example.com", phone: "+1 (555) 901-5678", address: "357 Hickory Place", city: "Las Vegas", state: "NV", postalCode: "89101", vipTier: "GOLD", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80" },
    { id: "cust-20", name: "Harper Hall", email: "harper.h@example.com", phone: "+1 (555) 012-6789", address: "468 Sycamore Loop", city: "Salt Lake City", state: "UT", postalCode: "84101", vipTier: "STANDARD", avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80" },
  ];

  const customers: any[] = [];
  for (const c of customerSeeds) {
    const uId = `usr-${c.id}`;
    users.push({
      id: uId,
      email: c.email,
      name: c.name,
      role: "CUSTOMER",
      avatar: c.avatar,
      createdAt: new Date("2025-01-01T00:00:00Z"),
      updatedAt: new Date("2025-01-01T00:00:00Z"),
    });

    customers.push({
      id: c.id,
      userId: uId,
      phone: c.phone,
      address: c.address,
      city: c.city,
      state: c.state,
      postalCode: c.postalCode,
      country: "United States",
      emailNotifications: true,
      vipTier: c.vipTier,
      createdAt: new Date("2025-01-01T00:00:00Z"),
      updatedAt: new Date("2025-01-01T00:00:00Z"),
    });
  }

  const products: any[] = [
    { id: "prod-01", sku: "ELEC-SW4-BLK", name: "NovaFit Smartwatch Series 4", category: "Electronics", price: 299.99, stock: 45, returnPolicyDays: 30, description: "Advanced fitness smartwatch with titanium casing, AMOLED always-on display, ECG sensor, and 7-day battery life.", specs: '{"color":"Space Black","waterproof":"50m","battery":"7 days","compatibility":"iOS/Android"}' },
    { id: "prod-02", sku: "ELEC-EAR-PRO", name: "NovaPod Wireless Earbuds Pro", category: "Electronics", price: 179.99, stock: 80, returnPolicyDays: 30, description: "Active noise cancelling wireless earbuds with spatial audio, transparency mode, and wireless charging case.", specs: '{"anc":"Active Noise Cancelling","battery":"28h total","bluetooth":"5.3","color":"Glacier White"}' },
    { id: "prod-03", sku: "ELEC-HDP-ANC", name: "SoundPulse ANC Over-Ear Headphones", category: "Electronics", price: 249.99, stock: 35, returnPolicyDays: 30, description: "Studio-grade wireless over-ear headphones with 45mm drivers, hybrid noise cancellation, and ultra-soft memory foam.", specs: '{"driver":"45mm Titanium","battery":"40h","codec":"LDAC, AAC","weight":"260g"}' },
    { id: "prod-04", sku: "ELEC-CAM-4K", name: "Lumina 4K Ultra Action Camera", category: "Electronics", price: 199.99, stock: 25, returnPolicyDays: 30, description: "Compact waterproof action camera with dual color screens, 4K/60fps video, and HyperSmooth gyro stabilization.", specs: '{"resolution":"4K 60fps","waterproof":"10m bare","sensor":"Sony 1/2.3\\"","fov":"170 deg"}' },
    { id: "prod-05", sku: "ELEC-CHG-GAN", name: "PowerWave 65W GaN Fast Charger", category: "Electronics", price: 49.99, stock: 150, returnPolicyDays: 30, description: "Compact 3-port GaN fast charger with 2x USB-C and 1x USB-A ports, compatible with laptops, tablets, and phones.", specs: '{"power":"65W","ports":"2x USB-C, 1x USB-A","tech":"GaN III","weight":"110g"}' },
    { id: "prod-06", sku: "ELEC-BAT-MAG", name: "SwiftCharge Magnetic Battery Pack", category: "Electronics", price: 59.99, stock: 95, returnPolicyDays: 30, description: "10,000mAh magnetic wireless power bank with foldout kickstand and pass-through charging.", specs: '{"capacity":"10000mAh","wireless":"15W Mag","output":"20W PD","color":"Midnight Gray"}' },
    { id: "prod-07", sku: "ELEC-MON-27", name: "VisionMax 27\" 4K UHD IPS Monitor", category: "Electronics", price: 449.99, stock: 20, returnPolicyDays: 30, description: "Ultra-slim 27-inch 4K UHD designer monitor with 99% sRGB color gamut, USB-C 90W power delivery, and ergonomic stand.", specs: '{"size":"27 inch","panel":"IPS 4K","refresh":"75Hz","ports":"USB-C 90W, HDMI 2.1, DP"}' },
    { id: "prod-08", sku: "ELEC-KEY-RGB", name: "AuraDesk RGB Mechanical Keyboard", category: "Electronics", price: 129.99, stock: 60, returnPolicyDays: 30, description: "Custom hot-swappable wireless mechanical keyboard with lubricated tactile switches and sound-dampening gasket mount.", specs: '{"layout":"75%","switch":"NovaTactile Brown","connection":"Tri-mode 2.4G/BT/USB-C"}' },
    { id: "prod-09", sku: "APP-SHO-RUN", name: "AeroGrip Performance Running Shoes", category: "Apparel & Footwear", price: 139.99, stock: 70, returnPolicyDays: 30, description: "Lightweight carbon-plated running shoes with responsive foam cushioning and breathable engineered mesh upper.", specs: '{"size":"US 10.5","cushion":"HyperBounce Nitro","drop":"8mm","weight":"210g"}' },
    { id: "prod-10", sku: "APP-JKT-PRK", name: "ThermoShield All-Weather Parka", category: "Apparel & Footwear", price: 219.99, stock: 30, returnPolicyDays: 30, description: "Heavyweight windproof and waterproof winter parka with 700-fill responsible down insulation and storm hood.", specs: '{"insulation":"700 Fill Down","waterproof":"20,000mm","fit":"Regular","color":"Nordic Navy"}' },
    { id: "prod-11", sku: "APP-SWT-MER", name: "CloudKnit Merino Wool Sweater", category: "Apparel & Footwear", price: 99.99, stock: 85, returnPolicyDays: 30, description: "100% extra-fine Australian Merino wool crewneck sweater with temperature regulation and natural odor resistance.", specs: '{"material":"100% Merino Wool","weight":"260gsm","wash":"Hand wash/dry flat","color":"Charcoal"}' },
    { id: "prod-12", sku: "HOM-AIR-PUR", name: "UltraBreeze Air Purifier Pro", category: "Home & Kitchen", price: 189.99, stock: 40, returnPolicyDays: 30, description: "Smart HEPA H13 air purifier with real-time PM2.5 laser display, whisper-quiet sleep mode, and coverage up to 600 sq ft.", specs: '{"coverage":"600 sq ft","filter":"H13 True HEPA + Carbon","noise":"22dB min","app":"Wi-Fi Smart"}' },
    { id: "prod-13", sku: "HOM-ESP-PRO", name: "BrewMaster Precision Espresso Machine", category: "Home & Kitchen", price: 599.99, stock: 15, returnPolicyDays: 30, description: "Commercial-grade 15-bar Italian pump espresso machine with PID digital temperature control and stainless steel steam wand.", specs: '{"pump":"15 Bar Italian","boiler":"Thermoblock Dual","portafilter":"58mm Commercial"}' },
    { id: "prod-14", sku: "HOM-FRY-6IN", name: "AeroFry 6-in-1 Digital Air Fryer", category: "Home & Kitchen", price: 119.99, stock: 50, returnPolicyDays: 30, description: "Large 6-quart non-stick basket air fryer with 360-degree rapid heat circulation and one-touch digital presets.", specs: '{"capacity":"6.0 Quart","presets":"6 Programs","temp":"105F - 400F","power":"1700W"}' },
    { id: "prod-15", sku: "FIT-GYM-SET", name: "FlexForm Resistance Training Set", category: "Fitness & Outdoors", price: 49.99, stock: 120, returnPolicyDays: 30, description: "Stackable 5-band latex resistance system with heavy-duty metal carabiners, foam handles, door anchor, and ankle straps.", specs: '{"resistance":"Up to 150 lbs total","material":"100% Natural Malaysian Latex"}' },
    { id: "prod-16", sku: "BEA-DRY-ION", name: "SilkCare 110,000 RPM Ionic Hair Dryer", category: "Beauty & Personal Care", price: 169.99, stock: 40, returnPolicyDays: 30, description: "Brushless digital motor high-speed hair dryer with 200 million negative ions for fast drying with zero heat damage.", specs: '{"motor":"110,000 RPM BLDC","noise":"<59dB","nozzles":"Magnetic Diffuser + Concentrator"}' },
  ];

  const orders: any[] = [];
  const orderItems: any[] = [];
  const payments: any[] = [];
  const returnRequests: any[] = [];

  // Order 1: Sarah Johnson -> ORD-9821
  const ord1 = {
    id: "ord-01",
    orderNumber: "ORD-9821",
    customerId: "cust-01",
    status: "DELIVERED",
    totalAmount: 479.98,
    shippingAddress: "742 Evergreen Terrace, Springfield, OR 97477",
    trackingNumber: "FDX-982144721",
    carrier: "FedEx Express",
    createdAt: new Date(Date.now() - 5 * 86400000),
    deliveredAt: new Date(Date.now() - 2 * 86400000),
    updatedAt: new Date(),
  };
  orders.push(ord1);

  orderItems.push(
    { id: "item-01", orderId: "ord-01", productId: "prod-01", quantity: 1, unitPrice: 299.99, isReturnEligible: true },
    { id: "item-02", orderId: "ord-01", productId: "prod-02", quantity: 1, unitPrice: 179.99, isReturnEligible: true }
  );

  payments.push({
    id: "pay-01",
    orderId: "ord-01",
    customerId: "cust-01",
    amount: 479.98,
    method: "CREDIT_CARD",
    status: "COMPLETED",
    transactionId: "TXN-SRH-98210",
    lastFour: "4242",
    createdAt: new Date(Date.now() - 5 * 86400000),
  });

  returnRequests.push({
    id: "ret-01",
    returnNumber: "RET-1001",
    orderId: "ord-01",
    customerId: "cust-01",
    status: "APPROVED",
    reason: "Earbuds case lid doesn't latch securely",
    returnItems: JSON.stringify([{ productId: "prod-02", name: "NovaPod Wireless Earbuds Pro", quantity: 1, price: 179.99 }]),
    trackingNumber: "RET-FDX-998811",
    refundAmount: 179.99,
    createdAt: new Date(Date.now() - 1 * 86400000),
    updatedAt: new Date(),
  });

  // Order 2: Sarah Johnson -> ORD-9104
  orders.push({
    id: "ord-02",
    orderNumber: "ORD-9104",
    customerId: "cust-01",
    status: "SHIPPED",
    totalAmount: 99.99,
    shippingAddress: "742 Evergreen Terrace, Springfield, OR 97477",
    trackingNumber: "UPS-910488219",
    carrier: "UPS Ground",
    createdAt: new Date(Date.now() - 2 * 86400000),
    estimatedDelivery: new Date(Date.now() + 2 * 86400000),
    updatedAt: new Date(),
  });

  orderItems.push({ id: "item-03", orderId: "ord-02", productId: "prod-11", quantity: 1, unitPrice: 99.99, isReturnEligible: true });

  payments.push({
    id: "pay-02",
    orderId: "ord-02",
    customerId: "cust-01",
    amount: 99.99,
    method: "APPLE_PAY",
    status: "COMPLETED",
    transactionId: "TXN-SRH-91041",
    lastFour: "8821",
    createdAt: new Date(Date.now() - 2 * 86400000),
  });

  // Order 3: David Smith -> ORD-8412
  orders.push({
    id: "ord-03",
    orderNumber: "ORD-8412",
    customerId: "cust-02",
    status: "DELIVERED",
    totalAmount: 239.98,
    shippingAddress: "124 Conch Street, Bikini Bottom, CA 90210",
    trackingNumber: "FDX-841299301",
    carrier: "FedEx Express",
    createdAt: new Date(Date.now() - 14 * 86400000),
    deliveredAt: new Date(Date.now() - 11 * 86400000),
    updatedAt: new Date(),
  });

  orderItems.push(
    { id: "item-04", orderId: "ord-03", productId: "prod-09", quantity: 1, unitPrice: 139.99, isReturnEligible: true },
    { id: "item-05", orderId: "ord-03", productId: "prod-11", quantity: 1, unitPrice: 99.99, isReturnEligible: true }
  );

  payments.push({
    id: "pay-03",
    orderId: "ord-03",
    customerId: "cust-02",
    amount: 239.98,
    method: "CREDIT_CARD",
    status: "COMPLETED",
    transactionId: "TXN-DVD-84120",
    lastFour: "1122",
    createdAt: new Date(Date.now() - 14 * 86400000),
  });

  returnRequests.push({
    id: "ret-02",
    returnNumber: "RET-1002",
    orderId: "ord-03",
    customerId: "cust-02",
    status: "PENDING",
    reason: "Running shoes are half a size too small, need exchange for 11",
    returnItems: JSON.stringify([{ productId: "prod-09", name: "AeroGrip Performance Running Shoes", quantity: 1, price: 139.99 }]),
    refundAmount: 139.99,
    createdAt: new Date(Date.now() - 2 * 3600000),
    updatedAt: new Date(),
  });

  // Order 4: James Wilson -> ORD-7734 (Duplicate Charge Simulated)
  orders.push({
    id: "ord-04",
    orderNumber: "ORD-7734",
    customerId: "cust-03",
    status: "DELIVERED",
    totalAmount: 189.99,
    shippingAddress: "221B Baker Street, Seattle, WA 98101",
    trackingNumber: "UPS-773400192",
    carrier: "UPS Ground",
    createdAt: new Date(Date.now() - 6 * 86400000),
    deliveredAt: new Date(Date.now() - 3 * 86400000),
    updatedAt: new Date(),
  });

  orderItems.push({ id: "item-06", orderId: "ord-04", productId: "prod-12", quantity: 1, unitPrice: 189.99, isReturnEligible: true });

  payments.push(
    {
      id: "pay-04",
      orderId: "ord-04",
      customerId: "cust-03",
      amount: 189.99,
      method: "CREDIT_CARD",
      status: "COMPLETED",
      transactionId: "TXN-JMS-77340A",
      lastFour: "9911",
      createdAt: new Date(Date.now() - 6 * 86400000),
    },
    {
      id: "pay-05",
      orderId: "ord-04",
      customerId: "cust-03",
      amount: 189.99,
      method: "CREDIT_CARD",
      status: "DISPUTED",
      transactionId: "TXN-JMS-77340B-DUP",
      lastFour: "9911",
      createdAt: new Date(Date.now() - 6 * 86400000),
    }
  );

  // Order 5: Emily Davis -> ORD-6129 (Warranty & Hardware Inquiry)
  orders.push({
    id: "ord-05",
    orderNumber: "ORD-6129",
    customerId: "cust-04",
    status: "DELIVERED",
    totalAmount: 249.99,
    shippingAddress: "456 Oak Avenue, Austin, TX 78701",
    trackingNumber: "FDX-612948110",
    carrier: "FedEx Express",
    createdAt: new Date(Date.now() - 10 * 86400000),
    deliveredAt: new Date(Date.now() - 7 * 86400000),
    updatedAt: new Date(),
  });

  orderItems.push({ id: "item-07", orderId: "ord-05", productId: "prod-03", quantity: 1, unitPrice: 249.99, isReturnEligible: true });

  payments.push({
    id: "pay-06",
    orderId: "ord-05",
    customerId: "cust-04",
    amount: 249.99,
    method: "CREDIT_CARD",
    status: "COMPLETED",
    transactionId: "TXN-EML-61290",
    lastFour: "5544",
    createdAt: new Date(Date.now() - 10 * 86400000),
  });

  // Generate 45 additional realistic orders for the remaining customer pool
  const statuses = ["DELIVERED", "DELIVERED", "SHIPPED", "PROCESSING", "DELAYED"];
  const carriers = ["FedEx Express", "UPS Ground", "DHL Express"];
  for (let i = 6; i <= 50; i++) {
    const cust = customers[i % customers.length];
    const ordId = `ord-${i}`;
    const ordNum = `ORD-${8000 + i}`;
    const st = statuses[i % statuses.length];
    const prod = products[i % products.length];
    const days = (i * 3) % 40 + 1;

    orders.push({
      id: ordId,
      orderNumber: ordNum,
      customerId: cust.id,
      status: st,
      totalAmount: prod.price,
      shippingAddress: `${cust.address}, ${cust.city}, ${cust.state} ${cust.postalCode}`,
      trackingNumber: st !== "PROCESSING" ? `TRK-FDX-${900000 + i}` : null,
      carrier: st !== "PROCESSING" ? carriers[i % carriers.length] : null,
      createdAt: new Date(Date.now() - days * 86400000),
      deliveredAt: st === "DELIVERED" ? new Date(Date.now() - (days - 3) * 86400000) : null,
      estimatedDelivery: st === "SHIPPED" ? new Date(Date.now() + 2 * 86400000) : null,
      updatedAt: new Date(),
    });

    orderItems.push({
      id: `item-${i + 10}`,
      orderId: ordId,
      productId: prod.id,
      quantity: 1,
      unitPrice: prod.price,
      isReturnEligible: days <= 30,
    });

    payments.push({
      id: `pay-${i + 10}`,
      orderId: ordId,
      customerId: cust.id,
      amount: prod.price,
      method: "CREDIT_CARD",
      status: "COMPLETED",
      transactionId: `TXN-${ordNum}-${i}`,
      lastFour: `${1000 + (i * 27) % 8999}`,
      createdAt: new Date(Date.now() - days * 86400000),
    });
  }

  const knowledgeArticles: any[] = [
    {
      id: "art-01",
      slug: "shipping-delivery-policy",
      title: "NovaMart Shipping & Delivery Policy",
      category: "SHIPPING",
      tags: "shipping, delivery, tracking, express, standard, international",
      excerpt: "Comprehensive guide on shipping speeds, carriers, tracking timelines, and international customs.",
      content: `1. Shipping Methods & Timeframes\nNovaMart partners with premier carriers including FedEx, UPS, and DHL.\nStandard Ground (3-5 business days): Free on orders over $50.\nExpress 2-Day Air (2 business days): Flat rate $14.99.\nOvernight Priority (Next business day): Flat rate $24.99.\n\n2. Order Tracking\nTracking updates appear within 12-24 hours of package departure.\n\n3. Delivery Delays\nIf your shipment has not arrived within 48 hours past its estimated delivery date, our AI and support team can immediately initiate carrier trace inquiries.`,
      isPublished: true,
      viewCount: 142,
      helpfulCount: 38,
      createdAt: new Date("2025-01-01T00:00:00Z"),
      updatedAt: new Date("2025-01-01T00:00:00Z"),
    },
    {
      id: "art-02",
      slug: "30-day-return-exchange-policy",
      title: "30-Day Return & Exchange Policy",
      category: "RETURNS",
      tags: "returns, exchange, eligibility, 30 days, return label, refund",
      excerpt: "Step-by-step instructions on returning items within 30 days of delivery, condition requirements, and free return labels.",
      content: `1. 30-Day Return Window\nCustomers may return most items purchased from NovaMart within 30 days of confirmed delivery for a full refund.\n\n2. Return Eligibility Requirements\nProducts must be in original condition with all accessories, cables, documentation, and original packaging.\n\n3. Free Prepaid Return Labels\nNovaMart provides prepaid return shipping labels for all domestic returns. Once approved by our AI or agent, print and attach the digital label.`,
      isPublished: true,
      viewCount: 284,
      helpfulCount: 92,
      createdAt: new Date("2025-01-01T00:00:00Z"),
      updatedAt: new Date("2025-01-01T00:00:00Z"),
    },
    {
      id: "art-03",
      slug: "refund-processing-timelines",
      title: "Refund Processing Timelines & Methods",
      category: "REFUNDS",
      tags: "refunds, timeline, processing, credit card, paypal, store credit",
      excerpt: "Detailed breakdown of refund processing times across Credit Cards, PayPal, Apple Pay, and Store Credit.",
      content: `1. Refund Processing Speed\nOnce returned items are received and inspected at our distribution hub, refunds are issued immediately.\n\n2. Financial Institution Timelines\nStore Credit: Instantaneous (0 days).\nPayPal & Apple Pay: 24 to 48 hours.\nCredit & Debit Cards: 3 to 5 business days.`,
      isPublished: true,
      viewCount: 195,
      helpfulCount: 47,
      createdAt: new Date("2025-01-01T00:00:00Z"),
      updatedAt: new Date("2025-01-01T00:00:00Z"),
    },
    {
      id: "art-04",
      slug: "payment-methods-duplicate-charges",
      title: "Payment Methods, Invoices & Duplicate Charge Resolution",
      category: "PAYMENTS",
      tags: "payments, billing, duplicate charge, invoice, security",
      excerpt: "How NovaMart secures payments and how to resolve pending authorizations or duplicate billing disputes.",
      content: `1. Accepted Payment Methods\nNovaMart accepts Visa, MasterCard, American Express, Discover, PayPal, Apple Pay, and Gift Cards.\n\n2. Duplicate Charges\nIf two finalized charges post to your bank, our AI support agent flags the billing transaction and routes it to our Tier 2 Finance team for an expedited refund within 2 hours.`,
      isPublished: true,
      viewCount: 98,
      helpfulCount: 22,
      createdAt: new Date("2025-01-01T00:00:00Z"),
      updatedAt: new Date("2025-01-01T00:00:00Z"),
    },
  ];

  const conversations: any[] = [];
  const messages: any[] = [];
  const tickets: any[] = [];
  const customerFeedbacks: any[] = [];

  // Conversation 1: Sarah Johnson - Return Request
  conversations.push({
    id: "conv-01",
    conversationNumber: "CONV-401",
    customerId: "cust-01",
    assignedAgentId: agent1Id,
    status: "AGENT_ACTIVE",
    category: "RETURN",
    priority: "MEDIUM",
    aiConfidence: 0.94,
    aiIntent: "RETURN_REQUEST",
    summary: "Customer requested return for NovaPod Wireless Earbuds Pro (Order ORD-9821) due to loose lid latch. AI verified 30-day eligibility, approved return request RET-1001, and transferred to Agent Alex for return label generation.",
    channel: "WEB_CHAT",
    createdAt: new Date(Date.now() - 40 * 60000),
    updatedAt: new Date(Date.now() - 20 * 60000),
  });

  messages.push(
    {
      id: "msg-01",
      conversationId: "conv-01",
      senderType: "CUSTOMER",
      senderName: "Sarah Johnson",
      content: "Hi! I received my order ORD-9821 two days ago, but the case lid on the NovaPod Earbuds doesn't latch properly. Can I return or exchange them?",
      createdAt: new Date(Date.now() - 40 * 60000),
    },
    {
      id: "msg-02",
      conversationId: "conv-01",
      senderType: "AI",
      senderName: "NovaMart AI Assistant",
      content: "Hello Sarah! 👋 I can certainly help you with that. I've located your order ORD-9821 delivered on Aug 29th. The NovaPod Wireless Earbuds Pro ($179.99) is fully eligible for our 30-day free return policy.\n\n✅ I have generated return request RET-1001 for you. I'm also connecting you with our support specialist to ensure you get your prepaid return shipping label.",
      toolCalls: JSON.stringify([
        { tool: "getOrderDetails", args: { orderId: "ORD-9821" }, result: { orderNumber: "ORD-9821", status: "DELIVERED" } },
        { tool: "checkReturnEligibility", args: { orderId: "ORD-9821" }, result: { eligible: true, daysRemaining: 28 } },
        { tool: "createReturnRequest", args: { orderId: "ORD-9821", reason: "Defective lid" }, result: { returnNumber: "RET-1001" } },
      ]),
      createdAt: new Date(Date.now() - 39 * 60000),
    },
    {
      id: "msg-03",
      conversationId: "conv-01",
      senderType: "AGENT",
      senderName: "Alex Rivera",
      content: "Hi Sarah! Alex here from Tier 2 Support. I reviewed the return request RET-1001 created by our AI assistant. I have emailed you the prepaid FedEx return label and issued approval!",
      createdAt: new Date(Date.now() - 20 * 60000),
    }
  );

  tickets.push({
    id: "tck-01",
    ticketNumber: "TCK-8801",
    conversationId: "conv-01",
    customerId: "cust-01",
    assignedAgentId: agent1Id,
    category: "RETURN",
    priority: "MEDIUM",
    status: "IN_PROGRESS",
    aiSummary: "Return request RET-1001 for NovaPod Earbuds Pro (ORD-9821). Agent sent prepaid FedEx label.",
    createdAt: new Date(Date.now() - 39 * 60000),
    updatedAt: new Date(Date.now() - 20 * 60000),
  });

  // Conversation 2: James Wilson - Duplicate Billing Dispute (Urgent)
  conversations.push({
    id: "conv-02",
    conversationNumber: "CONV-402",
    customerId: "cust-03",
    assignedAgentId: agent1Id,
    status: "NEEDS_HUMAN",
    category: "PAYMENT",
    priority: "URGENT",
    aiConfidence: 0.98,
    aiIntent: "PAYMENT_PROBLEM",
    summary: "Customer detected duplicate credit card charge for order ORD-7734 ($189.99 x 2). AI detected duplicate transaction TXN-JMS-77340B-DUP and automatically escalated with URGENT priority.",
    channel: "WEB_CHAT",
    createdAt: new Date(Date.now() - 15 * 60000),
    updatedAt: new Date(Date.now() - 14 * 60000),
  });

  messages.push(
    {
      id: "msg-04",
      conversationId: "conv-02",
      senderType: "CUSTOMER",
      senderName: "James Wilson",
      content: "Urgent! I looked at my credit card statement and I was charged twice ($189.99 each) for my Air Purifier order ORD-7734.",
      createdAt: new Date(Date.now() - 15 * 60000),
    },
    {
      id: "msg-05",
      conversationId: "conv-02",
      senderType: "AI",
      senderName: "NovaMart AI Assistant",
      content: "Hello James. I understand this is urgent and I apologize for the concern. I've verified your order ORD-7734 and identified a pending duplicate transaction hold on your card ending in 9911.\n\nBecause this involves billing authorization, I have automatically created an URGENT support ticket (TCK-8802) and notified our Senior Billing team to void the duplicate charge immediately.",
      toolCalls: JSON.stringify([
        { tool: "getOrderDetails", args: { orderId: "ORD-7734" }, result: { orderNumber: "ORD-7734", total: 189.99 } },
        { tool: "getRefundStatus", args: { orderId: "ORD-7734" }, result: { duplicateFound: true, amount: 189.99 } },
        { tool: "createSupportTicket", args: { priority: "URGENT", category: "PAYMENT" }, result: { ticketNumber: "TCK-8802" } },
      ]),
      createdAt: new Date(Date.now() - 14 * 60000),
    }
  );

  tickets.push({
    id: "tck-02",
    ticketNumber: "TCK-8802",
    conversationId: "conv-02",
    customerId: "cust-03",
    assignedAgentId: agent1Id,
    category: "PAYMENT",
    priority: "URGENT",
    status: "OPEN",
    aiSummary: "Duplicate charge detected on order ORD-7734. TXN-JMS-77340B-DUP needs reversal.",
    createdAt: new Date(Date.now() - 14 * 60000),
    updatedAt: new Date(Date.now() - 14 * 60000),
  });

  // Conversation 3: David Smith - Order Status (Resolved by AI with 5-star CSAT)
  conversations.push({
    id: "conv-03",
    conversationNumber: "CONV-403",
    customerId: "cust-02",
    status: "RESOLVED",
    category: "ORDER_STATUS",
    priority: "LOW",
    aiConfidence: 0.99,
    aiIntent: "ORDER_STATUS",
    summary: "Customer inquired about delivery confirmation and tracking for ORD-8412. AI provided FedEx tracking number and delivery timestamp. Customer satisfied.",
    channel: "WEB_CHAT",
    createdAt: new Date(Date.now() - 3 * 3600000),
    updatedAt: new Date(Date.now() - 2 * 3600000),
    resolvedAt: new Date(Date.now() - 2 * 3600000),
  });

  messages.push(
    {
      id: "msg-06",
      conversationId: "conv-03",
      senderType: "CUSTOMER",
      senderName: "David Smith",
      content: "Where is my order ORD-8412?",
      createdAt: new Date(Date.now() - 3 * 3600000),
    },
    {
      id: "msg-07",
      conversationId: "conv-03",
      senderType: "AI",
      senderName: "NovaMart AI Assistant",
      content: "Hi David! 👋 Your order ORD-8412 was successfully delivered by FedEx Express (Tracking: FDX-841299301) to your front porch at 124 Conch Street.\n\nIs there anything else I can assist you with today?",
      toolCalls: JSON.stringify([
        { tool: "getMyOrders", args: {}, result: [{ orderNumber: "ORD-8412", status: "DELIVERED" }] },
      ]),
      createdAt: new Date(Date.now() - 3 * 3600000 + 5000),
    },
    {
      id: "msg-08",
      conversationId: "conv-03",
      senderType: "CUSTOMER",
      senderName: "David Smith",
      content: "Found it by the side entrance, thanks so much!",
      createdAt: new Date(Date.now() - 2 * 3600000),
    },
    {
      id: "msg-09",
      conversationId: "conv-03",
      senderType: "AI",
      senderName: "NovaMart AI Assistant",
      content: "You're very welcome! Have a fantastic day enjoying your new gear! ✨",
      createdAt: new Date(Date.now() - 2 * 3600000 + 2000),
    }
  );

  tickets.push({
    id: "tck-03",
    ticketNumber: "TCK-8803",
    conversationId: "conv-03",
    customerId: "cust-02",
    category: "ORDER_STATUS",
    priority: "LOW",
    status: "RESOLVED",
    aiSummary: "Order delivery location clarified. Successfully resolved automatically by AI.",
    createdAt: new Date(Date.now() - 3 * 3600000),
    updatedAt: new Date(Date.now() - 2 * 3600000),
    resolvedAt: new Date(Date.now() - 2 * 3600000),
  });

  customerFeedbacks.push({
    id: "csat-01",
    conversationId: "conv-03",
    customerId: "cust-02",
    rating: 5,
    comment: "Super quick and accurate! Found my package immediately.",
    createdAt: new Date(Date.now() - 2 * 3600000),
  });

  // Conversation 4: Emily Davis - Warranty Replacement & Exchange (Handled by Agent Maya Patel)
  conversations.push({
    id: "conv-04",
    conversationNumber: "CONV-404",
    customerId: "cust-04",
    assignedAgentId: agent2Id,
    status: "AGENT_ACTIVE",
    category: "EXCHANGE",
    priority: "MEDIUM",
    aiConfidence: 0.96,
    aiIntent: "EXCHANGE",
    summary: "Customer Emily Davis requested warranty replacement for loose hinge on SoundPulse ANC Headphones (ORD-6129). Agent Maya Patel approved RMA-7721 and dispatched replacement pair.",
    channel: "WEB_CHAT",
    createdAt: new Date(Date.now() - 35 * 60000),
    updatedAt: new Date(Date.now() - 10 * 60000),
  });

  messages.push(
    {
      id: "msg-10",
      conversationId: "conv-04",
      senderType: "CUSTOMER",
      senderName: "Emily Davis",
      content: "Hello! My SoundPulse Headphones (ORD-6129) developed a loose right hinge. Is this covered under warranty for a replacement?",
      createdAt: new Date(Date.now() - 35 * 60000),
    },
    {
      id: "msg-11",
      conversationId: "conv-04",
      senderType: "AI",
      senderName: "NovaMart AI Assistant",
      content: "Hi Emily! 👋 Yes, all NovaMart electronics include a comprehensive 1-Year Manufacturer Warranty. I've verified your order ORD-6129 is fully covered.\n\nI've opened warranty ticket TCK-8804 and connected you with Maya from our Fulfillment & Warranty team to arrange an instant replacement!",
      toolCalls: JSON.stringify([
        { tool: "getOrderDetails", args: { orderId: "ORD-6129" }, result: { orderNumber: "ORD-6129", status: "DELIVERED" } },
        { tool: "createSupportTicket", args: { category: "EXCHANGE", priority: "MEDIUM" }, result: { ticketNumber: "TCK-8804" } },
      ]),
      createdAt: new Date(Date.now() - 34 * 60000),
    },
    {
      id: "msg-12",
      conversationId: "conv-04",
      senderType: "AGENT",
      senderName: "Maya Patel",
      content: "Hi Emily! Maya here from Warranty & Exchanges. I've approved replacement RMA-7721 and emailed you a prepaid FedEx shipping label. Your new replacement pair is preparing to ship!",
      createdAt: new Date(Date.now() - 10 * 60000),
    }
  );

  tickets.push({
    id: "tck-04",
    ticketNumber: "TCK-8804",
    conversationId: "conv-04",
    customerId: "cust-04",
    assignedAgentId: agent2Id,
    category: "EXCHANGE",
    priority: "MEDIUM",
    status: "IN_PROGRESS",
    aiSummary: "Warranty replacement RMA-7721 for SoundPulse Headphones (ORD-6129). Agent Maya approved prepaid return and replacement dispatch.",
    createdAt: new Date(Date.now() - 34 * 60000),
    updatedAt: new Date(Date.now() - 10 * 60000),
  });

  const emailEvents: any[] = [
    {
      id: "eml-01",
      customerId: "cust-01",
      recipientEmail: "sarah.j@example.com",
      subject: "Return Request RET-1001 Approved — Prepaid Shipping Label",
      templateType: "RETURN_APPROVED",
      contentPreview: "Your return request RET-1001 for NovaPod Wireless Earbuds Pro has been approved...",
      htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;"><h2 style="color: #4f46e5;">NovaMart Support</h2><p>Dear Sarah,</p><p>Your return request <strong>RET-1001</strong> for order <strong>ORD-9821</strong> has been approved.</p><p><strong>Prepaid Return Tracking:</strong> RET-FDX-998811</p></div>`,
      status: "SENT",
      createdAt: new Date(Date.now() - 20 * 60000),
    },
    {
      id: "eml-02",
      customerId: "cust-03",
      recipientEmail: "james.w@example.com",
      subject: "Support Ticket Created — [TCK-8802] Urgent Billing Review",
      templateType: "TICKET_CREATED",
      contentPreview: "We have opened an Urgent Support Ticket TCK-8802 regarding the duplicate charge reported for order ORD-7734...",
      htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;"><h2 style="color: #4f46e5;">NovaMart Support</h2><p>Dear James,</p><p>We have opened an Urgent Support Ticket <strong>TCK-8802</strong> regarding order <strong>ORD-7734</strong>.</p></div>`,
      status: "SENT",
      createdAt: new Date(Date.now() - 14 * 60000),
    },
  ];

  const activityLogs: any[] = [
    { id: "act-01", actorType: "CUSTOMER", actorName: "Sarah Johnson", action: "LOGIN", entityType: "User", entityId: "cust-01", details: JSON.stringify({ ip: "192.168.1.101", device: "Desktop Chrome" }), createdAt: new Date(Date.now() - 45 * 60000) },
    { id: "act-02", actorType: "CUSTOMER", actorName: "Sarah Johnson", action: "MESSAGE_SENT", entityType: "Conversation", entityId: "conv-01", details: JSON.stringify({ preview: "Can I return or exchange them?" }), createdAt: new Date(Date.now() - 40 * 60000) },
    { id: "act-03", actorType: "AI", actorName: "NovaMart AI Assistant", action: "AI_INTENT_CLASSIFIED", entityType: "Conversation", entityId: "conv-01", details: JSON.stringify({ intent: "RETURN_REQUEST", confidence: 0.94, risk: "LOW" }), createdAt: new Date(Date.now() - 39 * 60000) },
    { id: "act-04", actorType: "AI", actorName: "NovaMart AI Assistant", action: "AI_TOOL_CALLED", entityType: "Conversation", entityId: "conv-01", details: JSON.stringify({ tool: "checkReturnEligibility", orderId: "ORD-9821", eligible: true }), createdAt: new Date(Date.now() - 39 * 60000) },
    { id: "act-05", actorType: "AI", actorName: "NovaMart AI Assistant", action: "RETURN_CREATED", entityType: "ReturnRequest", entityId: "ret-01", details: JSON.stringify({ returnNumber: "RET-1001", amount: 179.99 }), createdAt: new Date(Date.now() - 39 * 60000) },
    { id: "act-06", actorType: "AI", actorName: "NovaMart AI Assistant", action: "TICKET_CREATED", entityType: "Ticket", entityId: "tck-01", details: JSON.stringify({ ticketNumber: "TCK-8801", category: "RETURN" }), createdAt: new Date(Date.now() - 38 * 60000) },
    { id: "act-07", actorType: "AGENT", actorName: "Alex Rivera", action: "AGENT_TAKEOVER", entityType: "Conversation", entityId: "conv-01", details: JSON.stringify({ assignedTo: "Alex Rivera" }), createdAt: new Date(Date.now() - 25 * 60000) },
    { id: "act-08", actorType: "SYSTEM", actorName: "NovaMart Mailer", action: "EMAIL_SENT", entityType: "EmailEvent", entityId: "eml-01", details: JSON.stringify({ recipient: "sarah.j@example.com", template: "RETURN_APPROVED" }), createdAt: new Date(Date.now() - 20 * 60000) },
  ];

  const notifications: any[] = [
    {
      id: "notif-01",
      recipientRole: "SUPPORT_AGENT",
      title: "🚨 Urgent Billing Escalation",
      message: "Customer James Wilson reported a duplicate charge for order ORD-7734. Ticket TCK-8802 created.",
      type: "ESCALATION",
      isRead: false,
      link: "/agent?conv=CONV-402",
      createdAt: new Date(Date.now() - 14 * 60000),
    },
    {
      id: "notif-02",
      recipientRole: "SUPPORT_AGENT",
      title: "📦 Return Request RET-1001 Assigned",
      message: "Sarah Johnson requested return for NovaPod Earbuds Pro.",
      type: "NEW_CONVERSATION",
      isRead: true,
      link: "/agent?conv=CONV-401",
      createdAt: new Date(Date.now() - 38 * 60000),
    },
  ];

  return {
    users,
    customers,
    supportAgents,
    products,
    orders,
    orderItems,
    payments,
    returnRequests,
    conversations,
    messages,
    tickets,
    knowledgeArticles,
    notifications,
    emailEvents,
    activityLogs,
    customerFeedbacks,
  };
}

export const DEFAULT_TENANT_ID = "tenant_novamart_default";

class RelationalDatabase {
  private state: DBState;
  private indexes: {
    convByTenantAndCust: Map<string, any[]>;
    msgByTenantAndConv: Map<string, any[]>;
    ordersByTenantAndCust: Map<string, any[]>;
    ticketsByTenantAndCust: Map<string, any[]>;
  } = {
    convByTenantAndCust: new Map(),
    msgByTenantAndConv: new Map(),
    ordersByTenantAndCust: new Map(),
    ticketsByTenantAndCust: new Map(),
  };

  constructor() {
    this.state = this.loadOrCreate();
    this.rebuildIndexes();
  }

  private rebuildIndexes() {
    this.indexes.convByTenantAndCust.clear();
    this.indexes.msgByTenantAndConv.clear();
    this.indexes.ordersByTenantAndCust.clear();
    this.indexes.ticketsByTenantAndCust.clear();

    for (const c of this.state.conversations) {
      const tenant = c.tenantId || DEFAULT_TENANT_ID;
      const key = `${tenant}:${c.customerId}`;
      if (!this.indexes.convByTenantAndCust.has(key)) this.indexes.convByTenantAndCust.set(key, []);
      this.indexes.convByTenantAndCust.get(key)!.push(c);
    }

    for (const m of this.state.messages) {
      const tenant = m.tenantId || DEFAULT_TENANT_ID;
      const key = `${tenant}:${m.conversationId}`;
      if (!this.indexes.msgByTenantAndConv.has(key)) this.indexes.msgByTenantAndConv.set(key, []);
      this.indexes.msgByTenantAndConv.get(key)!.push(m);
    }

    for (const o of this.state.orders) {
      const tenant = o.tenantId || DEFAULT_TENANT_ID;
      const key = `${tenant}:${o.customerId}`;
      if (!this.indexes.ordersByTenantAndCust.has(key)) this.indexes.ordersByTenantAndCust.set(key, []);
      this.indexes.ordersByTenantAndCust.get(key)!.push(o);
    }

    for (const t of this.state.tickets) {
      const tenant = t.tenantId || DEFAULT_TENANT_ID;
      const key = `${tenant}:${t.customerId}`;
      if (!this.indexes.ticketsByTenantAndCust.has(key)) this.indexes.ticketsByTenantAndCust.set(key, []);
      this.indexes.ticketsByTenantAndCust.get(key)!.push(t);
    }
  }

  private loadOrCreate(): DBState {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          Array.isArray(parsed.customers) &&
          parsed.customers.length > 0 &&
          Array.isArray(parsed.users) &&
          parsed.users.length > 0
        ) {
          // Guarantee tenantId on all records for backwards compatibility
          for (const key of Object.keys(parsed) as (keyof DBState)[]) {
            if (Array.isArray(parsed[key])) {
              parsed[key].forEach((item: any) => {
                if (!item.tenantId) item.tenantId = DEFAULT_TENANT_ID;
              });
            }
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not read db file, initializing fresh seed data:", e);
    }
    const seed = getInitialSeedData();
    // Guarantee tenantId on initial seed
    for (const key of Object.keys(seed) as (keyof DBState)[]) {
      if (Array.isArray(seed[key])) {
        seed[key].forEach((item: any) => {
          if (!item.tenantId) item.tenantId = DEFAULT_TENANT_ID;
        });
      }
    }
    // Assign before saving: save() rebuilds indexes from this.state, which is
    // still undefined during construction on a fresh (never-seeded) boot.
    this.state = seed;
    this.save(seed);
    return seed;
  }

  private save(state?: DBState) {
    try {
      const s = state || this.state;
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(s, null, 2), "utf-8");
      try {
        fs.renameSync(tempFile, DB_FILE);
      } catch {
        // Fallback for Windows cross-device or file locks
        fs.copyFileSync(tempFile, DB_FILE);
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      }
      this.rebuildIndexes();
    } catch (e) {
      console.error("Failed to save db state:", e);
    }
  }

  private matchFilter(item: any, where?: any): boolean {
    if (!where || Object.keys(where).length === 0) return true;

    for (const [key, value] of Object.entries(where)) {
      if (key === "OR" && Array.isArray(value)) {
        const anyMatch = value.some((cond) => this.matchFilter(item, cond));
        if (!anyMatch) return false;
        continue;
      }
      if (key === "AND" && Array.isArray(value)) {
        const allMatch = value.every((cond) => this.matchFilter(item, cond));
        if (!allMatch) return false;
        continue;
      }

      // Handle nested relation filters or operators
      const itemVal = item[key];

      if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        const objVal = value as any;
        if ("contains" in objVal) {
          if (!String(itemVal || "").toLowerCase().includes(String(objVal.contains || "").toLowerCase())) {
            return false;
          }
        } else if ("in" in objVal && Array.isArray(objVal.in)) {
          if (!objVal.in.includes(itemVal)) return false;
        } else if ("not" in objVal) {
          if (itemVal === objVal.not) return false;
        } else if ("some" in objVal) {
          const rels = this.resolveRelationList(key, item.id);
          if (rels.length === 0) return false;
        } else if ("lt" in objVal) {
          if (new Date(itemVal) >= new Date(objVal.lt)) return false;
        } else if ("lte" in objVal) {
          if (new Date(itemVal) > new Date(objVal.lte)) return false;
        } else if ("gt" in objVal) {
          if (new Date(itemVal) <= new Date(objVal.gt)) return false;
        } else if ("gte" in objVal) {
          if (new Date(itemVal) < new Date(objVal.gte)) return false;
        }
      } else {
        if (itemVal !== value) return false;
      }
    }
    return true;
  }

  private resolveRelationList(relationName: string, parentId: string): any[] {
    switch (relationName) {
      case "items":
        return this.state.orderItems.filter((i) => i.orderId === parentId);
      case "orders":
        return this.state.orders.filter((o) => o.customerId === parentId);
      case "payments":
        return this.state.payments.filter((p) => p.orderId === parentId || p.customerId === parentId);
      case "returns":
        return this.state.returnRequests.filter((r) => r.orderId === parentId || r.customerId === parentId);
      case "messages":
        return this.state.messages.filter((m) => m.conversationId === parentId);
      case "tickets":
        return this.state.tickets.filter((t) => t.conversationId === parentId || t.customerId === parentId || t.assignedAgentId === parentId);
      case "conversations":
        return this.state.conversations.filter((c) => c.customerId === parentId || c.assignedAgentId === parentId);
      case "emailEvents":
        return this.state.emailEvents.filter((e) => e.customerId === parentId);
      case "feedback":
        return this.state.customerFeedbacks.filter((f) => f.conversationId === parentId || f.customerId === parentId);
      default:
        return [];
    }
  }

  private attachIncludes(item: any, table: string, include?: any): any {
    if (!item || !include) return item;
    const cloned = { ...item };

    for (const [relKey, relInclude] of Object.entries(include)) {
      if (!relInclude) continue;

      if (table === "users") {
        if (relKey === "customer") cloned.customer = this.attachIncludes(this.state.customers.find((c) => c.userId === item.id), "customers", (relInclude as any).include);
        if (relKey === "agent") cloned.agent = this.attachIncludes(this.state.supportAgents.find((a) => a.userId === item.id), "supportAgents", (relInclude as any).include);
      } else if (table === "customers") {
        if (relKey === "user") cloned.user = this.state.users.find((u) => u.id === item.userId);
        if (relKey === "orders") cloned.orders = this.state.orders.filter((o) => o.customerId === item.id).map((o) => this.attachIncludes(o, "orders", (relInclude as any).include));
        if (relKey === "returns") cloned.returns = this.state.returnRequests.filter((r) => r.customerId === item.id).map((r) => this.attachIncludes(r, "returnRequests", (relInclude as any).include));
        if (relKey === "payments") cloned.payments = this.state.payments.filter((p) => p.customerId === item.id);
        if (relKey === "tickets") cloned.tickets = this.state.tickets.filter((t) => t.customerId === item.id);
        if (relKey === "conversations") cloned.conversations = this.state.conversations.filter((c) => c.customerId === item.id).map((c) => this.attachIncludes(c, "conversations", (relInclude as any).include));
      } else if (table === "orders") {
        if (relKey === "customer") cloned.customer = this.attachIncludes(this.state.customers.find((c) => c.id === item.customerId), "customers", (relInclude as any).include);
        if (relKey === "items") cloned.items = this.state.orderItems.filter((i) => i.orderId === item.id).map((i) => this.attachIncludes(i, "orderItems", (relInclude as any).include));
        if (relKey === "payments") cloned.payments = this.state.payments.filter((p) => p.orderId === item.id);
        if (relKey === "returns") cloned.returns = this.state.returnRequests.filter((r) => r.orderId === item.id);
      } else if (table === "orderItems") {
        if (relKey === "product") cloned.product = this.state.products.find((p) => p.id === item.productId);
        if (relKey === "order") cloned.order = this.state.orders.find((o) => o.id === item.orderId);
      } else if (table === "conversations") {
        if (relKey === "customer") cloned.customer = this.attachIncludes(this.state.customers.find((c) => c.id === item.customerId), "customers", (relInclude as any).include);
        if (relKey === "assignedAgent") cloned.assignedAgent = this.attachIncludes(this.state.supportAgents.find((a) => a.id === item.assignedAgentId), "supportAgents", (relInclude as any).include);
        if (relKey === "messages") cloned.messages = this.state.messages.filter((m) => m.conversationId === item.id);
        if (relKey === "tickets") cloned.tickets = this.state.tickets.filter((t) => t.conversationId === item.id);
        if (relKey === "feedback") cloned.feedback = this.state.customerFeedbacks.find((f) => f.conversationId === item.id);
      } else if (table === "tickets") {
        if (relKey === "customer") cloned.customer = this.attachIncludes(this.state.customers.find((c) => c.id === item.customerId), "customers", (relInclude as any).include);
        if (relKey === "assignedAgent") cloned.assignedAgent = this.attachIncludes(this.state.supportAgents.find((a) => a.id === item.assignedAgentId), "supportAgents", (relInclude as any).include);
        if (relKey === "conversation") cloned.conversation = this.state.conversations.find((c) => c.id === item.conversationId);
      } else if (table === "supportAgents") {
        if (relKey === "user") cloned.user = this.state.users.find((u) => u.id === item.userId);
      } else if (table === "returnRequests") {
        if (relKey === "customer") cloned.customer = this.attachIncludes(this.state.customers.find((c) => c.id === item.customerId), "customers", (relInclude as any).include);
        if (relKey === "order") cloned.order = this.attachIncludes(this.state.orders.find((o) => o.id === item.orderId), "orders", (relInclude as any).include);
      } else if (table === "emailEvents") {
        if (relKey === "customer") cloned.customer = this.attachIncludes(this.state.customers.find((c) => c.id === item.customerId), "customers", (relInclude as any).include);
      }
    }
    return cloned;
  }

  // Model accessor factory
  private createModel(tableName: keyof DBState, singularName: string) {
    return {
      findMany: async (args: any = {}) => {
        let list = [...this.state[tableName]];
        if (args.where) {
          list = list.filter((item) => this.matchFilter(item, args.where));
        }
        if (args.orderBy) {
          const orders = Array.isArray(args.orderBy) ? args.orderBy : [args.orderBy];
          list.sort((a, b) => {
            for (const order of orders) {
              const [field, dir] = Object.entries(order)[0];
              const aVal = a[field];
              const bVal = b[field];
              if (aVal < bVal) return dir === "asc" ? -1 : 1;
              if (aVal > bVal) return dir === "asc" ? 1 : -1;
            }
            return 0;
          });
        }
        // Cursor-based pagination
        if (args.cursor && args.cursor.id) {
          const cursorIndex = list.findIndex((item) => item.id === args.cursor.id);
          if (cursorIndex !== -1) {
            list = list.slice(cursorIndex + 1);
          }
        }
        // Offset pagination
        if (args.skip) {
          list = list.slice(args.skip);
        }
        // Limit pagination
        if (args.take) {
          list = list.slice(0, args.take);
        }
        return list.map((item) => this.attachIncludes(item, singularName, args.include));
      },

      findFirst: async (args: any = {}) => {
        let list = [...this.state[tableName]];
        if (args.where) {
          list = list.filter((item) => this.matchFilter(item, args.where));
        }
        const item = list[0] || null;
        return item ? this.attachIncludes(item, singularName, args.include) : null;
      },

      findUnique: async (args: any = {}) => {
        let list = [...this.state[tableName]];
        if (args.where) {
          list = list.filter((item) => this.matchFilter(item, args.where));
        }
        const item = list[0] || null;
        return item ? this.attachIncludes(item, singularName, args.include) : null;
      },

      create: async (args: any) => {
        const item = {
          id: args.data.id || uuid(),
          tenantId: args.data.tenantId || DEFAULT_TENANT_ID,
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.state[tableName].push(item);
        this.save();
        return this.attachIncludes(item, singularName, args.include);
      },

      createMany: async (args: any) => {
        const created: any[] = [];
        for (const record of args.data || []) {
          const item = {
            id: record.id || uuid(),
            tenantId: record.tenantId || DEFAULT_TENANT_ID,
            ...record,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          this.state[tableName].push(item);
          created.push(item);
        }
        this.save();
        return { count: created.length };
      },

      update: async (args: any) => {
        const index = this.state[tableName].findIndex((item) => this.matchFilter(item, args.where));
        if (index === -1) throw new Error(`Record to update not found in ${String(tableName)}`);
        this.state[tableName][index] = {
          ...this.state[tableName][index],
          ...args.data,
          updatedAt: new Date(),
        };
        this.save();
        return this.attachIncludes(this.state[tableName][index], singularName, args.include);
      },

      updateMany: async (args: any) => {
        let count = 0;
        for (let i = 0; i < this.state[tableName].length; i++) {
          if (!args.where || this.matchFilter(this.state[tableName][i], args.where)) {
            this.state[tableName][i] = {
              ...this.state[tableName][i],
              ...args.data,
              updatedAt: new Date(),
            };
            count++;
          }
        }
        if (count > 0) this.save();
        return { count };
      },

      upsert: async (args: any) => {
        const index = this.state[tableName].findIndex((item) => this.matchFilter(item, args.where));
        if (index !== -1) {
          this.state[tableName][index] = {
            ...this.state[tableName][index],
            ...args.update,
            updatedAt: new Date(),
          };
          this.save();
          return this.attachIncludes(this.state[tableName][index], singularName, args.include);
        } else {
          const item = {
            id: uuid(),
            tenantId: args.create?.tenantId || DEFAULT_TENANT_ID,
            ...args.create,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          this.state[tableName].push(item);
          this.save();
          return this.attachIncludes(item, singularName, args.include);
        }
      },

      delete: async (args: any) => {
        const index = this.state[tableName].findIndex((item) => this.matchFilter(item, args.where));
        if (index !== -1) {
          const [deleted] = this.state[tableName].splice(index, 1);
          this.save();
          return deleted;
        }
        return null;
      },

      deleteMany: async (args: any = {}) => {
        if (!args.where || Object.keys(args.where).length === 0) {
          const count = this.state[tableName].length;
          this.state[tableName] = [];
          this.save();
          return { count };
        }
        const initial = this.state[tableName].length;
        this.state[tableName] = this.state[tableName].filter((item) => !this.matchFilter(item, args.where));
        this.save();
        return { count: initial - this.state[tableName].length };
      },

      count: async (args: any = {}) => {
        if (!args.where || Object.keys(args.where).length === 0) return this.state[tableName].length;
        return this.state[tableName].filter((item) => this.matchFilter(item, args.where)).length;
      },

      groupBy: async (args: any = {}) => {
        const groups: Record<string, number> = {};
        for (const item of this.state[tableName]) {
          const key = item[args.by[0]];
          groups[key] = (groups[key] || 0) + 1;
        }
        return Object.entries(groups).map(([k, v]) => ({
          [args.by[0]]: k,
          _count: { [args.by[0]]: v },
        }));
      },
    };
  }

  // Atomic transactions support
  public async $transaction<T>(operations: Array<Promise<T>> | ((tx: RelationalDatabase) => Promise<T>)): Promise<T | T[]> {
    if (typeof operations === "function") {
      return await operations(this);
    }
    return await Promise.all(operations);
  }

  get user() { return this.createModel("users", "users"); }
  get customer() { return this.createModel("customers", "customers"); }
  get supportAgent() { return this.createModel("supportAgents", "supportAgents"); }
  get product() { return this.createModel("products", "products"); }
  get order() { return this.createModel("orders", "orders"); }
  get orderItem() { return this.createModel("orderItems", "orderItems"); }
  get payment() { return this.createModel("payments", "payments"); }
  get returnRequest() { return this.createModel("returnRequests", "returnRequests"); }
  get conversation() { return this.createModel("conversations", "conversations"); }
  get message() { return this.createModel("messages", "messages"); }
  get ticket() { return this.createModel("tickets", "tickets"); }
  get knowledgeArticle() { return this.createModel("knowledgeArticles", "knowledgeArticles"); }
  get notification() { return this.createModel("notifications", "notifications"); }
  get emailEvent() { return this.createModel("emailEvents", "emailEvents"); }
  get activityLog() { return this.createModel("activityLogs", "activityLogs"); }
  get customerFeedback() { return this.createModel("customerFeedbacks", "customerFeedbacks"); }

  async $disconnect() { return; }
}

const globalForDb = globalThis as unknown as {
  prisma: RelationalDatabase | undefined;
};

export const prisma = globalForDb.prisma ?? new RelationalDatabase();
if (process.env.NODE_ENV !== "production") globalForDb.prisma = prisma;

