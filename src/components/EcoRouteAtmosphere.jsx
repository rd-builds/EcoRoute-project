export default function EcoRouteAtmosphere({ variant = 'full', className = '' }) {
  return (
    <div className={`ecoroute-atmosphere atmosphere-${variant} ${className}`} aria-hidden="true">
      {/* Background Ambient Soft Orbs */}
      <div className="atmosphere-orb orb-primary" />
      <div className="atmosphere-orb orb-secondary" />

      {/* Restrained Futuristic SVG Arc Contour Waves (2 to 4 smooth curves) */}
      <svg
        className="atmosphere-svg"
        viewBox="0 0 1440 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="subtle-lime-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B8FF32" stopOpacity="0.22" />
            <stop offset="60%" stopColor="#20C978" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#063C2D" stopOpacity="0.02" />
          </linearGradient>

          <linearGradient id="subtle-emerald-grad" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#20C978" stopOpacity="0.18" />
            <stop offset="70%" stopColor="#063C2D" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#020704" stopOpacity="0" />
          </linearGradient>

          <radialGradient id="subtle-center-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#20C978" stopOpacity="0.08" />
            <stop offset="50%" stopColor="#063C2D" stopOpacity="0.03" />
            <stop offset="100%" stopColor="#020704" stopOpacity="0" />
          </radialGradient>

          <filter id="soft-glow-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Variant: Hero (2 clean sweeping arcs framing the headline) */}
        {(variant === 'hero' || variant === 'full') && (
          <g className="svg-group-hero">
            <circle cx="1200" cy="100" r="580" fill="url(#subtle-center-glow)" />

            <path
              d="M -100 180 C 400 420, 900 60, 1600 280"
              stroke="url(#subtle-lime-grad)"
              strokeWidth="1.0"
              fill="none"
              filter="url(#soft-glow-filter)"
              className="anim-wave-float"
            />
            <circle
              cx="1200"
              cy="100"
              r="480"
              stroke="url(#subtle-emerald-grad)"
              strokeWidth="0.8"
              fill="none"
              opacity="0.5"
              className="anim-wave-pulse"
            />
          </g>
        )}

        {/* Variant: Workspace (2 framing arcs around the command center) */}
        {(variant === 'workspace' || variant === 'full') && (
          <g className="svg-group-workspace">
            <ellipse
              cx="1350"
              cy="150"
              rx="650"
              ry="420"
              stroke="url(#subtle-lime-grad)"
              strokeWidth="0.9"
              fill="none"
              filter="url(#soft-glow-filter)"
              className="anim-wave-float"
            />
            <ellipse
              cx="80"
              cy="780"
              rx="580"
              ry="400"
              stroke="url(#subtle-emerald-grad)"
              strokeWidth="0.8"
              fill="none"
              opacity="0.4"
            />
          </g>
        )}

        {/* Variant: Dashboard (2 subtle edge contours) */}
        {(variant === 'dashboard' || variant === 'full') && (
          <g className="svg-group-dashboard">
            <circle
              cx="80"
              cy="200"
              r="440"
              stroke="url(#subtle-lime-grad)"
              strokeWidth="0.9"
              fill="none"
              opacity="0.45"
            />
            <path
              d="M 150 -80 Q 750 320 1500 80"
              stroke="url(#subtle-emerald-grad)"
              strokeWidth="0.8"
              fill="none"
              opacity="0.35"
            />
          </g>
        )}

        {/* Variant: Section (1 clean downward transition curve) */}
        {variant === 'section' && (
          <g className="svg-group-section">
            <path
              d="M -100 160 Q 720 380 1540 120"
              stroke="url(#subtle-lime-grad)"
              strokeWidth="0.9"
              fill="none"
              filter="url(#soft-glow-filter)"
              className="anim-wave-float"
            />
          </g>
        )}
      </svg>
    </div>
  );
}
