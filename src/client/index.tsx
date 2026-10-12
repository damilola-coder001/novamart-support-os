import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "../components/providers/ThemeProvider";
import { SessionProvider, useSession } from "../components/providers/SessionProvider";
import { DemoHeader } from "../components/layout/DemoHeader";
import HomePage from "../app/page";
import CustomerPortal from "../app/customer/page";
import AgentWorkspace from "../app/agent/page";
import AdminDashboard from "../app/admin/page";

function AppContent() {
  const { user } = useSession();
  const [currentPath, setCurrentPath] = useState(
    typeof window !== "undefined" ? window.location.pathname : "/"
  );

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);

    // Global click listener to intercept <a href="..."> clicks for SPA routing
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (
        target &&
        target.href &&
        target.href.startsWith(window.location.origin) &&
        !target.getAttribute("target") &&
        !target.getAttribute("download") &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey
      ) {
        const url = new URL(target.href);
        if (url.pathname !== window.location.pathname) {
          e.preventDefault();
          window.history.pushState({}, "", url.pathname + url.search);
          setCurrentPath(url.pathname);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    };

    document.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("click", handleClick);
    };
  }, []);

  // Strict role isolation:
  // - Eleanor Vance (ADMIN) is strictly restricted to /admin only
  // - Alex Rivera (SUPPORT_AGENT) is strictly restricted to /agent only
  useEffect(() => {
    const path = currentPath.toLowerCase().replace(/\/$/, "");
    if (user?.role === "ADMIN" && (path === "/customer" || path === "/agent")) {
      window.history.replaceState({}, "", "/admin");
      setCurrentPath("/admin");
    } else if (user?.role === "SUPPORT_AGENT" && (path === "/customer" || path === "/admin")) {
      window.history.replaceState({}, "", "/agent");
      setCurrentPath("/agent");
    } else if (user?.role === "CUSTOMER" && (path === "/admin" || path === "/agent")) {
      window.history.replaceState({}, "", "/customer");
      setCurrentPath("/customer");
    }
  }, [user?.role, currentPath]);

  const renderPage = () => {
    const path = currentPath.toLowerCase().replace(/\/$/, "") || "/";
    if (user?.role === "ADMIN" && (path === "/customer" || path === "/agent")) {
      return <AdminDashboard />;
    }
    if (user?.role === "SUPPORT_AGENT" && (path === "/customer" || path === "/admin")) {
      return <AgentWorkspace />;
    }
    if (user?.role === "CUSTOMER" && (path === "/admin" || path === "/agent")) {
      return <CustomerPortal />;
    }
    if (path === "/customer") {
      return <CustomerPortal />;
    }
    if (path === "/agent") {
      return <AgentWorkspace />;
    }
    if (path === "/admin") {
      return <AdminDashboard />;
    }
    return <HomePage />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-brand-500/20">
      <DemoHeader />
      <main className="flex-1 flex flex-col">{renderPage()}</main>
    </div>
  );
}

// Simple client-side router
export function AppRouter() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <AppContent />
      </SessionProvider>
    </ThemeProvider>
  );
}

// Mount the React SPA
const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <AppRouter />
    </React.StrictMode>
  );
}
