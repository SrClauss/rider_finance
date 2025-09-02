import React from "react";

export type AnimatedGpsIconProps = {
  width?: number | string;
  height?: number | string;
  duration?: number; // seconds
  pauseOnHover?: boolean;
  gradient?: string[]; // colors, default gold -> light -> gold
  gradientType?: "linear" | "radial";
  className?: string;
};

const AnimatedGpsIcon: React.FC<AnimatedGpsIconProps> = ({
  width = 96,
  height = 96,
  duration = 2,
  pauseOnHover = false,
  gradient = ["#d4af37", "#f7e7b6", "#d4af37"],
  gradientType = "radial",
  className,
}) => {
  // id determinístico para o gradiente (evita mismatch entre SSR e client)
  const simpleHash = (s: string) => {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36).slice(0, 8);
  };

  const gradId = `gps-grad-${simpleHash(JSON.stringify({ gradient, gradientType, width, height, duration }))}`;

  // build stops
  const stops = gradient.map((c, i) => {
    const offset = gradient.length === 1 ? "50%" : `${(i / (gradient.length - 1)) * 100}%`;
    return (
      <stop key={i} offset={offset} stopColor={c} />
    );
  });

  const wrapStyle: React.CSSProperties = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
    display: "inline-block",
    perspective: "800px",
  };

  return (
    <div className={className} style={wrapStyle} aria-hidden="true">
      <div
        className="rotator"
        style={{
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
          transformOrigin: "50% 50%",
          willChange: "transform",
        }}
      >
        <svg
          className="gps-svg"
          width="100%"
          height="100%"
          viewBox="0 0 210 310"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="GPS Icon"
          style={{ display: "block", backfaceVisibility: "visible" }}
        >
          <defs>
            {gradientType === "linear" ? (
              <linearGradient id={gradId} gradientUnits="objectBoundingBox" gradientTransform="rotate(90)">
                {stops}
              </linearGradient>
            ) : (
              <radialGradient id={gradId} gradientUnits="objectBoundingBox">
                {stops}
              </radialGradient>
            )}
          </defs>

          {/* internal SVG CSS avoids styled-jsx and works in server components */}
          <style>{`
            /* Use view-box so rotation axis is the SVG viewport center */
            .spin-target { transform-box: view-box; transform-origin: 50% 50%; backface-visibility: visible; -webkit-backface-visibility: visible; animation: flipY ${duration}s infinite linear; will-change: transform; }
            @keyframes flipY {
              0% { transform: rotateY(0deg); }
              50% { transform: rotateY(180deg); }
              100% { transform: rotateY(360deg); }
            }
            ${pauseOnHover ? `.spin-target:hover { animation-play-state: paused; }` : ''}
          `}</style>

          <g className="spin-target">
            <path
            d="M227.32 384.464c-1.255-.505-29.453-42.2-49.257-72.833-30.322-46.902-46.839-78.792-51.56-99.549-2.125-9.342-1.534-35.297 1.012-44.451 7.936-28.535 26.785-52.467 52.626-66.816 16.47-9.146 40.573-14.034 58.708-11.906 30.121 3.534 56.155 18.299 73.518 41.694 20.77 27.986 26.168 61.495 15.18 94.228-4.162 12.397-14.497 33.21-25.475 51.3-18 29.66-67.647 105.199-70.818 107.75-1.656 1.332-1.963 1.377-3.934.583zm20.262-121.136c13.818-3.652 25.006-10.622 35.935-22.386 13.908-14.971 20.327-32.512 19.29-52.714-1.019-19.845-7.482-34.024-22.157-48.61-10.224-10.163-19.83-15.89-32.575-19.422-10.369-2.873-27.617-2.873-37.985 0-26.541 7.355-49.018 31.426-53.993 57.821-1.662 8.824-1.235 22.931.954 31.49 8.555 33.452 41.27 57.922 75.031 56.124 4.675-.25 11.65-1.286 15.5-2.303zm-22.786-13.817c-.393-.392-.714-2.83-.714-5.419 0-4.664-.033-4.71-3.75-5.306-12.76-2.043-25.17-17.79-20.953-26.588 1.048-2.187 1.889-2.567 5.678-2.567 3.771 0 4.624.38 5.6 2.5 4.355 9.448 5.821 11.753 8.75 13.75 1.814 1.237 3.609 2.25 3.987 2.25.379 0 .688-7.158.688-15.906V196.32l-6.25-2.934c-12.42-5.832-16.75-12.101-16.75-24.254 0-12.055 5.595-20.154 17.262-24.99 5.6-2.321 5.644-2.372 5.94-6.924l.298-4.586h9l.5 4.825c.5 4.814.513 4.83 5.785 6.608 10.067 3.396 17.637 12.904 17.02 21.376-.248 3.402-.805 4.415-3.006 5.465-4.964 2.368-9.79-.867-9.802-6.571-.006-2.837-3.721-8.01-6.952-9.68l-3.045-1.574v31.856l7.044 2.14c14.274 4.335 20.423 14.16 18.5 29.555-1.278 10.228-9.727 19.216-20.46 21.766l-4.995 1.186-.294 5.024-.295 5.024-4.036.297c-2.22.163-4.357-.024-4.75-.417zm15.388-23.65c4.026-2.689 6.895-7.922 6.897-12.579.002-3.69-2.487-9.72-4.326-10.483-.645-.268-2.86-1.208-4.923-2.09l-3.75-1.605v14.513c0 16.081.09 16.26 6.102 12.244zm-16.102-58.23c0-7.425-.389-13.5-.865-13.5-1.632 0-6.175 4.177-7.655 7.039-2.948 5.7-.832 14.68 4.397 18.661 3.766 2.868 4.123 1.811 4.123-12.2z"
            transform="translate(-125.206 -88.415)"
            fill={`url(#${gradId})`}
            />
          </g>
        </svg>
      </div>

  {/* Styling is embedded inside the SVG so this component remains SSR-friendly */}
    </div>
  );
};

export default AnimatedGpsIcon;
