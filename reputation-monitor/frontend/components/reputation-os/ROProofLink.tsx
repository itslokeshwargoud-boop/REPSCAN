/**
 * ROProofLink — A consistent "Proof" link button used across all
 * Reputation OS modules to link every data point to its YouTube source.
 *
 * Validates proof URLs before rendering. Invalid proofs are shown as
 * non-clickable badges with a reason.
 *
 * Matches the rose-400 link style used in Dashboard and Talk pages.
 */

import {
  validateProofUrl,
  logProofRejection,
  type ProofValidationResult,
} from "@/lib/proofValidation";

interface ROProofLinkProps {
  href: string;
  label?: string;
  className?: string;
}

export default function ROProofLink({
  href,
  label = "Proof",
  className = "",
}: ROProofLinkProps) {
  if (!href) return null;

  const validation: ProofValidationResult = validateProofUrl(href);

  if (validation.status === "invalid") {
    logProofRejection("ROProofLink", href, validation);

    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 ${className}`}
        title={validation.reason}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <span>Invalid proof</span>
        <span className="text-slate-600 text-[9px]">
          ({validation.reason})
        </span>
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className={`inline-flex items-center gap-1 text-[10px] font-medium text-rose-400 hover:text-rose-300 transition-colors ${className}`}
    >
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
      {label}
    </a>
  );
}
