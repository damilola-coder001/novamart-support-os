// NovaMart - Auth & Session Management
import { prisma } from "@/lib/prisma";
import { SessionUser, UserRole } from "@/types";

import { DEMO_USERS } from "./demo-users";
export { DEMO_USERS };

export async function getSessionUser(emailOrUserId?: string | null): Promise<SessionUser | null> {
  // Default to Sarah Johnson if no user identifier provided
  const query = emailOrUserId || DEMO_USERS.SARAH_JOHNSON.email;

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ id: query }, { email: query }],
    },
    include: {
      customer: true,
      agent: true,
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
    avatar: user.avatar,
    customerId: user.customer?.id || null,
    agentId: user.agent?.id || null,
    vipTier: (user.customer?.vipTier as any) || undefined,
  };
}

export async function getCustomerById(customerId: string) {
  return await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      user: true,
      orders: {
        include: {
          items: { include: { product: true } },
          payments: true,
          returns: true,
        },
        orderBy: { createdAt: "desc" },
      },
      returns: {
        include: { order: true },
        orderBy: { createdAt: "desc" },
      },
      conversations: {
        include: {
          messages: { orderBy: { createdAt: "asc" } },
          tickets: true,
        },
        orderBy: { updatedAt: "desc" },
      },
      tickets: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}
