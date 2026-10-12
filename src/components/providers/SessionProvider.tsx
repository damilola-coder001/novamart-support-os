"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { SessionUser } from "@/types";
import { DEMO_USERS, DemoPerspective } from "@/lib/auth/demo-users";

interface SessionContextType {
  user: SessionUser | null;
  loading: boolean;
  isTransitioning: boolean;
  currentPerspective: DemoPerspective | null;
  switchUser: (email: string, autoRoute?: boolean) => Promise<void>;
  refreshSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  loading: true,
  isTransitioning: false,
  currentPerspective: null,
  switchUser: async () => {},
  refreshSession: async () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
      }
    } catch (e) {
      console.error("Failed to load session:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const switchUser = async (email: string, autoRoute = true) => {
    try {
      setIsTransitioning(true);
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);

        // Find perspective
        const perspective = Object.values(DEMO_USERS).find((p) => p.email === email);
        if (autoRoute && perspective && typeof window !== "undefined") {
          const targetRoute = perspective.defaultRoute;
          if (window.location.pathname !== targetRoute) {
            window.history.pushState({}, "", targetRoute);
            window.dispatchEvent(new PopStateEvent("popstate"));
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }
      }
    } catch (e) {
      console.error("Failed to switch user & workspace:", e);
    } finally {
      setTimeout(() => {
        setIsTransitioning(false);
      }, 450);
    }
  };

  const currentPerspective = user
    ? Object.values(DEMO_USERS).find((p) => p.email === user.email) || null
    : null;

  return (
    <SessionContext.Provider
      value={{
        user,
        loading,
        isTransitioning,
        currentPerspective,
        switchUser,
        refreshSession: fetchSession,
      }}
    >
      {children}
      {/* Workspace Transition Ambient Overlay */}
      {isTransitioning && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-background/50 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in">
          <div className="bg-card/95 border border-brand-500/30 px-6 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 text-sm font-medium text-foreground">
            <div className="w-4 h-4 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
            <span>Switching Workspace & Security Context...</span>
          </div>
        </div>
      )}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
