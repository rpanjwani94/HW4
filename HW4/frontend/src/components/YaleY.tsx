/** A serif "Y" mark in Yale blue. A stand-in drawn for this project; swap in the official artwork if you have a license. */
export default function YaleY({ size = 40, inverted = false }: { size?: number; inverted?: boolean }) {
  const fg = inverted ? 'var(--yale-blue)' : '#fff'
  const bg = inverted ? '#fff' : 'var(--yale-blue)'
  return (
    <svg className="yale-y" width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="Yale Y">
      <rect width="100" height="100" rx="18" fill={bg} />
      <path
        fill={fg}
        d="M14 16h30v6l-6 2 18 26 18-26-6-2v-6h26v6l-7 2-26 38v22l8 3v5H35v-5l8-3V54L17 24l-7-2z"
      />
    </svg>
  )
}
