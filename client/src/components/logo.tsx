export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      width="28"
      height="28"
      className={className}
      role="img"
      aria-label="Escala Certa"
    >
      <rect width="40" height="40" rx="9" className="fill-primary" />
      <line x1="10" y1="13" x2="26" y2="13" stroke="hsl(var(--primary-foreground))" strokeWidth="3" strokeLinecap="round" />
      <line x1="10" y1="20" x2="30" y2="20" stroke="hsl(var(--primary-foreground))" strokeWidth="3" strokeLinecap="round" />
      <line x1="10" y1="27" x2="20" y2="27" stroke="hsl(var(--primary-foreground))" strokeWidth="3" strokeLinecap="round" />
      <circle cx="27" cy="27" r="4.5" fill="hsl(var(--primary-foreground))" />
      <path
        d="M25.1 27.1l1.2 1.2 2.4-2.6"
        className="stroke-primary"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
