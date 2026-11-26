export function LogoMark({ size = 36, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Casa Gohan"
    >
      <circle cx="50" cy="50" r="50" fill="var(--brand)" />
      <circle cx="50" cy="50" r="44" fill="none" stroke="var(--cream)" strokeWidth="2.4" />
      <path
        d="M50 24c2.6 0 4.9 1.4 6.2 3.6l20.4 34.8c2.7 4.6-.6 10.4-5.9 10.4H29.3c-5.3 0-8.6-5.8-5.9-10.4l20.4-34.8C45.1 25.4 47.4 24 50 24z"
        fill="var(--cream)"
      />
      <rect x="40" y="56" width="20" height="16.8" rx="3" fill="var(--brand)" />
    </svg>
  )
}

export default function Logo({ size = 36, tone = 'dark', sub = true }) {
  return (
    <div className={`brand ${tone === 'light' ? 'brand-light' : ''}`}>
      <LogoMark size={size} />
      <div className="name">
        <b>Casa Gohan</b>
        {sub && <span>Brasil + Ásia</span>}
      </div>
    </div>
  )
}
