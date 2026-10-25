import SectionHeading from "@/components/ui/SectionHeading";
import Badge from "@/components/ui/Badge";
import Reveal from "@/components/ui/Reveal";

const PATH = "M60 170 C160 60 250 60 330 140 S 500 220 600 150 S 760 60 870 120 S 1060 200 1140 100";
const LOOP = "10s";

// Each node lights up as the travelling scoop reaches it (`at` = fraction of the loop).
const NODES = [
  { x: 60, y: 170, label: "Post", labelY: 52, color: "#7C63FF", at: 0.01, icon: "M-7 -6h14v12h-14z M-4 -2h8 M-4 2h5" },
  { x: 330, y: 140, label: "Apply", labelY: 52, color: "#8F7BFF", at: 0.2, icon: "M-6 -8h8l5 5v11h-13z M2 -8v5h5" },
  { x: 600, y: 150, label: "Shortlist", labelY: -36, color: "#A5A2E8", at: 0.4, icon: "M0 -9l2.6 5.4 5.9.8-4.3 4.1 1 5.9L0 4.4l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z" },
  { x: 870, y: 120, label: "Interview", labelY: 52, color: "#BCCB9A", at: 0.6, icon: "M-9 -5h11v10h-11z M2 -1l7-4v10l-7-4" },
];

const STEPS = [
  { who: "HR · Post", text: "Role published with salary, requirements and screening questions." },
  { who: "Candidate · Apply", text: "CV, optional cover letter and answers submitted in minutes." },
  { who: "HR · Shortlist", text: "Shortlist the best, send kind rejections, archive the rest." },
  { who: "Both · Interview", text: "Invite arrives by email; the HD video room opens in Scoopy." },
  { who: "Both · Offer", text: "Offer sent and accepted — the tracker flips to Hired.", highlight: true },
];

function Pulse({ r, color, at, max = 40 }: { r: number; color: string; at: number; max?: number }) {
  const keyTimes = `0;${at};${Math.min(at + 0.11, 0.99)};1`;
  return (
    <circle r={r} fill="none" stroke={color} strokeWidth="2" opacity="0">
      <animate attributeName="r" values={`${r};${r};${max};${max}`} keyTimes={keyTimes} dur={LOOP} repeatCount="indefinite" />
      <animate attributeName="opacity" values="0;.9;0;0" keyTimes={keyTimes} dur={LOOP} repeatCount="indefinite" />
    </circle>
  );
}

function Toast({ x, y, width, fill, dot, text, from }: { x: number; y: number; width: number; fill: string; dot: string; text: string; from: number }) {
  const keyTimes = `0;${from};${from + 0.04};${from + 0.18};${from + 0.22};1`;
  return (
    <g opacity="0">
      <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes={keyTimes} dur={LOOP} repeatCount="indefinite" />
      <animateTransform
        attributeName="transform"
        type="translate"
        values={`${x} ${y};${x} ${y};${x} ${y - 8};${x} ${y - 8};${x} ${y - 16};${x} ${y - 16}`}
        keyTimes={keyTimes}
        dur={LOOP}
        repeatCount="indefinite"
      />
      <rect width={width} height="34" rx="17" fill={fill} />
      <circle cx="18" cy="17" r="5" fill={dot} />
      <text x="32" y="21" fill="#0F1222">
        {text}
      </text>
    </g>
  );
}

