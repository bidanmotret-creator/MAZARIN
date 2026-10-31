export default function Logo({ ukuran = 30, className }: { ukuran?: number; className?: string }) {
  return (
    <svg className={className} width={ukuran} height={ukuran} viewBox="-52 -52 104 104" fill="none" aria-hidden="true">
      <path d="M43.2 -15.7 A46 46 0 1 1 15.7 -43.2" stroke="currentColor" strokeWidth="6" />
      <g transform="translate(-12.8,-37.2) scale(0.7)">
        <path d="M0 80 V36 L32 66 L64 6 V80" stroke="currentColor" strokeWidth="10" strokeMiterlimit="10" />
        <circle cx="64" cy="6" r="11" fill="#1D9E75" />
      </g>
    </svg>
  );
}