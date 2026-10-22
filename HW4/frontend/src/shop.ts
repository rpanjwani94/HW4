import type { Product } from './api'

export const FAMILIES = ['Hoodies', 'Sweatshirts', 'T-shirts', 'Jackets & zips', 'More'] as const
export type Family = (typeof FAMILIES)[number]

/** Groups the catalogue's many garment labels into a few shopper-friendly kinds. */
export function familyOf(p: Product): Family {
  const g = `${p.garment_type} ${p.name}`.toLowerCase()
  if (/hood/.test(g)) return 'Hoodies'
  if (/zip|jacket|fleece|vest/.test(g)) return 'Jackets & zips'
  if (/t-?shirt|\btee\b/.test(g)) return 'T-shirts'
  if (/crew|sweatshirt|pullover/.test(g)) return 'Sweatshirts'
  return 'More'
}

const SWATCHES: Record<string, string> = {
  navy: '#14284b', 'navy blue': '#14284b', blue: '#286dc0', royal: '#2a4fb0', 'yale blue': '#00356b',
  white: '#ffffff', 'heather gray': '#9aa0a6', 'heather grey': '#9aa0a6', gray: '#8a9099', grey: '#8a9099',
  'dark heather gray': '#5b6168', charcoal: '#36454f', black: '#1d1d1d', red: '#b3261e', maroon: '#6d1a2c',
  green: '#2f6b46', cream: '#efe6d2', tan: '#c9a77a', brown: '#6b4a2a', gold: '#c9a24b', yellow: '#e7c53b',
  orange: '#d9772b', pink: '#e79ab3', purple: '#5b3a8a', silver: '#c0c5cc',
}

export function swatch(name: string): string {
  const key = name.toLowerCase().trim()
  if (SWATCHES[key]) return SWATCHES[key]
  const last = key.split(/\s+/).pop() ?? ''
  return SWATCHES[last] ?? '#cbd5e1'
}

/** Short badge for cards: tells shoppers when sizes are running out. */
export function stockBadge(p: Product): string | null {
  const sizes = p.inventory.filter((s) => s.quantity > 0).length
  if (sizes === 0) return 'Sold out'
  return sizes <= 2 ? 'Few sizes left' : null
}
