// Decorative animated constellation for the dark job-board header.
export default function JobsHeroArt() {
  return (
    <svg viewBox="0 0 420 240" width="420" height="240" aria-hidden="true" className="pointer-events-none absolute top-5 right-[4%] hidden opacity-90 lg:block">
      <g stroke="#343A58" strokeWidth="1.5" strokeDasharray="3 6" fill="none">
        <path d="M60 180 L170 70 L300 120 L380 40" />
        <path d="M170 70 L240 200" />
      </g>
      <path d="M60 180 L170 70 L300 120 L380 40" fill="none" stroke="#D7F75B" strokeWidth="2" strokeDasharray="420" strokeDashoffset="420">
        <animate attributeName="stroke-dashoffset" values="420;0;0;420" keyTimes="0;0.5;0.85;1" dur="7s" repeatCount="indefinite" />
      </path>
      <g transform="translate(60 180)">
        <circle r="20" fill="#1E2338" stroke="#5B3DF5" />
        <path d="M0 9s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z" fill="none" stroke="#fff" strokeWidth="1.8" />
      </g>
      <g transform="translate(170 70)">
        <circle r="24" fill="#5B3DF5">
          <animate attributeName="r" values="22;26;22" dur="2.4s" repeatCount="indefinite" />
        </circle>
        <path d="M-9 -3h18v12h-18z M-4 -3v-4h8v4" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
      </g>
      <g transform="translate(300 120)">
        <circle r="20" fill="#1E2338" stroke="#5B3DF5" />
        <path d="m-7 0 5 5 9-10" fill="none" stroke="#D7F75B" strokeWidth="2.4" strokeLinecap="round" />
      </g>
      <g transform="translate(240 200)">
        <circle r="14" fill="#1E2338" stroke="#343A58" />
        <circle r="4" fill="#B9A9FF">
          <animate attributeName="opacity" values="1;.3;1" dur="1.6s" repeatCount="indefinite" />
        </circle>
      </g>
      <g transform="translate(380 40)">
        <circle r="18" fill="#D7F75B" />
        <path d="M0 -8l2.4 5 5.6.8-4 3.9 1 5.5L0 4.6l-5 2.6 1-5.5-4-3.9 5.6-.8z" fill="#0F1222" />
      </g>
    </svg>
  );
}
