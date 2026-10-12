import { useState, useEffect } from "react";

export function useRouter() {
  return {
    push: (url: string) => {
      window.history.pushState({}, "", url);
      window.dispatchEvent(new PopStateEvent("popstate"));
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    replace: (url: string) => {
      window.history.replaceState({}, "", url);
      window.dispatchEvent(new PopStateEvent("popstate"));
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    refresh: () => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    },
    back: () => window.history.back(),
    forward: () => window.history.forward(),
    prefetch: () => {},
  };
}

export function usePathname() {
  const [pathname, setPathname] = useState(
    typeof window !== "undefined" ? window.location.pathname : "/"
  );

  useEffect(() => {
    const onPopState = () => {
      setPathname(window.location.pathname);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return pathname;
}

export function useSearchParams() {
  const [searchParams, setSearchParams] = useState(
    new URLSearchParams(typeof window !== "undefined" ? window.location.search : "")
  );

  useEffect(() => {
    const onPopState = () => {
      setSearchParams(new URLSearchParams(window.location.search));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return searchParams;
}

export function redirect(url: string) {
  if (typeof window !== "undefined") {
    window.location.href = url;
  }
}
