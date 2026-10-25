// Animated SVG above the register form: the Scoopy mark with job, candidate,
// video and email icons orbiting it.
const OUTER = "M30 75 a140 52 0 1 0 280 0 a140 52 0 1 0 -280 0";
const INNER = "M80 75 a90 32 0 1 0 180 0 a90 32 0 1 0 -180 0";

export default function OrbitIllustration() {
  return (
    <svg viewBox="0 0 340 150" width="340" height="150" aria-hidden="true" className="mx-auto mb-2 block max-w-full overflow-visible">
      <ellipse cx="170" cy="75" rx="140" ry="52" fill="none" stroke="#C9C2FF" strokeWidth="1.5" strokeDasharray="3 8" />
      <ellipse cx="170" cy="75" rx="90" ry="32" fill="none" stroke="#DDF5A8" strokeWidth="1.5" strokeDasharray="2 6" />
      <circle cx="170" cy="75" r="34" fill="#5B3DF5" opacity=".15">
        <animate attributeName="r" values="30;40;30" dur="3s" repeatCount="indefinite" />
      </circle>
      <g transform="translate(150 55) scale(1.18)">
        <rect width="34" height="34" rx="10" fill="#5B3DF5" />
        <path d="M9 17a8 8 0 0 1 16 0z" fill="#fff" />
        <path d="M11 19h12l-6 8z" fill="#D7F75B" />
      </g>
      <g>
        <animateMotion dur="12s" repeatCount="indefinite" path={OUTER} />
        <circle r="18" fill="#fff" stroke="#E4E6EE" />
        <path d="M-8 -3h16v10h-16z M-3 -3v-3h6v3" fill="none" stroke="#5B3DF5" strokeWidth="2" strokeLinejoin="round" />
      </g>
      <g>
        <animateMotion dur="12s" begin="-4s" repeatCount="indefinite" path={OUTER} />
        <circle r="18" fill="#D7F75B" />
        <circle cy="-3" r="4" fill="none" stroke="#0F1222" strokeWidth="2" />
        <path d="M-7 8c1-4 4-6 7-6s6 2 7 6" fill="none" stroke="#0F1222" strokeWidth="2" strokeLinecap="round" />
      </g>
      <g>
        <animateMotion dur="12s" begin="-8s" repeatCount="indefinite" path={OUTER} />
        <circle r="18" fill="#0F1222" />
        <path d="M-8 -5h10v10h-10z M2 -1l6-4v10l-6-4" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
      </g>
      <g>
        <animateMotion dur="8s" begin="-2s" repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" calcMode="linear" path={INNER} />
        <circle r="12" fill="#fff" stroke="#E4E6EE" />
        <path d="M-6 -4h12v8h-12z M-6 -3l6 4 6-4" fill="none" stroke="#5B3DF5" strokeWidth="1.6" strokeLinejoin="round" />
      </g>
      <path d="M40 18l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#5B3DF5">
        <animate attributeName="opacity" values="0;1;0" dur="2.4s" repeatCount="indefinite" />
      </path>
      <path d="M300 128l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#9BB52A">
        <animate attributeName="opacity" values="0;1;0" dur="2.4s" begin="1.2s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}
