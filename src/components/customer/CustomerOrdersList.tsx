import React from "react";
import { Package, Truck, CheckCircle2, Clock, AlertCircle, Eye, RotateCcw } from "lucide-react";

export interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  product: {
    name: string;
    imageUrl?: string;
    sku: string;
  };
}

export interface Order {
  id: string;
  orderNumber: string;
  status: "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  totalAmount: number;
  createdAt: string;
  carrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  items: OrderItem[];
}

interface CustomerOrdersListProps {
  orders: Order[];
  onTrackOrder: (order: Order) => void;
  onRequestReturn: (order: Order) => void;
}

export const CustomerOrdersList: React.FC<CustomerOrdersListProps> = ({
  orders,
  onTrackOrder,
  onRequestReturn,
}) => {
  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "DELIVERED":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
          </span>
        );
      case "SHIPPED":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Truck className="w-3.5 h-3.5" /> In Transit
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" /> Processing
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-500 border border-slate-500/20">
            <AlertCircle className="w-3.5 h-3.5" /> {status}
          </span>
        );
    }
  };

  if (orders.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground bg-card rounded-2xl border border-border">
        <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
        <p className="font-semibold text-foreground">No orders found</p>
        <p className="text-xs mt-1">Orders placed under your account will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const itemSummary = order.items.map((i) => `${i.quantity}x ${i.product.name}`).join(", ");
        const isEligibleForReturn = order.status === "DELIVERED";

        return (
          <div
            key={order.id}
            className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:border-brand-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-3">
                <span className="font-bold text-foreground text-base tracking-tight">{order.orderNumber}</span>
                {getStatusBadge(order.status)}
                <span className="text-xs text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">{itemSummary}</p>
              <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground pt-1">
                <span>
                  Total: <strong className="text-foreground">${order.totalAmount.toFixed(2)}</strong>
                </span>
                {order.carrier && (
                  <span>
                    Carrier: <strong className="text-foreground">{order.carrier}</strong>
                  </span>
                )}
                {order.trackingNumber && (
                  <span className="font-mono text-[11px] bg-muted px-2 py-0.5 rounded-md">
                    {order.trackingNumber}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center">
              <button
                onClick={() => onTrackOrder(order)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border flex items-center gap-1.5 transition cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" /> Details
              </button>

              {isEligibleForReturn && (
                <button
                  onClick={() => onRequestReturn(order)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Return / Exchange
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
