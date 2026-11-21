import Link from "next/link";

type BrandLogoProps = {
  className?: string;
  iconClassName?: string;
  wordmarkClassName?: string;
  showWordmark?: boolean;
  onClick?: () => void;
};

export function BrandLogo({
  className = "",
  iconClassName = "h-10 w-10",
  wordmarkClassName = "text-xl",
  showWordmark = true,
  onClick,
}: BrandLogoProps) {
  return (
    <Link
      href="/"
      aria-label="WedPlan home"
      onClick={onClick}
      className={`flex items-center gap-2.5 ${className}`}
    >
      <svg
        viewBox="0 0 64 64"
        aria-hidden="true"
        className={`${iconClassName} shrink-0`}
      >
        <rect width="64" height="64" rx="16" fill="#fffaf7" />
        <circle
          cx="26"
          cy="35"
          r="13"
          fill="none"
          stroke="#96575b"
          strokeWidth="5"
        />
        <circle
          cx="39"
          cy="35"
          r="13"
          fill="none"
          stroke="#c79a6b"
          strokeWidth="5"
        />
        <path
          d="M32 8l1.7 4.6L38.3 14l-4.6 1.7L32 20.3l-1.7-4.6L25.7 14l4.6-1.4z"
          fill="#96575b"
        />
      </svg>

      {showWordmark && (
        <span
          className={`${wordmarkClassName} font-semibold tracking-tight text-wedplan-ink`}
        >
          Wed<span className="text-wedplan-rose">Plan</span>
        </span>
      )}
    </Link>
  );
}
