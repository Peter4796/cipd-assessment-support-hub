import type { SVGProps } from "react";
import type { IconName } from "@/content/services";

/**
 * Lightweight inline icon set (stroke style) used across service cards etc.
 * Add new icons by extending the `paths` map and the IconName union.
 */
const paths: Record<string, JSX.Element> = {
  brief: (
    <>
      <path d="M8 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M8 11h8M8 15h5" />
    </>
  ),
  map: (
    <>
      <path d="M9 6 3 4v14l6 2 6-2 6 2V6l-6-2-6 2Z" />
      <path d="M9 4v14M15 6v14" />
    </>
  ),
  structure: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M17.5 14v3.5M14 17.5h7" />
    </>
  ),
  research: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  review: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </>
  ),
  edit: (
    <>
      <path d="M4 20h16" />
      <path d="m14.5 5.5 4 4L8 20l-4 1 1-4Z" />
    </>
  ),
  reference: (
    <>
      <path d="M4 19.5V6a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2Z" />
      <path d="M8 8h8M8 12h6" />
    </>
  ),
  resubmit: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </>
  ),
  feedback: (
    <>
      <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
      <path d="M9 10h6" />
    </>
  ),
  coaching: (
    <>
      <path d="M12 3 3 8l9 5 9-5-9-5Z" />
      <path d="M7 10.5V16c0 1 2.5 2.5 5 2.5s5-1.5 5-2.5v-5.5" />
    </>
  ),
  originality: (
    <>
      <path d="M12 3 4 6v5c0 5 3.4 8.2 8 10 4.6-1.8 8-5 8-10V6Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  check: <path d="m5 13 4 4L19 7" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  download: <path d="M12 4v11m0 0 4-4m-4 4-4-4M5 20h14" />,
  whatsapp: (
    <path d="M12 2a10 10 0 0 0-8.7 15l-1.3 5 5.2-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1-.4-.1-.9-.3-1.6-.6-2.7-1.2-4.5-4-4.6-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 .9-2.2c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5.2.6.8 2 .9 2.1.1.1.1.3 0 .5-.1.2-.1.3-.3.5-.1.2-.3.4-.4.5-.1.1-.3.3-.1.6.1.3.7 1.1 1.4 1.8.9.8 1.7 1.1 2 1.2.2.1.4.1.5-.1.1-.2.6-.7.8-.9.2-.3.3-.2.6-.1.2.1 1.5.7 1.7.8.3.1.4.2.5.3.1.2.1.7-.1 1.3Z" />
  ),
};

export function Icon({
  name,
  className = "h-6 w-6",
  filled = false,
  ...props
}: { name: IconName | "check" | "arrow" | "whatsapp" | "download"; className?: string; filled?: boolean } & SVGProps<SVGSVGElement>) {
  const isFilled = filled || name === "whatsapp";
  return (
    <svg
      viewBox="0 0 24 24"
      fill={isFilled ? "currentColor" : "none"}
      stroke={isFilled ? "none" : "currentColor"}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {paths[name] ?? paths.brief}
    </svg>
  );
}
