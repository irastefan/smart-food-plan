import { useId } from "react";

type WellinLogoMarkProps = {
  size?: number | string;
};

export function WellinLogoMark({ size = 26 }: WellinLogoMarkProps) {
  const gradientId = useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="10" y1="80" x2="88" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#04624f" />
          <stop offset="0.38" stopColor="#0c8e74" />
          <stop offset="0.72" stopColor="#26b96d" />
          <stop offset="1" stopColor="#8fe24d" />
        </linearGradient>
      </defs>
      <circle
        cx="50"
        cy="50"
        r="33"
        stroke={`url(#${gradientId})`}
        strokeWidth="16"
        strokeLinecap="round"
      />
    </svg>
  );
}
