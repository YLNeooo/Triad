import React from "react";

export const useTriadBackground = (options: {
  showCross?: boolean;
  showFrame?: boolean;
} = {}) => {
  const { showCross = true, showFrame = true } = options;

  const BackgroundElement: React.FC<{ className?: string }> = ({ className = "" }) => (
    <div className={`absolute inset-0 -z-10 ${className}`}>
      {/* Base diagonal gradient */}
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#3b1ff4_0%,#5b29f0_35%,#6f33f2_60%,#2D1B69_100%)]" />
      
      {/* Soft center glow */}
      <div className="absolute inset-0 bg-[radial-gradient(60vw_40vw_at_50%_50%,rgba(255,255,255,0.10),rgba(255,255,255,0)_60%)]" />
      
      {/* Corner vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(70vw_70vw_at_-10%_-10%,rgba(0,0,0,0.35),transparent_55%),radial-gradient(70vw_70vw_at_110%_-10%,rgba(0,0,0,0.35),transparent_55%),radial-gradient(70vw_70vw_at_-10%_110%,rgba(0,0,0,0.35),transparent_55%),radial-gradient(70vw_70vw_at_110%_110%,rgba(0,0,0,0.35),transparent_55%)]" />
      
      {/* Rotating gradient cross */}
      {showCross && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 
                        -translate-x-1/2 -translate-y-1/2 animate-spin-slow">
          {/* Vertical line */}
          <div className="absolute left-1/2 top-1/2 h-[100vmin] w-px 
                          -translate-x-1/2 -translate-y-1/2 
                          bg-gradient-to-b from-transparent via-white/30 to-transparent blur-[0.5px]" />
          {/* Horizontal line */}
          <div className="absolute left-1/2 top-1/2 w-[110vmin] h-px 
                          -translate-x-1/2 -translate-y-1/2 
                          bg-gradient-to-r from-transparent via-white/30 to-transparent blur-[0.5px]" />
        </div>
      )}
      
      {/* Thin neon frame */}
      {showFrame && (
        <div className="absolute inset-0 ring-1 ring-cyan-300/40" />
      )}
    </div>
  );

  return { BackgroundElement };
};

export default useTriadBackground;