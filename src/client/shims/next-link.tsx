import React from "react";

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children?: React.ReactNode;
}

export function Link({ href, children, className, onClick, ...props }: LinkProps) {
  return (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        if (onClick) onClick(e);
        if (
          !e.defaultPrevented &&
          href.startsWith("/") &&
          !props.target &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.shiftKey
        ) {
          e.preventDefault();
          window.history.pushState({}, "", href);
          window.dispatchEvent(new PopStateEvent("popstate"));
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }}
      {...props}
    >
      {children}
    </a>
  );
}

export default Link;
