import React from "react";

interface TriadBackgroundProps {
  className?: string;
  showCross?: boolean;
  showFrame?: boolean;
  children?: React.ReactNode;
}

export const TriadBackground: React.FC<TriadBackgroundProps> = ({
  className = "",
  showCross = true,
  showFrame = true,
  children,
}) => {
  return (
    // 👇 Fill the small viewport height and hide overflow on the page wrapper
    <div className={`relative min-h-svh overflow-hidden ${className}`}>
      {/* Background gradient + vignette */}
      {/* 👇 Make the background layer FIXED so it always covers the screen */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        {/* Base diagonal gradient */}
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#1a0b7a_0%,#2d1b69_35%,#1e0f5c_60%,#0f051f_100%)]" />
        
        {/* Soft center glow */}
        <div className="absolute inset-0 bg-[radial-gradient(60vw_40vw_at_50%_50%,rgba(255,255,255,0.10),rgba(255,255,255,0)_60%)]" />
        
        {/* Corner vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(70vw_70vw_at_-10%_-10%,rgba(0,0,0,0.35),transparent_55%),radial-gradient(70vw_70vw_at_110%_-10%,rgba(0,0,0,0.35),transparent_55%),radial-gradient(70vw_70vw_at_-10%_110%,rgba(0,0,0,0.35),transparent_55%),radial-gradient(70vw_70vw_at_110%_110%,rgba(0,0,0,0.35),transparent_55%)]" />
        
        {/* Rotating gradient cross */}
        {showCross && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin-slow">
            <div className="absolute left-1/2 top-1/2 h-[100vmin] w-px -translate-x-1/2 -translate-y-1/2 bg-gradient-to-b from-transparent via-white/30 to-transparent blur-[0.5px]" />
            <div className="absolute left-1/2 top-1/2 w-[110vmin] h-px -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent blur-[0.5px]" />
          </div>
        )}
        
        {/* Thin neon frame */}
        {showFrame && <div className="absolute inset-0 ring-1 ring-cyan-300/40" />}
      </div>
      
      {/* Content */}
      {children}
    </div>
  );
};

export default TriadBackground;