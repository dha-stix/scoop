import Button from "./Button";

type Props = { title: string; description?: string; actionLabel?: string; actionHref?: string };

// Friendly placeholder for empty lists, with an animated SVG scoop.
export default function EmptyState({ title, description, actionLabel, actionHref }: Props) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <svg width="120" height="96" viewBox="0 0 120 96" aria-hidden="true">
        <ellipse cx="60" cy="88" rx="34" ry="5" fill="#E4E6EE">
          <animate attributeName="rx" values="34;28;34" dur="3s" repeatCount="indefinite" />
        </ellipse>
        <g>
          <animateTransform attributeName="transform" type="translate" values="0 0;0 -8;0 0" dur="3s" repeatCount="indefinite" />
          <rect x="34" y="14" width="52" height="52" rx="16" fill="#5B3DF5" />
          <path d="M47 40a13 13 0 0 1 26 0z" fill="#fff" />
          <path d="M50 44h20l-10 13z" fill="#D7F75B" />
        </g>
        <path d="M18 24l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#B9A9FF">
          <animate attributeName="opacity" values="0;1;0" dur="2.4s" repeatCount="indefinite" />
        </path>
        <path d="M100 12l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" fill="#9BB52A">
          <animate attributeName="opacity" values="0;1;0" dur="2.4s" begin="1.2s" repeatCount="indefinite" />
        </path>
      </svg>
      <h3 className="mt-4 text-xl font-bold">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-muted">{description}</p>}
      {actionHref && actionLabel && (
        <Button href={actionHref} className="mt-5">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
