import { BadgeCheck } from "lucide-react";

export function PremiumBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-[#f4ebe6] px-2.5 py-1 text-xs font-semibold text-wedplan-rose ${className}`}
    >
      <BadgeCheck aria-hidden="true" className="h-3.5 w-3.5" />
      Premium vendor
    </span>
  );
}
