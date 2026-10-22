/** Original flat illustrations for the shop's gear categories. */
export type ArtKind = 'bottle' | 'tote' | 'tumbler' | 'mug' | 'journal' | 'pen' | 'sticky'

const BLUE = '#00356b'
const MID = '#286dc0'
const SKY = '#9dc3f0'
const WHITE = '#ffffff'
const CREAM = '#efe6d2'
const YELLOW = '#ffd84d'

function Y({ x, y, s = 1, fill = WHITE }: { x: number; y: number; s?: number; fill?: string }) {
  return (
    <path
      fill={fill}
      transform={`translate(${x} ${y}) scale(${s * 0.3})`}
      d="M14 16h30v6l-6 2 18 26 18-26-6-2v-6h26v6l-7 2-26 38v22l8 3v5H35v-5l8-3V54L17 24l-7-2z"
    />
  )
}

const SHAPES: Record<ArtKind, React.ReactNode> = {
  bottle: (
    <g>
      <rect x="42" y="8" width="36" height="14" rx="5" fill="#1d1d1d" />
      <rect x="48" y="22" width="24" height="10" fill={SKY} />
      <path d="M36 34a8 8 0 0 1 8-8h32a8 8 0 0 1 8 8v70a8 8 0 0 1-8 8H44a8 8 0 0 1-8-8z" fill={BLUE} />
      <rect x="36" y="64" width="48" height="14" fill={WHITE} opacity=".15" />
      <Y x={46} y={38} s={0.9} />
      <path d="M84 16c14 0 14 18 0 18" fill="none" stroke="#1d1d1d" strokeWidth="5" />
      <rect x="42" y="38" width="5" height="60" rx="2.5" fill={WHITE} opacity=".25" />
    </g>
  ),
  tote: (
    <g>
      <path d="M40 48V30a20 20 0 0 1 40 0v18" fill="none" stroke={BLUE} strokeWidth="6" strokeLinecap="round" />
      <path d="M22 46h76l6 64H16z" fill={CREAM} />
      <path d="M22 46h76l1 10H21z" fill="#e2d6bb" />
      <rect x="40" y="66" width="40" height="30" rx="4" fill={BLUE} />
      <Y x={48} y={67} s={0.95} />
    </g>
  ),
  tumbler: (
    <g>
      <rect x="36" y="14" width="48" height="12" rx="6" fill="#1d1d1d" />
      <rect x="62" y="2" width="6" height="16" rx="3" transform="rotate(14 65 10)" fill={MID} />
      <path d="M32 28h56l-6 78a6 6 0 0 1-6 6H44a6 6 0 0 1-6-6z" fill={BLUE} />
      <rect x="35" y="50" width="50" height="22" fill={WHITE} opacity=".12" />
      <Y x={46} y={42} s={0.95} />
      <rect x="40" y="34" width="5" height="64" rx="2.5" fill={WHITE} opacity=".25" />
    </g>
  ),
  mug: (
    <g>
      <path d="M44 6c-6 8 6 12 0 20M60 4c-6 8 6 12 0 20M76 6c-6 8 6 12 0 20" fill="none" stroke={SKY} strokeWidth="4" strokeLinecap="round" />
      <path d="M92 52c20-2 20 30 0 32" fill="none" stroke={BLUE} strokeWidth="9" strokeLinecap="round" />
      <path d="M24 34h70v58a12 12 0 0 1-12 12H36a12 12 0 0 1-12-12z" fill={BLUE} />
      <rect x="24" y="34" width="70" height="8" fill={MID} />
      <Y x={44} y={50} s={1.1} />
    </g>
  ),
  journal: (
    <g>
      <rect x="26" y="12" width="68" height="96" rx="6" fill={BLUE} />
      <rect x="26" y="12" width="10" height="96" rx="4" fill="#00274f" />
      <rect x="82" y="12" width="6" height="96" fill={MID} />
      <rect x="46" y="30" width="30" height="36" rx="3" fill="none" stroke={WHITE} strokeWidth="2" opacity=".7" />
      <Y x={52} y={34} s={0.95} />
      <rect x="46" y="76" width="30" height="3" rx="1.5" fill={WHITE} opacity=".6" />
      <rect x="46" y="84" width="22" height="3" rx="1.5" fill={WHITE} opacity=".6" />
    </g>
  ),
  pen: (
    <g transform="rotate(-38 60 60)">
      <rect x="54" y="2" width="12" height="82" rx="6" fill={BLUE} />
      <rect x="54" y="20" width="12" height="8" fill={WHITE} />
      <rect x="66" y="8" width="4" height="40" rx="2" fill="#b7c3d4" />
      <path d="M54 84h12l-6 26z" fill="#d9dee6" />
      <path d="M58 100h4l-2 10z" fill="#1d1d1d" />
      <rect x="54" y="76" width="12" height="6" fill={MID} />
    </g>
  ),
  sticky: (
    <g>
      <rect x="30" y="30" width="64" height="64" rx="3" fill="#f2c230" transform="rotate(5 62 62)" />
      <rect x="22" y="24" width="64" height="64" rx="3" fill={YELLOW} />
      <path d="M86 88V70l-18 18z" fill="#e0b82f" />
      <rect x="22" y="24" width="64" height="12" rx="3" fill={BLUE} />
      <Y x={25} y={25} s={0.4} />
      <rect x="32" y="46" width="40" height="3" rx="1.5" fill="#b9972a" />
      <rect x="32" y="55" width="34" height="3" rx="1.5" fill="#b9972a" />
      <rect x="32" y="64" width="28" height="3" rx="1.5" fill="#b9972a" />
    </g>
  ),
}

export default function Art({ kinds, label }: { kinds: ArtKind[]; label: string }) {
  return (
    <div className="art" role="img" aria-label={label}>
      {kinds.map((k) => (
        <svg key={k} viewBox="0 0 120 120" aria-hidden="true">{SHAPES[k]}</svg>
      ))}
    </div>
  )
}
