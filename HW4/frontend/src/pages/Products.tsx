import { useEffect, useRef, useState } from 'react'
import { fetchProducts } from '../api'
import type { Product } from '../api'
import ProductCard from '../components/ProductCard'
import { useChat } from '../chat'
import { FAMILIES, familyOf } from '../shop'

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const { picks, clearPicks } = useChat()
  const picksRef = useRef<HTMLDivElement>(null)
  const [family, setFamily] = useState<string>('All')
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading')

  useEffect(() => {
    fetchProducts()
      .then((p) => {
        setProducts(p)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [])

  useEffect(() => {
    if (picks.length > 0) picksRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  }, [picks])

  return (
    <section className="page wide">
      <p className="eyebrow">The collection</p>
      <h1>Shop Yale gear</h1>
      {picks.length > 0 && (
        <div className="picks" ref={picksRef} aria-live="polite">
          <h2>Picked for you by the shop assistant ({picks.length})</h2>
          <ul className="product-grid">
            {picks.map((p) => (
              <ProductCard key={p.product_id} product={p} />
            ))}
          </ul>
          <button className="button secondary" onClick={clearPicks}>Clear picks</button>
        </div>
      )}
      {status === 'loading' && <p role="status">Loading products…</p>}
      {status === 'error' && (
        <p className="note error" role="alert">
          We couldn't load the products. Please check that the backend is running and try again.
        </p>
      )}
      {status === 'ready' && (
        <>
          <div className="chips" role="group" aria-label="Filter by kind">
            {['All', ...FAMILIES].map((f) => {
              const count = f === 'All' ? products.length : products.filter((p) => familyOf(p) === f).length
              if (count === 0) return null
              return (
                <button key={f} type="button" className={`chip${family === f ? ' on' : ''}`} aria-pressed={family === f} onClick={() => setFamily(f)}>
                  {f} <small>{count}</small>
                </button>
              )
            })}
          </div>
          <ul className="product-grid">
            {products.filter((p) => family === 'All' || familyOf(p) === family).map((p) => (
              <ProductCard key={p.product_id} product={p} />
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
