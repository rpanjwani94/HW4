/** A calm, proud white bulldog with a brown patch and a Yale-blue blanket, strolling along the bottom of every page. */
const WHITE = '#f8f4ea'
const SHADE = '#e9e1d0'
const LINE = '#d3c8b0'
const PATCH = '#a8703a'

function Leg({ x, cls, shade = false }: { x: number; cls: string; shade?: boolean }) {
  return (
    <g className={`leg ${cls}`}>
      <rect x={x} y="60" width="18" height="32" rx="9" fill={shade ? SHADE : WHITE} stroke={LINE} strokeWidth="1.5" />
    </g>
  )
}

export default function Bulldog() {
  return (
    <div className="bulldog-track" aria-hidden="true">
      <div className="bulldog">
        <svg viewBox="0 0 180 100" width="150" height="83" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 46q-11-3-11-12 9-1 17 9z" fill={SHADE} stroke={LINE} strokeWidth="1.5" />
          <Leg x={26} cls="b1" shade />
          <Leg x={86} cls="f1" shade />
          <ellipse cx="66" cy="52" rx="48" ry="27" fill={WHITE} stroke={LINE} strokeWidth="1.5" />
          <path d="M38 36q4-14 30-14t30 14q2 12-2 18-28 8-58 0-4-8 0-18z" fill="var(--yale-blue)" />
          <path d="M40 48q27 9 56 0M41 52q27 8 54 0" fill="none" stroke="#fff" strokeWidth="1.6" opacity=".85" />
          <path
            fill="#fff"
            transform="translate(53 23) scale(.28)"
            d="M14 16h30v6l-6 2 18 26 18-26-6-2v-6h26v6l-7 2-26 38v22l8 3v5H35v-5l8-3V54L17 24l-7-2z"
          />
          <ellipse cx="106" cy="56" rx="23" ry="22" fill={WHITE} stroke={LINE} strokeWidth="1.5" />
          <Leg x={46} cls="b2" />
          <Leg x={106} cls="f2" />
          <rect x="112" y="10" width="58" height="52" rx="24" fill={WHITE} stroke={LINE} strokeWidth="1.5" />
          <path d="M120 20q-12-14-3-19 12 2 16 15z" fill={PATCH} />
          <ellipse cx="143" cy="28" rx="11.5" ry="10" fill={PATCH} />
          <path d="M138 14q5 3 10 0M137 19q6 3 12 0" fill="none" stroke={LINE} strokeWidth="1.8" strokeLinecap="round" />
          <ellipse cx="158" cy="42" rx="17" ry="13" fill={WHITE} stroke={LINE} strokeWidth="1.5" />
          <path d="M152 32q6 3 12 0M150 27q8 4 16 0" fill="none" stroke={LINE} strokeWidth="1.5" strokeLinecap="round" />
          <rect x="161" y="33" width="13" height="10" rx="5" fill="#2b2118" />
          <path d="M142 52q-2 10 8 12 14 3 22-5 0-9-6-9z" fill={WHITE} stroke={LINE} strokeWidth="1.5" />
          <path d="M146 50q11 8 26 0" fill="none" stroke="#6b4a2a" strokeWidth="2.2" strokeLinecap="round" />
          <path className="tongue" d="M154 58q0 9 5 9t2-9z" fill="#f08c9b" />
          <circle cx="144" cy="28" r="5.2" fill="#fff" />
          <circle cx="145.2" cy="28.6" r="3.2" fill="#2b2118" />
          <circle cx="146.3" cy="27.4" r="1" fill="#fff" />
          <path d="M136 20q6-4 14-1" fill="none" stroke="#6b4a2a" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  )
}
