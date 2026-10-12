// NovaMart Support Platform - Database Seed Script
// LEGACY: written for a real Prisma engine (nested `create`/`include` writes).
// The app runtime uses a self-seeding JSON store (src/lib/prisma.ts) that does
// not support nested writes, so running this file directly fails midway.
// To reset demo data, use `npm run db:seed` (deletes the store; it reseeds
// automatically with fresh relative dates on next boot).
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🌱 Starting NovaMart database seed...");

  // Clean existing tables (in order of relations)
  await prisma.customerFeedback.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.emailEvent.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.returnRequest.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.knowledgeArticle.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.supportAgent.deleteMany();
  await prisma.user.deleteMany();

  console.log("Cleared existing data.");

  // 1. Create Staff & Admin Users
  const adminUser = await prisma.user.create({
    data: {
      email: "eleanor.v@novamart.com",
      name: "Eleanor Vance",
      role: "ADMIN",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  const agentUser1 = await prisma.user.create({
    data: {
      email: "alex.r@novamart.com",
      name: "Alex Rivera",
      role: "SUPPORT_AGENT",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      agent: {
        create: {
          department: "Tier 2 Support Specialist",
          isAvailable: true,
          activeConversations: 2,
          rating: 4.95,
        },
      },
    },
    include: { agent: true },
  });

  const agentUser2 = await prisma.user.create({
    data: {
      email: "maya.p@novamart.com",
      name: "Maya Patel",
      role: "SUPPORT_AGENT",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      agent: {
        create: {
          department: "Returns & Order Fulfillment",
          isAvailable: true,
          activeConversations: 1,
          rating: 4.88,
        },
      },
    },
    include: { agent: true },
  });

  const agentUser3 = await prisma.user.create({
    data: {
      email: "marcus.v@novamart.com",
      name: "Marcus Vance",
      role: "SUPPORT_AGENT",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      agent: {
        create: {
          department: "Billing & Escalation Lead",
          isAvailable: false,
          activeConversations: 0,
          rating: 4.92,
        },
      },
    },
    include: { agent: true },
  });

  // 2. Create 20 Realistic Customers
  const customerSeeds = [
    { name: "Sarah Johnson", email: "sarah.j@example.com", phone: "+1 (555) 234-5678", address: "742 Evergreen Terrace", city: "Springfield", state: "OR", postalCode: "97477", vipTier: "GOLD", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80" },
    { name: "David Smith", email: "david.smith@example.com", phone: "+1 (555) 876-5432", address: "124 Conch Street", city: "Bikini Bottom", state: "CA", postalCode: "90210", vipTier: "PLATINUM", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80" },
    { name: "James Wilson", email: "james.w@example.com", phone: "+1 (555) 345-6789", address: "221B Baker Street", city: "Seattle", state: "WA", postalCode: "98101", vipTier: "STANDARD", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80" },
    { name: "Emily Davis", email: "emily.d@example.com", phone: "+1 (555) 456-7890", address: "456 Oak Avenue", city: "Austin", state: "TX", postalCode: "78701", vipTier: "SILVER", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80" },
    { name: "Michael Brown", email: "michael.b@example.com", phone: "+1 (555) 567-8901", address: "789 Pine Road", city: "Denver", state: "CO", postalCode: "80202", vipTier: "STANDARD", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80" },
    { name: "Sophia Martinez", email: "sophia.m@example.com", phone: "+1 (555) 678-9012", address: "321 Elm Boulevard", city: "Miami", state: "FL", postalCode: "33101", vipTier: "GOLD", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80" },
    { name: "Lucas Taylor", email: "lucas.t@example.com", phone: "+1 (555) 789-0123", address: "654 Maple Lane", city: "Portland", state: "OR", postalCode: "97201", vipTier: "STANDARD", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80" },
    { name: "Olivia Anderson", email: "olivia.a@example.com", phone: "+1 (555) 890-1234", address: "987 Cedar Drive", city: "Chicago", state: "IL", postalCode: "60601", vipTier: "PLATINUM", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" },
    { name: "Ethan Thomas", email: "ethan.t@example.com", phone: "+1 (555) 901-2345", address: "147 Birch Court", city: "Boston", state: "MA", postalCode: "02108", vipTier: "SILVER", avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80" },
    { name: "Ava Jackson", email: "ava.j@example.com", phone: "+1 (555) 012-3456", address: "258 Walnut Way", city: "San Francisco", state: "CA", postalCode: "94102", vipTier: "GOLD", avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80" },
    { name: "Liam White", email: "liam.w@example.com", phone: "+1 (555) 123-7890", address: "369 Spruce Street", city: "Atlanta", state: "GA", postalCode: "30301", vipTier: "STANDARD", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80" },
    { name: "Mia Harris", email: "mia.h@example.com", phone: "+1 (555) 234-8901", address: "480 Chestnut Circle", city: "Nashville", state: "TN", postalCode: "37201", vipTier: "STANDARD", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80" },
    { name: "Noah Martin", email: "noah.m@example.com", phone: "+1 (555) 345-9012", address: "591 Willow Road", city: "San Diego", state: "CA", postalCode: "92101", vipTier: "SILVER", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" },
    { name: "Isabella Thompson", email: "isabella.t@example.com", phone: "+1 (555) 456-0123", address: "702 Ash Avenue", city: "Phoenix", state: "AZ", postalCode: "85001", vipTier: "GOLD", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80" },
    { name: "William Garcia", email: "william.g@example.com", phone: "+1 (555) 567-1234", address: "813 Magnolia Path", city: "Dallas", state: "TX", postalCode: "75201", vipTier: "STANDARD", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80" },
    { name: "Charlotte Robinson", email: "charlotte.r@example.com", phone: "+1 (555) 678-2345", address: "924 Cypress Way", city: "Minneapolis", state: "MN", postalCode: "55401", vipTier: "PLATINUM", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" },
    { name: "Benjamin Clark", email: "benjamin.c@example.com", phone: "+1 (555) 789-3456", address: "135 Poplar Ridge", city: "Raleigh", state: "NC", postalCode: "27601", vipTier: "STANDARD", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80" },
    { name: "Amelia Lewis", email: "amelia.l@example.com", phone: "+1 (555) 890-4567", address: "246 Redwood Boulevard", city: "Philadelphia", state: "PA", postalCode: "19102", vipTier: "SILVER", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80" },
    { name: "Alexander Walker", email: "alexander.w@example.com", phone: "+1 (555) 901-5678", address: "357 Hickory Place", city: "Las Vegas", state: "NV", postalCode: "89101", vipTier: "GOLD", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80" },
    { name: "Harper Hall", email: "harper.h@example.com", phone: "+1 (555) 012-6789", address: "468 Sycamore Loop", city: "Salt Lake City", state: "UT", postalCode: "84101", vipTier: "STANDARD", avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80" },
  ];

  const createdCustomers: any[] = [];
  for (const c of customerSeeds) {
    const user = await prisma.user.create({
      data: {
        email: c.email,
        name: c.name,
        role: "CUSTOMER",
        avatar: c.avatar,
        customer: {
          create: {
            phone: c.phone,
            address: c.address,
            city: c.city,
            state: c.state,
            postalCode: c.postalCode,
            vipTier: c.vipTier,
            emailNotifications: true,
          },
        },
      },
      include: { customer: true },
    });
    createdCustomers.push(user.customer);
  }

  console.log(`Created ${createdCustomers.length} customers.`);

  // 3. Create 30 Realistic Products
  const productSeeds = [
    { sku: "ELEC-SW4-BLK", name: "NovaFit Smartwatch Series 4", category: "Electronics", price: 299.99, returnPolicyDays: 30, description: "Advanced fitness smartwatch with titanium casing, AMOLED always-on display, ECG sensor, and 7-day battery life.", specs: '{"color":"Space Black","waterproof":"50m","battery":"7 days","compatibility":"iOS/Android"}' },
    { sku: "ELEC-EAR-PRO", name: "NovaPod Wireless Earbuds Pro", category: "Electronics", price: 179.99, returnPolicyDays: 30, description: "Active noise cancelling wireless earbuds with spatial audio, transparency mode, and wireless charging case.", specs: '{"anc":"Active Noise Cancelling","battery":"28h total","bluetooth":"5.3","color":"Glacier White"}' },
    { sku: "ELEC-HDP-ANC", name: "SoundPulse ANC Over-Ear Headphones", category: "Electronics", price: 249.99, returnPolicyDays: 30, description: "Studio-grade wireless over-ear headphones with 45mm drivers, hybrid noise cancellation, and ultra-soft memory foam.", specs: '{"driver":"45mm Titanium","battery":"40h","codec":"LDAC, AAC","weight":"260g"}' },
    { sku: "ELEC-CAM-4K", name: "Lumina 4K Ultra Action Camera", category: "Electronics", price: 199.99, returnPolicyDays: 30, description: "Compact waterproof action camera with dual color screens, 4K/60fps video, and HyperSmooth gyro stabilization.", specs: '{"resolution":"4K 60fps","waterproof":"10m bare","sensor":"Sony 1/2.3\\"","fov":"170 deg"}' },
    { sku: "ELEC-CHG-GAN", name: "PowerWave 65W GaN Fast Charger", category: "Electronics", price: 49.99, returnPolicyDays: 30, description: "Compact 3-port GaN fast charger with 2x USB-C and 1x USB-A ports, compatible with laptops, tablets, and phones.", specs: '{"power":"65W","ports":"2x USB-C, 1x USB-A","tech":"GaN III","weight":"110g"}' },
    { sku: "ELEC-BAT-MAG", name: "SwiftCharge Magnetic Battery Pack", category: "Electronics", price: 59.99, returnPolicyDays: 30, description: "10,000mAh magnetic wireless power bank with foldout kickstand and pass-through charging.", specs: '{"capacity":"10000mAh","wireless":"15W Mag","output":"20W PD","color":"Midnight Gray"}' },
    { sku: "ELEC-MON-27", name: "VisionMax 27\" 4K UHD IPS Monitor", category: "Electronics", price: 449.99, returnPolicyDays: 30, description: "Ultra-slim 27-inch 4K UHD designer monitor with 99% sRGB color gamut, USB-C 90W power delivery, and ergonomic stand.", specs: '{"size":"27 inch","panel":"IPS 4K","refresh":"75Hz","ports":"USB-C 90W, HDMI 2.1, DP"}' },
    { sku: "ELEC-KEY-RGB", name: "AuraDesk RGB Mechanical Keyboard", category: "Electronics", price: 129.99, returnPolicyDays: 30, description: "Custom hot-swappable wireless mechanical keyboard with lubricated tactile switches and sound-dampening gasket mount.", specs: '{"layout":"75%","switch":"NovaTactile Brown","connection":"Tri-mode 2.4G/BT/USB-C"}' },
    { sku: "APP-SHO-RUN", name: "AeroGrip Performance Running Shoes", category: "Apparel & Footwear", price: 139.99, returnPolicyDays: 30, description: "Lightweight carbon-plated running shoes with responsive foam cushioning and breathable engineered mesh upper.", specs: '{"size":"US 10.5","cushion":"HyperBounce Nitro","drop":"8mm","weight":"210g"}' },
    { sku: "APP-JKT-PRK", name: "ThermoShield All-Weather Parka", category: "Apparel & Footwear", price: 219.99, returnPolicyDays: 30, description: "Heavyweight windproof and waterproof winter parka with 700-fill responsible down insulation and storm hood.", specs: '{"insulation":"700 Fill Down","waterproof":"20,000mm","fit":"Regular","color":"Nordic Navy"}' },
    { sku: "APP-SWT-MER", name: "CloudKnit Merino Wool Sweater", category: "Apparel & Footwear", price: 99.99, returnPolicyDays: 30, description: "100% extra-fine Australian Merino wool crewneck sweater with temperature regulation and natural odor resistance.", specs: '{"material":"100% Merino Wool","weight":"260gsm","wash":"Hand wash/dry flat","color":"Charcoal"}' },
    { sku: "APP-JKT-TRL", name: "HydroFlex Waterproof Trail Jacket", category: "Apparel & Footwear", price: 159.99, returnPolicyDays: 30, description: "Ultralight packable 3-layer waterproof trail running and hiking jacket with taped seams and underarm vents.", specs: '{"rating":"15K/15K","weight":"185g","packable":"Packs into chest pocket"}' },
    { sku: "APP-SNK-URB", name: "UrbanStride Canvas Low-Top Sneakers", category: "Apparel & Footwear", price: 79.99, returnPolicyDays: 30, description: "Classic everyday organic canvas sneakers with natural vulcanized rubber sole and OrthoLite comfort insole.", specs: '{"upper":"Organic Cotton Canvas","sole":"Natural Gum Rubber","color":"Off-White"}' },
    { sku: "APP-JOG-FLC", name: "EcoWarm Fleece Relaxed Joggers", category: "Apparel & Footwear", price: 69.99, returnPolicyDays: 30, description: "Premium heavyweight organic cotton and recycled fleece sweatpants with zippered security pockets.", specs: '{"fabric":"400gsm Heavyweight Fleece","fit":"Tapered Relaxed","pockets":"3x Zippered"}' },
    { sku: "HOM-AIR-PUR", name: "UltraBreeze Air Purifier Pro", category: "Home & Kitchen", price: 189.99, returnPolicyDays: 30, description: "Smart HEPA H13 air purifier with real-time PM2.5 laser display, whisper-quiet sleep mode, and coverage up to 600 sq ft.", specs: '{"coverage":"600 sq ft","filter":"H13 True HEPA + Carbon","noise":"22dB min","app":"Wi-Fi Smart"}' },
    { sku: "HOM-ESP-PRO", name: "BrewMaster Precision Espresso Machine", category: "Home & Kitchen", price: 599.99, returnPolicyDays: 30, description: "Commercial-grade 15-bar Italian pump espresso machine with PID digital temperature control and stainless steel steam wand.", specs: '{"pump":"15 Bar Italian","boiler":"Thermoblock Dual","portafilter":"58mm Commercial"}' },
    { sku: "HOM-KNF-SET", name: "ChefBlade Damascus 5-Piece Knife Set", category: "Home & Kitchen", price: 199.99, returnPolicyDays: 30, description: "67-layer Japanese Damascus steel kitchen knife block set with pakkawood ergonomic handles and honing rod.", specs: '{"steel":"VG-10 67-Layer Damascus","hardness":"60+/-2 HRC","block":"Magnetic Acacia Wood"}' },
    { sku: "HOM-FRY-6IN", name: "AeroFry 6-in-1 Digital Air Fryer", category: "Home & Kitchen", price: 119.99, returnPolicyDays: 30, description: "Large 6-quart non-stick basket air fryer with 360-degree rapid heat circulation and one-touch digital presets.", specs: '{"capacity":"6.0 Quart","presets":"6 Programs","temp":"105F - 400F","power":"1700W"}' },
    { sku: "HOM-WTR-PIT", name: "CrystalPure Glass Water Filter Pitcher", category: "Home & Kitchen", price: 44.99, returnPolicyDays: 30, description: "Borosilicate glass water filtration pitcher that removes 99.9% of microplastics, chlorine, heavy metals, and PFAS.", specs: '{"capacity":"10 Cup (2.4L)","material":"Borosilicate Glass","filterLife":"2 Months/40 Gal"}' },
    { sku: "HOM-FLK-VAC", name: "ThermoPro 32oz Insulated Flask", category: "Home & Kitchen", price: 34.99, returnPolicyDays: 30, description: "Double-wall vacuum insulated stainless steel water bottle keeping drinks ice cold for 24h or piping hot for 12h.", specs: '{"volume":"32 oz (950ml)","material":"18/8 Pro Grade Steel","lid":"Leakproof Straw + Chug"}' },
    { sku: "FIT-GYM-SET", name: "FlexForm Resistance Training Set", category: "Fitness & Outdoors", price: 49.99, returnPolicyDays: 30, description: "Stackable 5-band latex resistance system with heavy-duty metal carabiners, foam handles, door anchor, and ankle straps.", specs: '{"resistance":"Up to 150 lbs total","material":"100% Natural Malaysian Latex"}' },
    { sku: "FIT-BAK-40L", name: "SummitTrek 40L Technical Backpack", category: "Fitness & Outdoors", price: 149.99, returnPolicyDays: 30, description: "Ergonomic multi-day hiking pack with internal aluminum frame, hydration reservoir sleeve, and integrated rain cover.", specs: '{"capacity":"40 Liters","frame":"Internal Aluminum","fabric":"420D Ripstop Cordura"}' },
    { sku: "FIT-WTR-SMT", name: "HydroGlow Smart Reminder Water Bottle", category: "Fitness & Outdoors", price: 54.99, returnPolicyDays: 30, description: "Stainless steel water bottle with LED glow base that flashes to remind you to drink and tracks hydration via Bluetooth.", specs: '{"capacity":"21 oz","battery":"Rechargeable 14-day","sync":"Apple Health / Google Fit"}' },
    { sku: "FIT-POL-TRK", name: "PeakPro Carbon Fiber Trekking Poles", category: "Fitness & Outdoors", price: 79.99, returnPolicyDays: 30, description: "Pair of 100% 3K carbon fiber quick-lock telescoping trekking poles with natural cork grips and tungsten carbide tips.", specs: '{"material":"3K Carbon Fiber","weight":"7.4 oz per pole","length":"24 to 54 inches"}' },
    { sku: "FIT-MAT-YOG", name: "AeroMat Pro High-Density Yoga Mat", category: "Fitness & Outdoors", price: 64.99, returnPolicyDays: 30, description: "6mm non-slip eco-friendly natural rubber and polyurethane alignment mat with superior joint cushioning.", specs: '{"thickness":"6mm","size":"72\\" x 26\\"","material":"Eco Natural Rubber + PU"}' },
    { sku: "BEA-FAC-CLN", name: "SonicGlow Ultrasonic Facial Cleanser", category: "Beauty & Personal Care", price: 89.99, returnPolicyDays: 30, description: "IPX7 waterproof silicone sonic face brush with thermal warming and red-light collagen therapy modes.", specs: '{"vibrations":"12,000 VPM","modes":"3 Cleaning + 2 Anti-Aging","waterproof":"IPX7"}' },
    { sku: "BEA-DRY-ION", name: "SilkCare 110,000 RPM Ionic Hair Dryer", category: "Beauty & Personal Care", price: 169.99, returnPolicyDays: 30, description: "Brushless digital motor high-speed hair dryer with 200 million negative ions for fast drying with zero heat damage.", specs: '{"motor":"110,000 RPM BLDC","noise":"<59dB","nozzles":"Magnetic Diffuser + Concentrator"}' },
    { sku: "BEA-DIF-SPA", name: "AquaSpa Ultrasonic Aroma Diffuser", category: "Beauty & Personal Care", price: 39.99, returnPolicyDays: 30, description: "500ml ceramic essential oil mist diffuser with ambient warm glowing light and 12-hour continuous runtime.", specs: '{"capacity":"500ml","material":"Matte Ceramic + BPA-free PP","timer":"1h/3h/6h/On"}' },
    { sku: "BEA-TRM-5IN", name: "PrecisionGroom 5-in-1 Beard Trimmer", category: "Beauty & Personal Care", price: 59.99, returnPolicyDays: 30, description: "All-in-one titanium blade waterproof body and beard trimmer with dial length adjustments from 0.5mm to 20mm.", specs: '{"blades":"Self-Sharpening Titanium","battery":"120min Li-ion","waterproof":"100% Washable"}' },
    { sku: "HOM-BOT-VAC", name: "NovaBot Laser LiDAR Robot Vacuum", category: "Home & Kitchen", price: 399.99, returnPolicyDays: 30, description: "5000Pa suction LiDAR laser mapping robot vacuum with dual spinning mopping pads and auto-recharge resume.", specs: '{"suction":"5000Pa","navigation":"LiDAR 360 LDS","battery":"5200mAh 180min","noise":"58dB"}' },
  ];

  const createdProducts: any[] = [];
  for (const p of productSeeds) {
    const prod = await prisma.product.create({ data: p });
    createdProducts.push(prod);
  }
  console.log(`Created ${createdProducts.length} products.`);

  // 4. Create 50 Realistic Interconnected Orders
  const orderStatuses = ["DELIVERED", "DELIVERED", "DELIVERED", "SHIPPED", "PROCESSING", "DELAYED", "CANCELLED"];
  const carriers = ["FedEx Express", "UPS Ground", "DHL Express", "USPS Priority"];
  
  const createdOrders: any[] = [];

  // Anchor Specific Orders for Demo Customers:
  // Sarah Johnson (Gold) -> ORD-9821 (Delivered recently, 2 items: Smartwatch + Earbuds Pro)
  const sarah = createdCustomers[0];
  const sarahOrder = await prisma.order.create({
    data: {
      orderNumber: "ORD-9821",
      customerId: sarah.id,
      status: "DELIVERED",
      totalAmount: 479.98,
      shippingAddress: `${sarah.address}, ${sarah.city}, ${sarah.state} ${sarah.postalCode}`,
      trackingNumber: "FDX-982144721",
      carrier: "FedEx Express",
      createdAt: new Date(Date.now() - 5 * 86400000), // 5 days ago
      deliveredAt: new Date(Date.now() - 2 * 86400000), // 2 days ago
      items: {
        create: [
          { productId: createdProducts[0].id, quantity: 1, unitPrice: 299.99, isReturnEligible: true },
          { productId: createdProducts[1].id, quantity: 1, unitPrice: 179.99, isReturnEligible: true },
        ],
      },
      payments: {
        create: {
          customerId: sarah.id,
          amount: 479.98,
          method: "CREDIT_CARD",
          status: "COMPLETED",
          transactionId: "TXN-SRH-98210",
          lastFour: "4242",
        },
      },
    },
    include: { items: true, payments: true },
  });
  createdOrders.push(sarahOrder);

  // Sarah Johnson second order -> ORD-9104 (Shipped, in transit)
  const sarahOrder2 = await prisma.order.create({
    data: {
      orderNumber: "ORD-9104",
      customerId: sarah.id,
      status: "SHIPPED",
      totalAmount: 99.99,
      shippingAddress: `${sarah.address}, ${sarah.city}, ${sarah.state} ${sarah.postalCode}`,
      trackingNumber: "UPS-910488219",
      carrier: "UPS Ground",
      createdAt: new Date(Date.now() - 2 * 86400000),
      estimatedDelivery: new Date(Date.now() + 2 * 86400000),
      items: {
        create: [{ productId: createdProducts[10].id, quantity: 1, unitPrice: 99.99, isReturnEligible: true }],
      },
      payments: {
        create: {
          customerId: sarah.id,
          amount: 99.99,
          method: "APPLE_PAY",
          status: "COMPLETED",
          transactionId: "TXN-SRH-91041",
          lastFour: "8821",
        },
      },
    },
    include: { items: true, payments: true },
  });
  createdOrders.push(sarahOrder2);

  // David Smith (Platinum) -> ORD-8412 (Delivered 12 days ago: AeroGrip Running Shoes + Merino Sweater)
  const david = createdCustomers[1];
  const davidOrder = await prisma.order.create({
    data: {
      orderNumber: "ORD-8412",
      customerId: david.id,
      status: "DELIVERED",
      totalAmount: 239.98,
      shippingAddress: `${david.address}, ${david.city}, ${david.state} ${david.postalCode}`,
      trackingNumber: "FDX-841299301",
      carrier: "FedEx Express",
      createdAt: new Date(Date.now() - 14 * 86400000),
      deliveredAt: new Date(Date.now() - 11 * 86400000),
      items: {
        create: [
          { productId: createdProducts[8].id, quantity: 1, unitPrice: 139.99, isReturnEligible: true },
          { productId: createdProducts[10].id, quantity: 1, unitPrice: 99.99, isReturnEligible: true },
        ],
      },
      payments: {
        create: {
          customerId: david.id,
          amount: 239.98,
          method: "CREDIT_CARD",
          status: "COMPLETED",
          transactionId: "TXN-DVD-84120",
          lastFour: "1122",
        },
      },
    },
    include: { items: true, payments: true },
  });
  createdOrders.push(davidOrder);

  // James Wilson (Standard) -> ORD-7734 (Delivered 4 days ago: Air Purifier Pro) - Has duplicate payment simulated
  const james = createdCustomers[2];
  const jamesOrder = await prisma.order.create({
    data: {
      orderNumber: "ORD-7734",
      customerId: james.id,
      status: "DELIVERED",
      totalAmount: 189.99,
      shippingAddress: `${james.address}, ${james.city}, ${james.state} ${james.postalCode}`,
      trackingNumber: "UPS-773400192",
      carrier: "UPS Ground",
      createdAt: new Date(Date.now() - 6 * 86400000),
      deliveredAt: new Date(Date.now() - 3 * 86400000),
      items: {
        create: [{ productId: createdProducts[14].id, quantity: 1, unitPrice: 189.99, isReturnEligible: true }],
      },
      payments: {
        create: [
          {
            customerId: james.id,
            amount: 189.99,
            method: "CREDIT_CARD",
            status: "COMPLETED",
            transactionId: "TXN-JMS-77340A",
            lastFour: "9911",
          },
          {
            customerId: james.id,
            amount: 189.99,
            method: "CREDIT_CARD",
            status: "DISPUTED",
            transactionId: "TXN-JMS-77340B-DUP",
            lastFour: "9911",
          },
        ],
      },
    },
    include: { items: true, payments: true },
  });
  createdOrders.push(jamesOrder);

  // Generate the remaining 46 realistic orders across the customer pool
  for (let i = 5; i <= 50; i++) {
    const customer = createdCustomers[i % createdCustomers.length];
    const orderNum = `ORD-${8000 + i}`;
    const status = orderStatuses[i % orderStatuses.length];
    const carrier = carriers[i % carriers.length];
    const p1 = createdProducts[(i * 3) % createdProducts.length];
    const p2 = createdProducts[(i * 5 + 1) % createdProducts.length];
    const daysAgo = (i * 2) % 45 + 1;
    const isDelivered = status === "DELIVERED";
    const total = p1.price + (i % 2 === 0 ? p2.price : 0);

    const ord = await prisma.order.create({
      data: {
        orderNumber: orderNum,
        customerId: customer.id,
        status: status,
        totalAmount: Math.round(total * 100) / 100,
        shippingAddress: `${customer.address}, ${customer.city}, ${customer.state} ${customer.postalCode}`,
        trackingNumber: status !== "PROCESSING" && status !== "CANCELLED" ? `TRK-${carrier.slice(0, 3).toUpperCase()}-${900000 + i}` : null,
        carrier: status !== "PROCESSING" && status !== "CANCELLED" ? carrier : null,
        createdAt: new Date(Date.now() - daysAgo * 86400000),
        deliveredAt: isDelivered ? new Date(Date.now() - (daysAgo - 3) * 86400000) : null,
        estimatedDelivery: !isDelivered && status === "SHIPPED" ? new Date(Date.now() + 2 * 86400000) : null,
        items: {
          create: [
            { productId: p1.id, quantity: 1, unitPrice: p1.price, isReturnEligible: daysAgo <= 30 },
            ...(i % 2 === 0 ? [{ productId: p2.id, quantity: 1, unitPrice: p2.price, isReturnEligible: daysAgo <= 30 }] : []),
          ],
        },
        payments: {
          create: {
            customerId: customer.id,
            amount: Math.round(total * 100) / 100,
            method: i % 4 === 0 ? "PAYPAL" : i % 3 === 0 ? "APPLE_PAY" : "CREDIT_CARD",
            status: status === "CANCELLED" ? "REFUNDED" : "COMPLETED",
            transactionId: `TXN-${orderNum}-${i}`,
            lastFour: `${1000 + (i * 37) % 9000}`,
          },
        },
      },
      include: { items: true, payments: true },
    });
    createdOrders.push(ord);
  }

  console.log(`Created ${createdOrders.length} realistic orders.`);

  // 5. Create Realistic Return Requests
  const ret1 = await prisma.returnRequest.create({
    data: {
      returnNumber: "RET-1001",
      orderId: sarahOrder.id,
      customerId: sarah.id,
      status: "APPROVED",
      reason: "Earbuds case lid doesn't latch securely",
      returnItems: JSON.stringify([{ productId: createdProducts[1].id, name: createdProducts[1].name, quantity: 1, price: 179.99 }]),
      trackingNumber: "RET-FDX-998811",
      refundAmount: 179.99,
      createdAt: new Date(Date.now() - 1 * 86400000),
    },
  });

  const ret2 = await prisma.returnRequest.create({
    data: {
      returnNumber: "RET-1002",
      orderId: davidOrder.id,
      customerId: david.id,
      status: "PENDING",
      reason: "Running shoes are half a size too small, need exchange for 11",
      returnItems: JSON.stringify([{ productId: createdProducts[8].id, name: createdProducts[8].name, quantity: 1, price: 139.99 }]),
      refundAmount: 139.99,
      createdAt: new Date(Date.now() - 2 * 3600000),
    },
  });

  console.log("Created Return Requests.");

  // 6. Create Knowledge Base Articles
  const articles = [
    {
      slug: "shipping-delivery-policy",
      title: "NovaMart Shipping & Delivery Policy",
      category: "SHIPPING",
      tags: "shipping, delivery, tracking, express, standard, international",
      excerpt: "Comprehensive guide on shipping speeds, carriers, tracking timelines, and international customs.",
      content: `### 1. Shipping Methods & Timeframes
NovaMart partners with premier carriers including FedEx, UPS, and DHL to ensure fast and secure delivery.
* **Standard Ground (3-5 business days):** Free on orders over $50. Flat rate $5.99 for orders under $50.
* **Express 2-Day Air (2 business days):** Flat rate $14.99.
* **Overnight Priority (Next business day):** Flat rate $24.99 for orders placed before 2:00 PM EST.

### 2. Order Tracking
Once your package leaves our fulfillment center, you will receive an automatic dispatch email with your carrier tracking number. Tracking updates typically appear within 12-24 hours of dispatch.

### 3. Delivery Delays & Weather Disruptions
In rare cases of extreme weather or customs inspections, deliveries may experience minor delays. If your shipment has not arrived within 48 hours past its estimated delivery date, our AI and support team can immediately initiate carrier trace inquiries or dispatch expedited replacements.`,
    },
    {
      slug: "30-day-return-exchange-policy",
      title: "30-Day Return & Exchange Policy",
      category: "RETURNS",
      tags: "returns, exchange, eligibility, 30 days, return label, refund",
      excerpt: "Step-by-step instructions on returning items within 30 days of delivery, condition requirements, and free return labels.",
      content: `### 1. 30-Day Return Window
Customers may return most items purchased from NovaMart within **30 days of confirmed delivery** for a full refund to the original payment method or instant store credit.

### 2. Return Eligibility Requirements
To be eligible for a return:
* Products must be in original condition with all accessories, cables, documentation, and original packaging.
* Apparel and footwear must be unworn, unwashed, and with all original tags attached.
* Electronics must be factory-reset and cleared of personal accounts.

### 3. Free Prepaid Return Labels
NovaMart provides prepaid return shipping labels for all domestic returns. Once an AI support agent or representative approves your return request, you will receive a digital return label to print and attach to the box.`,
    },
    {
      slug: "refund-processing-timelines",
      title: "Refund Processing Timelines & Methods",
      category: "REFUNDS",
      tags: "refunds, timeline, processing, credit card, paypal, store credit",
      excerpt: "Detailed breakdown of refund processing times across Credit Cards, PayPal, Apple Pay, and Store Credit.",
      content: `### 1. Refund Processing Speed
Once returned items are received and inspected at our distribution hub (typically 1-2 business days after delivery), refunds are issued immediately.

### 2. Financial Institution Timelines
* **Store Credit:** Instantaneous (0 days) upon approval.
* **PayPal & Apple Pay:** 24 to 48 hours.
* **Credit & Debit Cards (Visa, Mastercard, Amex):** 3 to 5 business days depending on your issuing bank.

### 3. Damaged or Defective Items
If your product arrived defective or damaged in transit, we issue immediate refunds or advance replacements without waiting for the physical return.`,
    },
    {
      slug: "payment-methods-duplicate-charges",
      title: "Payment Methods, Invoices & Duplicate Charge Resolution",
      category: "PAYMENTS",
      tags: "payments, billing, duplicate charge, invoice, security",
      excerpt: "How NovaMart secures payments and how to resolve pending authorizations or duplicate billing disputes.",
      content: `### 1. Accepted Payment Methods
NovaMart accepts Visa, MasterCard, American Express, Discover, PayPal, Apple Pay, Google Pay, and NovaMart Gift Cards.

### 2. Duplicate Charges or Pending Holds
If you notice two identical charges on your statement:
* One charge is usually an **authorization hold** placed at order submission, which expires automatically within 24-72 hours.
* If two finalized charges post to your bank, our AI support agent will immediately flag the billing transaction and route it to our Tier 2 Finance team for an expedited refund within 2 hours.`,
    },
    {
      slug: "order-cancellation-modifications",
      title: "Order Cancellation & Address Changes",
      category: "SHIPPING",
      tags: "cancellation, address change, modification, order status",
      excerpt: "Rules regarding canceling an order or updating shipping addresses prior to warehouse fulfillment.",
      content: `### 1. Automated Cancellation Window
You can cancel or modify your order address within **60 minutes of placing the order** directly from your customer portal or by telling our AI support agent.

### 2. Orders Already Shipped
Once an order status changes to "Shipped" or "In Transit", it cannot be intercepted or modified in flight. In this case, simply request a return label upon arrival or contact an agent to set up an automatic return-to-sender workflow.`,
    },
    {
      slug: "warranty-product-guarantee",
      title: "NovaMart 1-Year Comprehensive Warranty",
      category: "PRODUCTS",
      tags: "warranty, replacement, repair, electronics, defects",
      excerpt: "Coverage terms for NovaMart hardware and premium accessories.",
      content: `### 1. Standard 1-Year Warranty
All NovaMart electronics and smart devices come standard with a 1-year limited warranty against hardware defects, component failure, and manufacturer workmanship issues.

### 2. Filing a Warranty Claim
To file a warranty claim, provide your order number and a brief description/photo of the issue to our AI or support agent. We provide advance warranty replacements with free return shipping for the defective unit.`,
    },
    {
      slug: "customer-support-sla",
      title: "NovaMart Customer Support Service Level Agreement (SLA)",
      category: "SUPPORT_POLICY",
      tags: "SLA, response time, escalation, hours, support tiers",
      excerpt: "Our commitment to response times, AI resolution standards, and human agent availability.",
      content: `### 1. 24/7 AI Automated Resolution
NovaMart's AI Support Agent is online 24/7/365 with instantaneous response times (<2 seconds) for order tracking, return creation, policy inquiries, and account lookups.

### 2. Human Support Response Commitments
* **Urgent / Billing Disputes:** Human agent review within **15 minutes**.
* **Standard Ticket Inquiries:** Human agent review within **2 hours**.
* **Human Support Hours:** Monday - Sunday, 6:00 AM to 12:00 AM EST.`,
    },
  ];

  for (const a of articles) {
    await prisma.knowledgeArticle.create({ data: a });
  }
  console.log(`Created ${articles.length} knowledge base articles.`);

  // 7. Create Support Conversations & Tickets
  // Conversation 1: Sarah Johnson - Return Request for Earbuds (Active AI Handling -> Escalated / Assigned)
  const conv1 = await prisma.conversation.create({
    data: {
      conversationNumber: "CONV-401",
      customerId: sarah.id,
      assignedAgentId: agentUser1.agent?.id,
      status: "AGENT_ACTIVE",
      category: "RETURN",
      priority: "MEDIUM",
      aiConfidence: 0.94,
      aiIntent: "RETURN_REQUEST",
      summary: "Customer requested return for NovaPod Wireless Earbuds Pro (Order ORD-9821) due to loose lid latch. AI verified 30-day eligibility, approved return request RET-1001, and transferred to Agent Alex for return label generation.",
      messages: {
        create: [
          {
            senderType: "CUSTOMER",
            senderName: "Sarah Johnson",
            content: "Hi! I received my order ORD-9821 two days ago, but the case lid on the NovaPod Earbuds doesn't latch properly. Can I return or exchange them?",
            createdAt: new Date(Date.now() - 40 * 60000),
          },
          {
            senderType: "AI",
            senderName: "NovaMart AI Assistant",
            content: "Hello Sarah! 👋 I can certainly help you with that. I've located your order **ORD-9821** delivered on Aug 29th. The **NovaPod Wireless Earbuds Pro** ($179.99) is fully eligible for our 30-day free return policy.\n\nI have generated return request **RET-1001** for you. I'm also connecting you with our support specialist to ensure you get your prepaid return shipping label.",
            toolCalls: JSON.stringify([
              { tool: "getOrderDetails", args: { orderId: "ORD-9821" }, result: { orderNumber: "ORD-9821", status: "DELIVERED" } },
              { tool: "checkReturnEligibility", args: { orderId: "ORD-9821" }, result: { eligible: true, daysRemaining: 28 } },
              { tool: "createReturnRequest", args: { orderId: "ORD-9821", reason: "Defective lid" }, result: { returnNumber: "RET-1001" } },
            ]),
            createdAt: new Date(Date.now() - 39 * 60000),
          },
          {
            senderType: "AGENT",
            senderName: "Alex Rivera",
            content: "Hi Sarah! Alex here from Tier 2 Support. I reviewed the return request RET-1001 created by our AI assistant. I have emailed you the prepaid FedEx return label and issued approval!",
            createdAt: new Date(Date.now() - 20 * 60000),
          },
        ],
      },
      tickets: {
        create: {
          ticketNumber: "TCK-8801",
          customerId: sarah.id,
          assignedAgentId: agentUser1.agent?.id,
          category: "RETURN",
          priority: "MEDIUM",
          status: "IN_PROGRESS",
          aiSummary: "Return request RET-1001 for NovaPod Earbuds Pro (ORD-9821). Agent sent prepaid FedEx label.",
        },
      },
    },
  });

  // Conversation 2: James Wilson - Duplicate Billing Complaint (Urgent Escalation)
  const conv2 = await prisma.conversation.create({
    data: {
      conversationNumber: "CONV-402",
      customerId: james.id,
      assignedAgentId: agentUser1.agent?.id,
      status: "NEEDS_HUMAN",
      category: "PAYMENT",
      priority: "URGENT",
      aiConfidence: 0.98,
      aiIntent: "PAYMENT_PROBLEM",
      summary: "Customer detected duplicate credit card charge for order ORD-7734 ($189.99 x 2). AI detected duplicate transaction TXN-JMS-77340B-DUP and automatically escalated with URGENT priority.",
      messages: {
        create: [
          {
            senderType: "CUSTOMER",
            senderName: "James Wilson",
            content: "Urgent! I looked at my credit card statement and I was charged twice ($189.99 each) for my Air Purifier order ORD-7734.",
            createdAt: new Date(Date.now() - 15 * 60000),
          },
          {
            senderType: "AI",
            senderName: "NovaMart AI Assistant",
            content: "Hello James. I understand this is urgent and I apologize for the concern. I've verified your order **ORD-7734** and identified a pending duplicate transaction hold on your card ending in 9911.\n\nBecause this involves billing authorization, I have automatically created an **URGENT support ticket (TCK-8802)** and notified our Senior Billing team to void the duplicate charge immediately.",
            toolCalls: JSON.stringify([
              { tool: "getOrderDetails", args: { orderId: "ORD-7734" }, result: { orderNumber: "ORD-7734", total: 189.99 } },
              { tool: "getRefundStatus", args: { orderId: "ORD-7734" }, result: { duplicateFound: true, amount: 189.99 } },
              { tool: "createSupportTicket", args: { priority: "URGENT", category: "PAYMENT" }, result: { ticketNumber: "TCK-8802" } },
            ]),
            createdAt: new Date(Date.now() - 14 * 60000),
          },
        ],
      },
      tickets: {
        create: {
          ticketNumber: "TCK-8802",
          customerId: james.id,
          assignedAgentId: agentUser1.agent?.id,
          category: "PAYMENT",
          priority: "URGENT",
          status: "OPEN",
          aiSummary: "Duplicate charge detected on order ORD-7734. TXN-JMS-77340B-DUP needs reversal.",
        },
      },
    },
  });

  // Conversation 3: David Smith - Order Tracking & Delivery Inquiry (AI Resolved with 5-star CSAT)
  const conv3 = await prisma.conversation.create({
    data: {
      conversationNumber: "CONV-403",
      customerId: david.id,
      status: "RESOLVED",
      category: "ORDER_STATUS",
      priority: "LOW",
      aiConfidence: 0.99,
      aiIntent: "ORDER_STATUS",
      summary: "Customer inquired about delivery confirmation and tracking for ORD-8412. AI provided FedEx tracking number and delivery timestamp. Customer satisfied.",
      resolvedAt: new Date(Date.now() - 2 * 3600000),
      messages: {
        create: [
          {
            senderType: "CUSTOMER",
            senderName: "David Smith",
            content: "Where is my order ORD-8412?",
            createdAt: new Date(Date.now() - 3 * 3600000),
          },
          {
            senderType: "AI",
            senderName: "NovaMart AI Assistant",
            content: "Hi David! 👋 Your order **ORD-8412** was successfully delivered by FedEx Express (Tracking: **FDX-841299301**) to your front porch at 124 Conch Street.\n\nIs there anything else I can assist you with today?",
            toolCalls: JSON.stringify([
              { tool: "getMyOrders", args: {}, result: [{ orderNumber: "ORD-8412", status: "DELIVERED" }] },
            ]),
            createdAt: new Date(Date.now() - 3 * 3600000 + 5000),
          },
          {
            senderType: "CUSTOMER",
            senderName: "David Smith",
            content: "Found it by the side entrance, thanks so much!",
            createdAt: new Date(Date.now() - 2 * 3600000),
          },
          {
            senderType: "AI",
            senderName: "NovaMart AI Assistant",
            content: "You're very welcome! Have a fantastic day enjoying your new gear! ✨",
            createdAt: new Date(Date.now() - 2 * 3600000 + 2000),
          },
        ],
      },
      tickets: {
        create: {
          ticketNumber: "TCK-8803",
          customerId: david.id,
          category: "ORDER_STATUS",
          priority: "LOW",
          status: "RESOLVED",
          aiSummary: "Order delivery location clarified. Successfully resolved automatically by AI.",
          resolvedAt: new Date(Date.now() - 2 * 3600000),
        },
      },
      feedback: {
        create: {
          customerId: david.id,
          rating: 5,
          comment: "Super quick and accurate! Found my package immediately.",
        },
      },
    },
  });

  console.log("Created Conversations and Tickets.");

  // 8. Create Realistic Mock Email Events
  await prisma.emailEvent.create({
    data: {
      customerId: sarah.id,
      recipientEmail: "sarah.j@example.com",
      subject: "Return Request RET-1001 Approved — Prepaid Shipping Label",
      templateType: "RETURN_APPROVED",
      contentPreview: "Your return request RET-1001 for NovaPod Wireless Earbuds Pro has been approved...",
      htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5;">NovaMart Support</h2>
        <p>Dear Sarah,</p>
        <p>Your return request <strong>RET-1001</strong> for order <strong>ORD-9821</strong> has been approved.</p>
        <p><strong>Item:</strong> NovaPod Wireless Earbuds Pro ($179.99)<br/>
        <strong>Carrier:</strong> FedEx Express<br/>
        <strong>Tracking:</strong> RET-FDX-998811</p>
        <p>Please attach the prepaid return label and drop it off at any authorized FedEx location.</p>
        <p>Best regards,<br/>The NovaMart Customer Care Team</p>
      </div>`,
      status: "SENT",
    },
  });

  await prisma.emailEvent.create({
    data: {
      customerId: james.id,
      recipientEmail: "james.w@example.com",
      subject: "Support Ticket Created — [TCK-8802] Urgent Billing Review",
      templateType: "TICKET_CREATED",
      contentPreview: "We have received your billing inquiry for order ORD-7734. Priority: URGENT...",
      htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5;">NovaMart Support</h2>
        <p>Dear James,</p>
        <p>We have opened an Urgent Support Ticket <strong>TCK-8802</strong> regarding the duplicate charge reported for order <strong>ORD-7734</strong>.</p>
        <p>A Senior Billing Specialist has been assigned and will update you shortly.</p>
      </div>`,
      status: "SENT",
    },
  });

  // 9. Create Activity Logs
  const logEntries = [
    { actorType: "CUSTOMER", actorName: "Sarah Johnson", action: "LOGIN", entityType: "User", entityId: sarah.id, details: JSON.stringify({ ip: "192.168.1.101", device: "Desktop Chrome" }), createdAt: new Date(Date.now() - 45 * 60000) },
    { actorType: "CUSTOMER", actorName: "Sarah Johnson", action: "MESSAGE_SENT", entityType: "Conversation", entityId: conv1.id, details: JSON.stringify({ preview: "Can I return or exchange them?" }), createdAt: new Date(Date.now() - 40 * 60000) },
    { actorType: "AI", actorName: "NovaMart AI Assistant", action: "AI_INTENT_CLASSIFIED", entityType: "Conversation", entityId: conv1.id, details: JSON.stringify({ intent: "RETURN_REQUEST", confidence: 0.94, risk: "LOW" }), createdAt: new Date(Date.now() - 39 * 60000) },
    { actorType: "AI", actorName: "NovaMart AI Assistant", action: "AI_TOOL_CALLED", entityType: "Conversation", entityId: conv1.id, details: JSON.stringify({ tool: "checkReturnEligibility", orderId: "ORD-9821", eligible: true }), createdAt: new Date(Date.now() - 39 * 60000) },
    { actorType: "AI", actorName: "NovaMart AI Assistant", action: "RETURN_CREATED", entityType: "ReturnRequest", entityId: ret1.id, details: JSON.stringify({ returnNumber: "RET-1001", amount: 179.99 }), createdAt: new Date(Date.now() - 39 * 60000) },
    { actorType: "AI", actorName: "NovaMart AI Assistant", action: "TICKET_CREATED", entityType: "Ticket", entityId: "TCK-8801", details: JSON.stringify({ ticketNumber: "TCK-8801", category: "RETURN" }), createdAt: new Date(Date.now() - 38 * 60000) },
    { actorType: "AGENT", actorName: "Alex Rivera", action: "AGENT_TAKEOVER", entityType: "Conversation", entityId: conv1.id, details: JSON.stringify({ assignedTo: "Alex Rivera" }), createdAt: new Date(Date.now() - 25 * 60000) },
    { actorType: "SYSTEM", actorName: "NovaMart Mailer", action: "EMAIL_SENT", entityType: "EmailEvent", entityId: "EML-101", details: JSON.stringify({ recipient: "sarah.j@example.com", template: "RETURN_APPROVED" }), createdAt: new Date(Date.now() - 20 * 60000) },
  ];

  for (const log of logEntries) {
    await prisma.activityLog.create({ data: log });
  }

  // 10. Create Notifications
  await prisma.notification.create({
    data: {
      recipientRole: "SUPPORT_AGENT",
      title: "🚨 Urgent Billing Escalation",
      message: "Customer James Wilson reported a duplicate charge for order ORD-7734. Ticket TCK-8802 created.",
      type: "ESCALATION",
      link: "/agent?conv=CONV-402",
      createdAt: new Date(Date.now() - 14 * 60000),
    },
  });

  await prisma.notification.create({
    data: {
      recipientRole: "SUPPORT_AGENT",
      title: "📦 Return Request RET-1001 Assigned",
      message: "Sarah Johnson requested return for NovaPod Earbuds Pro.",
      type: "NEW_CONVERSATION",
      link: "/agent?conv=CONV-401",
      createdAt: new Date(Date.now() - 38 * 60000),
    },
  });

  console.log("✅ NovaMart database successfully seeded!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
