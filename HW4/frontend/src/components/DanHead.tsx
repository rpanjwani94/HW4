/** A small portrait of the mascot, used as the shop assistant's avatar. */
export default function DanHead({ size = 34 }: { size?: number }) {
  return (
    <svg className="dan-head" width={size} height={size} viewBox="108 0 68 68" aria-hidden="true">
      <circle cx="142" cy="34" r="33" fill="var(--yale-blue)" />
      <rect x="112" y="10" width="58" height="52" rx="24" fill="#f8f4ea" stroke="#d3c8b0" strokeWidth="1.5" />
      <path d="M120 20q-12-14-3-19 12 2 16 15z" fill="#a8703a" />
      <ellipse cx="143" cy="28" rx="11.5" ry="10" fill="#a8703a" />
      <ellipse cx="158" cy="42" rx="17" ry="13" fill="#f8f4ea" stroke="#d3c8b0" strokeWidth="1.5" />
      <rect x="161" y="33" width="13" height="10" rx="5" fill="#2b2118" />
      <path d="M142 52q-2 10 8 12 14 3 22-5 0-9-6-9z" fill="#f8f4ea" stroke="#d3c8b0" strokeWidth="1.5" />
      <path d="M146 50q11 8 26 0" fill="none" stroke="#6b4a2a" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="144" cy="28" r="5.2" fill="#fff" />
      <circle cx="145.2" cy="28.6" r="3.2" fill="#2b2118" />
      <circle cx="146.3" cy="27.4" r="1" fill="#fff" />
    </svg>
  )
}
