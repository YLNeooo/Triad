"use client";

import React from "react";

interface GlassButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  target?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * A reusable glass / crystal styled button.
 * Can act as a <button> (when `onClick` is passed) or as an <a> (when `href` is passed).
 */
export default function GlassButton({
  children,
  onClick,
  href,
  target = "_self",
  disabled = false,
  className = "",
}: GlassButtonProps) {
  const baseClasses =
    `relative px-6 py-3 rounded-xl 
     bg-white/10 backdrop-blur-md
     border border-white/20
     shadow-[0_0_20px_rgba(173,216,230,0.4)]
     text-cyan-200 font-semibold
     transition-all duration-300
     hover:bg-white/20 hover:scale-105
     active:scale-95
     disabled:opacity-60 disabled:pointer-events-none ${className}`;

  const glow = (
    <span
      className="absolute inset-0 rounded-xl 
                 bg-gradient-to-r from-cyan-400/20 to-purple-400/20 
                 blur-md -z-10"
    />
  );

  if (href) {
    return (
      <a href={href} target={target} rel="noopener noreferrer" className={baseClasses}>
        {children}
        {glow}
      </a>
    );
  }

  return (
    <button onClick={onClick} disabled={disabled} className={baseClasses}>
      {children}
      {glow}
    </button>
  );
}