export function JourneySvg() {
  return (
    <svg
      viewBox="0 0 1200 260"
      width="100%"
      role="img"
      aria-label="Animated path showing a job application moving through Post, Apply, Shortlist, Interview and Offer"
      className="block overflow-visible"
    >
      <defs>
        <linearGradient id="journey-gradient" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#7C63FF" />
          <stop offset="1" stopColor="#D7F75B" />
        </linearGradient>
        <pattern id="journey-dots" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.2" fill="#2A2F45" />
        </pattern>
      </defs>
      <rect width="1200" height="260" fill="url(#journey-dots)" />
      <path id="journey-path" d={PATH} fill="none" stroke="#2A2F45" strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" />
      <path d={PATH} fill="none" stroke="url(#journey-gradient)" strokeWidth="4" strokeLinecap="round" strokeDasharray="1400" strokeDashoffset="1400">
        <animate attributeName="stroke-dashoffset" values="1400;0;0;1400" keyTimes="0;0.8;0.93;1" dur={LOOP} repeatCount="indefinite" />
      </path>

      <g fontFamily="var(--font-inter), sans-serif" fontSize="15" fontWeight="600" fill="#C3C7D6" textAnchor="middle">
        {NODES.map((n) => (
          <g key={n.label} transform={`translate(${n.x} ${n.y})`}>
            <Pulse r={22} color={n.color} at={n.at} />
            <circle r="22" fill="#161A2E" stroke={n.color} strokeWidth="2" />
            <path d={n.icon} fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <text y={n.labelY}>{n.label}</text>
          </g>
        ))}
        <g transform="translate(1140 100)">
          <Pulse r={26} color="#D7F75B" at={0.8} max={56} />
          <circle r="26" fill="#D7F75B" />
          <path d="M-8 0l5 5 11-11" fill="none" stroke="#0F1222" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <text y="-40" fill="#D7F75B">
            Offer
          </text>
        </g>
      </g>

      {/* The travelling Scoopy mark */}
      <g>
        <animateMotion dur={LOOP} repeatCount="indefinite" keyPoints="0;1;1;0" keyTimes="0;0.8;0.93;1" calcMode="linear">
          <mpath href="#journey-path" />
        </animateMotion>
        <animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.8;0.86;1" dur={LOOP} repeatCount="indefinite" />
        <circle r="18" fill="#5B3DF5" opacity=".35">
          <animate attributeName="r" values="14;22;14" dur="1.2s" repeatCount="indefinite" />
        </circle>
        <g transform="translate(-13 -13) scale(.765)">
          <rect width="34" height="34" rx="10" fill="#5B3DF5" />
          <path d="M9 17a8 8 0 0 1 16 0z" fill="#fff" />
          <path d="M11 19h12l-6 8z" fill="#D7F75B" />
        </g>
      </g>

      <g fontFamily="var(--font-inter), sans-serif" fontSize="12" fontWeight="600">
        <Toast x={380} y={30} width={180} fill="#fff" dot="#1A9F5B" text="CV received · Daniel A." from={0.24} />
        <Toast x={680} y={200} width={190} fill="#D7F75B" dot="#E5484D" text="Live · Interview room open" from={0.64} />
      </g>
    </svg>
  );
}

export default function JourneySection() {
  return (
    <section id="journey" className="pt-16 pb-6 sm:pt-[88px]">
      <div className="container-page">
        <SectionHeading
          eyebrow="The Scoopy journey"
          title="One application. One clear path to an offer."
          description="Every application moves through the same five steps — and both sides can see exactly where it is."
          className="mb-10"
        />
        <Reveal className="relative overflow-hidden rounded-[32px] bg-ink p-5 sm:p-10">
          <div className="pointer-events-none absolute -bottom-56 -left-28 size-[420px] rounded-full bg-violet opacity-35 blur-[120px]" />
          <div className="relative flex justify-end">
            <Badge tone="glow" pulse>
              Live preview
            </Badge>
          </div>
          {/* On phones the path keeps a readable size and scrolls sideways. */}
          <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:overflow-visible sm:px-0">
            <div className="min-w-[720px] sm:min-w-0">
              <JourneySvg />
            </div>
          </div>
          <p className="mt-1 text-center text-xs text-[#8e94ad] sm:hidden">Swipe to follow the journey →</p>
          <div className="relative mt-7 grid gap-3 border-t border-ink-4 pt-6 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((s) => (
              <div key={s.who}>
                <div className={`text-[11px] font-bold tracking-[0.1em] uppercase ${s.highlight ? "text-lime" : "text-[#b9a9ff]"}`}>{s.who}</div>
                <p className="mt-2 text-sm leading-relaxed text-[#c3c7d6]">{s.text}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
